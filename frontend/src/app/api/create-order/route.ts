import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { CHECKOUT_PLAN_KEYS, getPlanPricing } from "@/lib/membership-plans";
import { createCashfreeOrder } from "@/lib/cashfree";
import { supabaseAdmin, assertSupabaseAdminConfigured } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    assertSupabaseAdminConfigured();

    // ── 1. Authenticate Requesting User Server-Side ─────────────────────────
    // Never trust client-supplied userId, email, or name
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required to purchase a membership plan. Please log in." },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authErr,
    } = await supabaseAdmin.auth.getUser(token);

    if (authErr || !user) {
      return NextResponse.json(
        { error: "Invalid or expired session. Please log in again." },
        { status: 401 }
      );
    }

    // Retrieve verified user profile from database
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("id, name, mobile, email, auth_email")
      .eq("id", user.id)
      .maybeSingle();

    if (profileErr || !profile) {
      return NextResponse.json(
        { error: "User profile not found. Please complete your registration before purchasing." },
        { status: 404 }
      );
    }

    // ── 2. Validate Plan Key & Calculate Server-Side Pricing ────────────────
    const body = await req.json();
    const { planKey } = body as { planKey?: string };

    if (!planKey) {
      return NextResponse.json(
        { error: "Plan key is required." },
        { status: 400 }
      );
    }

    if (!CHECKOUT_PLAN_KEYS.includes(planKey as any)) {
      return NextResponse.json(
        {
          error: `Invalid membership plan "${planKey}". Allowed plans: ${CHECKOUT_PLAN_KEYS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const pricing = getPlanPricing(planKey);
    if (!pricing) {
      return NextResponse.json(
        { error: `Pricing calculation failed for plan "${planKey}".` },
        { status: 400 }
      );
    }

    // ── 3. Customer Phone & Email Validation ────────────────────────────────
    let customerPhone = (profile.mobile || body.userPhone || "").replace(/\D/g, "");
    if (customerPhone.length > 10 && customerPhone.startsWith("91")) {
      customerPhone = customerPhone.slice(2);
    }

    const isProduction =
      process.env.NODE_ENV === "production" ||
      (process.env.CASHFREE_ENVIRONMENT || "").toUpperCase() === "PRODUCTION";

    if (customerPhone.length !== 10) {
      if (isProduction) {
        return NextResponse.json(
          {
            error:
              "A valid 10-digit mobile number on your profile is required to initiate payment.",
          },
          { status: 400 }
        );
      }
      customerPhone = "9999999999"; // Sandbox fallback
    }

    const customerEmail =
      body.userEmail || profile.email || profile.auth_email || user.email || "member@elitetamilmatrimony.com";
    const customerName = profile.name || body.userName || "Member";

    // ── 4. Collision-Resistant Order ID & Validated Origin ──────────────────
    const randomHex = crypto.randomBytes(4).toString("hex");
    const sanitizedUserId = user.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
    // Format: ETM_<userId8>_<timestamp>_<hex8> (<= 36 chars, well within Cashfree 45-char limit)
    const orderId = `ETM_${sanitizedUserId}_${Date.now()}_${randomHex}`;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
    let origin = req.headers.get("origin") || req.nextUrl.origin || "http://localhost:3000";
    if (appUrl) {
      try {
        const parsed = new URL(appUrl);
        origin = parsed.origin;
      } catch {
        // Fall back to request origin
      }
    }
    const returnUrl = `${origin}/payment/status?order_id={order_id}`;

    // ── 5. Create Order with Cashfree Gateway ───────────────────────────────
    const cashfreeOrder = await createCashfreeOrder({
      orderId,
      orderAmount: pricing.total,
      customerId: user.id,
      customerPhone,
      customerName,
      customerEmail,
      returnUrl,
      orderNote: `Membership: ${pricing.name} (${pricing.period})`,
    });

    if (!cashfreeOrder.payment_session_id) {
      throw new Error("Cashfree did not return a payment_session_id.");
    }

    // ── 6. Persist Pending Order Record in Database ─────────────────────────
    // Critical: If the pending record cannot be persisted, fail immediately and
    // do not return a usable payment session to the client.
    const { error: insertErr } = await supabaseAdmin.from("payments").insert({
      order_id: orderId,
      user_id: user.id,
      gateway: "cashfree",
      plan_key: planKey,
      amount: pricing.total,
      currency: "INR",
      status: "pending",
      payment_method: "CASHFREE",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (insertErr) {
      console.error("[create-order] Database error persisting pending payment:", insertErr.message);
      return NextResponse.json(
        {
          error: "Failed to persist payment order record. Please try again or contact support.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      order_id: cashfreeOrder.order_id,
      cf_order_id: cashfreeOrder.cf_order_id,
      payment_session_id: cashfreeOrder.payment_session_id,
      order_amount: pricing.total,
      currency: "INR",
      plan_key: planKey,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[create-order] Error:", error.message);

    if (
      error.message?.includes("credentials are not configured") ||
      error.message?.includes("placeholder values")
    ) {
      return NextResponse.json(
        {
          error:
            "Cashfree credentials are not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in your .env.local file.",
          code: "MISSING_CREDENTIALS",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create Cashfree payment order." },
      { status: 500 }
    );
  }
}
