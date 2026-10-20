import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, assertSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { MEMBERSHIP_PLANS, CHECKOUT_PLAN_KEYS, getPlanPricing } from "@/lib/membership-plans";
import { getCashfreeOrder, getCashfreeOrderPayments } from "@/lib/cashfree";
import { activateMembershipOrder } from "@/lib/membership-activation";

export async function POST(req: NextRequest) {
  try {
    assertSupabaseAdminConfigured();

    // ── 1. Authenticate Requesting User Server-Side ─────────────────────────
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required to verify payment. Please log in." },
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

    const body = await req.json();
    const { order_id } = body as { order_id?: string };

    if (!order_id) {
      return NextResponse.json({ error: "order_id is required." }, { status: 400 });
    }

    // ── 2. Load Persisted Order Record from Database ────────────────────────
    // Never trust client-supplied plan, amount, or userId
    const { data: orderRecord, error: orderFetchErr } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("order_id", order_id)
      .maybeSingle();

    if (orderFetchErr || !orderRecord) {
      return NextResponse.json(
        { error: `Payment order record "${order_id}" not found in database.` },
        { status: 404 }
      );
    }

    // ── 3. Strict Ownership & Plan Validation ───────────────────────────────
    // An order cannot be verified or activated for a different user
    if (orderRecord.user_id !== user.id) {
      console.warn(
        `[verify-payment] Unauthorized verification attempt: User ${user.id} tried to verify order ${order_id} belonging to user ${orderRecord.user_id}`
      );
      return NextResponse.json(
        { error: "Unauthorized: You do not own this order." },
        { status: 403 }
      );
    }

    // Fail-Closed: Validate plan key, never silently default to Gold
    if (
      !orderRecord.plan_key ||
      !(orderRecord.plan_key in MEMBERSHIP_PLANS) ||
      !CHECKOUT_PLAN_KEYS.includes(orderRecord.plan_key as any)
    ) {
      return NextResponse.json(
        { error: `Order record has invalid or uncheckoutable plan key: "${orderRecord.plan_key}".` },
        { status: 400 }
      );
    }

    const planInfo = MEMBERSHIP_PLANS[orderRecord.plan_key];

    // If order is already completed, return success immediately (Idempotency)
    if (orderRecord.status === "success") {
      const { data: userProfile } = await supabaseAdmin
        .from("profiles")
        .select("membership_expiry")
        .eq("id", user.id)
        .maybeSingle();

      return NextResponse.json({
        success: true,
        alreadyActive: true,
        order_id,
        plan: planInfo.name,
        planKey: orderRecord.plan_key,
        planPeriod: planInfo.period,
        expiry: userProfile?.membership_expiry,
      });
    }

    // ── 4. Query Cashfree Server-Side to Verify Payment ─────────────────────
    let isSuccess = false;
    let paymentId = "";
    let confirmedAmount: number | null = null;
    let paymentMethod = "CASHFREE";

    try {
      const payments = await getCashfreeOrderPayments(order_id);
      if (Array.isArray(payments) && payments.length > 0) {
        const successfulTxn = payments.find(
          (p: any) => p.payment_status === "SUCCESS"
        );
        if (successfulTxn) {
          isSuccess = true;
          paymentId = String(successfulTxn.cf_payment_id || order_id);
          confirmedAmount = successfulTxn.payment_amount ?? null;
          paymentMethod = successfulTxn.payment_group || "CASHFREE";

          // Verify currency is INR
          if (
            successfulTxn.payment_currency &&
            successfulTxn.payment_currency.toUpperCase() !== "INR"
          ) {
            return NextResponse.json(
              { error: `Payment currency mismatch. Expected INR, received ${successfulTxn.payment_currency}.` },
              { status: 400 }
            );
          }
        }
      }
    } catch (fetchErr) {
      console.warn("[verify-payment] Error fetching order payments, falling back to order fetch:", fetchErr);
    }

    // Fallback: Check order status directly
    if (!isSuccess) {
      try {
        const orderData = await getCashfreeOrder(order_id);
        if (orderData.order_status === "PAID") {
          isSuccess = true;
          paymentId = String(orderData.cf_order_id || order_id);
          confirmedAmount = orderData.order_amount ?? null;

          // Verify currency is INR
          if (
            orderData.order_currency &&
            orderData.order_currency.toUpperCase() !== "INR"
          ) {
            return NextResponse.json(
              { error: `Payment currency mismatch. Expected INR, received ${orderData.order_currency}.` },
              { status: 400 }
            );
          }
        } else {
          return NextResponse.json(
            {
              error: `Payment not completed. Current order status: ${orderData.order_status}`,
              order_status: orderData.order_status,
            },
            { status: 400 }
          );
        }
      } catch (orderErr: any) {
        console.error("[verify-payment] Failed to verify order with Cashfree:", orderErr.message);
        return NextResponse.json(
          { error: "Could not verify order with payment gateway. Please contact support." },
          { status: 502 }
        );
      }
    }

    if (!isSuccess || confirmedAmount === null) {
      return NextResponse.json(
        { error: "Payment verification failed. No successful payment found for this order." },
        { status: 400 }
      );
    }

    // ── 5. Verify Exact Paid Amount Against Authoritative Plan Pricing ─────
    // Validate persisted order amount against authoritative server-side plan price + 18% GST
    const authoritativePricing = getPlanPricing(orderRecord.plan_key);
    if (!authoritativePricing || Math.abs(Number(orderRecord.amount) - authoritativePricing.total) >= 0.01) {
      console.error(
        `[verify-payment] Order record amount (${orderRecord.amount}) does not match authoritative plan pricing (${authoritativePricing?.total}) for plan "${orderRecord.plan_key}".`
      );
      return NextResponse.json(
        { error: "Order record amount does not match authoritative plan pricing." },
        { status: 400 }
      );
    }

    const expectedAmount = authoritativePricing.total;
    // Remove rounded comparison that could accept incorrect amounts; require exact match to 2 decimal places
    if (Math.abs(confirmedAmount - expectedAmount) >= 0.01) {
      console.error(
        `[verify-payment] Exact amount mismatch for order ${order_id}: Expected ₹${expectedAmount}, Received ₹${confirmedAmount}`
      );
      return NextResponse.json(
        {
          error: `Payment amount mismatch. Expected ₹${expectedAmount}, received ₹${confirmedAmount}.`,
        },
        { status: 400 }
      );
    }

    if (!paymentId || paymentId.trim() === "") {
      return NextResponse.json(
        { error: "Payment verification failed: Gateway returned an empty payment ID." },
        { status: 400 }
      );
    }

    // ── 6. Execute Shared Idempotent Activation ────────────────────────────
    const activationResult = await activateMembershipOrder({
      orderId: order_id,
      userId: user.id,
      planKey: orderRecord.plan_key,
      amount: confirmedAmount,
      paymentId: paymentId.trim(),
      gateway: "cashfree",
      paymentMethod,
    });

    if (!activationResult.success && !activationResult.alreadyActive) {
      const status = activationResult.inProgress ? 409 : 500;
      return NextResponse.json(
        {
          error: activationResult.error || "Payment was verified but membership activation failed. Support has been notified.",
          inProgress: activationResult.inProgress,
        },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      alreadyActive: activationResult.alreadyActive,
      order_id,
      payment_id: paymentId,
      plan: activationResult.planName,
      planKey: activationResult.planKey,
      planPeriod: activationResult.planPeriod,
      expiry: activationResult.expiry,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[verify-payment] Internal error:", error.message);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during payment verification." },
      { status: 500 }
    );
  }
}
