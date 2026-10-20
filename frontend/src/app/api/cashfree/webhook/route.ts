import { NextRequest, NextResponse } from "next/server";
import { verifyCashfreeWebhookSignature } from "@/lib/cashfree";
import { supabaseAdmin, assertSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { MEMBERSHIP_PLANS, CHECKOUT_PLAN_KEYS, getPlanPricing } from "@/lib/membership-plans";
import { activateMembershipOrder } from "@/lib/membership-activation";

/**
 * Cashfree Webhook Handler
 *
 * Verifies HMAC-SHA256 signature of incoming webhooks from Cashfree.
 * Automatically and idempotently activates memberships for successful payments.
 */
export async function POST(req: NextRequest) {
  try {
    assertSupabaseAdminConfigured();

    // ── 1. Read Raw Request Body for Cryptographic Signature Verification ────
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature");
    const timestamp = req.headers.get("x-webhook-timestamp");

    if (!signature || !timestamp) {
      console.warn("[Cashfree Webhook] Missing signature or timestamp headers");
      return NextResponse.json(
        { error: "Missing required signature headers" },
        { status: 400 }
      );
    }

    const isValidSignature = verifyCashfreeWebhookSignature(
      signature,
      rawBody,
      timestamp
    );

    if (!isValidSignature) {
      console.error("[Cashfree Webhook] Invalid webhook signature detected. Rejecting payload.");
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    // Parse verified payload
    const event = JSON.parse(rawBody);
    const eventType = event.type;

    // We only process PAYMENT_SUCCESS_WEBHOOK events for membership activations
    if (eventType !== "PAYMENT_SUCCESS_WEBHOOK") {
      const orderId = event.data?.order?.order_id;
      if (orderId && (eventType === "PAYMENT_FAILED_WEBHOOK" || eventType === "PAYMENT_USER_DROPPED_WEBHOOK")) {
        try {
          await supabaseAdmin
            .from("payments")
            .update({
              status: "failed",
              payment_method: event.data?.payment?.payment_group || "CASHFREE",
              updated_at: new Date().toISOString(),
            })
            .eq("order_id", orderId)
            .eq("status", "pending");
        } catch {
          // Non-blocking update
        }
      }
      return NextResponse.json({ message: "Event received and acknowledged", type: eventType });
    }

    const orderData = event.data?.order;
    const paymentData = event.data?.payment;
    const customerData = event.data?.customer_details;

    const orderId = orderData?.order_id;
    const paymentStatus = paymentData?.payment_status;
    const cfPaymentId = String(paymentData?.cf_payment_id || paymentData?.payment_id || orderId);
    const paymentAmount = Number(paymentData?.payment_amount || orderData?.order_amount);

    if (!orderId || paymentStatus !== "SUCCESS") {
      console.log(`[Cashfree Webhook] Non-successful payment status (${paymentStatus}) for order ${orderId}`);
      return NextResponse.json({ message: "Order not successful or missing ID" }, { status: 200 });
    }

    // ── 2. Retrieve Persisted Database Order Record ──────────────────────────
    // Never activate an unrecorded payment or default unknown plans to Gold
    const { data: orderRecord, error: orderFetchErr } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("order_id", orderId)
      .maybeSingle();

    if (orderFetchErr || !orderRecord) {
      console.error(`[Cashfree Webhook] Order ${orderId} not found in database. Cannot activate unrecorded payment.`);
      return NextResponse.json(
        { error: `Payment order record "${orderId}" not found in database.` },
        { status: 404 }
      );
    }

    const targetUserId = orderRecord.user_id;
    const planKey = orderRecord.plan_key;

    if (!targetUserId) {
      console.error(`[Cashfree Webhook] Order ${orderId} has no associated user_id. Rejecting.`);
      return NextResponse.json(
        { error: "Order record has no associated user ID." },
        { status: 400 }
      );
    }

    // Fail closed: Never silently default unknown plans to Gold
    if (
      !planKey ||
      !(planKey in MEMBERSHIP_PLANS) ||
      !CHECKOUT_PLAN_KEYS.includes(planKey as any)
    ) {
      console.error(`[Cashfree Webhook] Order ${orderId} has invalid or unknown plan: "${planKey}". Rejecting.`);
      return NextResponse.json(
        { error: `Invalid membership checkout plan "${planKey}".` },
        { status: 400 }
      );
    }

    // Validate currency
    const paymentCurrency = (paymentData?.payment_currency || orderData?.order_currency || "INR").toUpperCase();
    if (paymentCurrency !== "INR" || orderRecord.currency !== "INR") {
      console.error(`[Cashfree Webhook] Currency mismatch for order ${orderId}. Expected INR, received ${paymentCurrency}.`);
      return NextResponse.json(
        { error: `Payment currency mismatch. Expected INR, received ${paymentCurrency}.` },
        { status: 400 }
      );
    }

    // Validate order record matches authoritative server-side plan pricing + 18% GST
    const authoritativePricing = getPlanPricing(planKey);
    if (!authoritativePricing || Math.abs(Number(orderRecord.amount) - authoritativePricing.total) >= 0.01) {
      console.error(
        `[Cashfree Webhook] Order ${orderId} amount ${orderRecord.amount} does not match authoritative plan pricing ${authoritativePricing?.total}.`
      );
      return NextResponse.json(
        { error: "Order record amount does not match authoritative plan pricing." },
        { status: 400 }
      );
    }

    // Exact amount validation: remove rounded comparisons that could accept incorrect amounts
    const expectedAmount = authoritativePricing.total;
    if (Math.abs(paymentAmount - expectedAmount) >= 0.01) {
      console.error(
        `[Cashfree Webhook] Webhook payment amount (${paymentAmount}) does not match expected order amount (${expectedAmount}) for order ${orderId}.`
      );
      return NextResponse.json(
        { error: "Payment amount does not match persisted order amount." },
        { status: 400 }
      );
    }

    if (!cfPaymentId || cfPaymentId.trim() === "") {
      return NextResponse.json(
        { error: "Missing valid payment identifier in webhook payload." },
        { status: 400 }
      );
    }

    // ── 3. Execute Shared Idempotent Activation ──────────────────────────────
    const result = await activateMembershipOrder({
      orderId,
      userId: targetUserId,
      planKey,
      amount: paymentAmount,
      paymentId: cfPaymentId,
      gateway: "cashfree",
      paymentMethod: paymentData?.payment_group || "CASHFREE",
      customerEmail: customerData?.customer_email,
      customerName: customerData?.customer_name,
    });

    if (result.alreadyActive) {
      console.log(`[Cashfree Webhook] Order ${orderId} was already fulfilled. Skipping duplicate activation.`);
      return NextResponse.json({ success: true, message: "Order already fulfilled" }, { status: 200 });
    }

    if (result.inProgress) {
      return NextResponse.json(
        { error: "Payment activation is currently in progress by another request.", inProgress: true },
        { status: 409 }
      );
    }

    if (!result.success) {
      console.error(`[Cashfree Webhook] Activation failed: ${result.error}`);
      return NextResponse.json({ error: result.error || "Activation failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processed and membership activated successfully",
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Cashfree Webhook] Fatal error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
