import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { paymentConfirmationHtml, paymentConfirmationText } from "@/lib/email/templates";
import { MEMBERSHIP_PLANS, CHECKOUT_PLAN_KEYS } from "@/lib/membership-plans";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key_for_build");
const FROM = process.env.RESEND_FROM_EMAIL ?? "Elite Tamil Matrimony <admin@elitetamilmatrimony.com>";

export interface ActivateMembershipInput {
  orderId: string;
  userId: string;
  planKey: string;
  amount: number;
  paymentId: string;
  gateway?: string;
  paymentMethod?: string;
  customerEmail?: string | null;
  customerName?: string | null;
}

export interface ActivationResult {
  success: boolean;
  activated: boolean;
  alreadyActive: boolean;
  orderId: string;
  userId: string;
  planKey: string;
  planName: string;
  planPeriod: string;
  expiry?: string;
  error?: string;
  inProgress?: boolean;
}

/**
 * Shared, idempotent membership activation process.
 * Fail-Closed Architecture:
 * - Never defaults an unknown plan to Gold.
 * - Restricts checkout to allowed canonical plans.
 * - Uses atomic SECURITY DEFINER RPC with service_role permissions.
 * - Does not fallback to un-atomic execution if the database returns an integrity error.
 * - Distinguishes already-active from in-progress from genuine failures.
 * - Safe recovery for orders stuck in 'processing' (> 5 mins) without double extensions.
 */
export async function activateMembershipOrder(
  input: ActivateMembershipInput
): Promise<ActivationResult> {
  const {
    orderId,
    userId,
    planKey,
    amount,
    paymentId,
    gateway = "cashfree",
    paymentMethod = "CASHFREE",
    customerEmail,
    customerName,
  } = input;

  // ── Step 1: Strict Plan Key Validation (Fail-Closed) ─────────────────────
  // Never default unknown or arbitrary plans to Gold
  if (!planKey || !(planKey in MEMBERSHIP_PLANS) || !CHECKOUT_PLAN_KEYS.includes(planKey as any)) {
    return {
      success: false,
      activated: false,
      alreadyActive: false,
      orderId,
      userId,
      planKey: planKey || "unknown",
      planName: "Unknown Plan",
      planPeriod: "Unknown",
      error: `Invalid membership checkout plan "${planKey}". Allowed plans: ${CHECKOUT_PLAN_KEYS.join(", ")}`,
    };
  }

  const planInfo = MEMBERSHIP_PLANS[planKey];

  // ── Step 2: Attempt Atomic SECURITY DEFINER RPC ──────────────────────────
  try {
    const { data: rpcResult, error: rpcErr } = await supabaseAdmin.rpc(
      "activate_membership_payment",
      {
        p_order_id: orderId,
        p_user_id: userId,
        p_plan_key: planKey,
        p_payment_id: paymentId,
        p_amount: amount,
        p_gateway: gateway,
        p_payment_method: paymentMethod,
      }
    );

    if (rpcErr) {
      console.error("[activateMembershipOrder] Database RPC error:", rpcErr.message);
      return {
        success: false,
        activated: false,
        alreadyActive: false,
        orderId,
        userId,
        planKey,
        planName: planInfo.name,
        planPeriod: planInfo.period,
        error: `Database activation error: ${rpcErr.message}`,
      };
    }

    if (!rpcResult) {
      return {
        success: false,
        activated: false,
        alreadyActive: false,
        orderId,
        userId,
        planKey,
        planName: planInfo.name,
        planPeriod: planInfo.period,
        error: "Database activation returned an empty result.",
      };
    }

    const resultObj = typeof rpcResult === "string" ? JSON.parse(rpcResult) : rpcResult;

    if (resultObj.success) {
      if (resultObj.already_active) {
        return {
          success: true,
          activated: false,
          alreadyActive: true,
          orderId,
          userId,
          planKey,
          planName: planInfo.name,
          planPeriod: planInfo.period,
          expiry: resultObj.expiry,
        };
      }

      // Newly activated: Dispatch confirmation email once
      await sendConfirmationEmailSafely({
        userId,
        recipientEmail: customerEmail,
        recipientName: customerName,
        planName: planInfo.name,
        planPeriod: planInfo.period,
        planFeatures: planInfo.features,
        amount,
        paymentId,
        expiryIso: resultObj.expiry,
      });

      return {
        success: true,
        activated: true,
        alreadyActive: false,
        orderId,
        userId,
        planKey,
        planName: planInfo.name,
        planPeriod: planInfo.period,
        expiry: resultObj.expiry,
      };
    }

    // RPC returned in_progress state
    if (resultObj.in_progress) {
      return {
        success: false,
        activated: false,
        alreadyActive: false,
        inProgress: true,
        orderId,
        userId,
        planKey,
        planName: planInfo.name,
        planPeriod: planInfo.period,
        error: resultObj.message || "Payment activation is currently in progress by another request.",
      };
    }

    // RPC returned a business logic validation error (e.g. ownership mismatch, amount mismatch, etc.)
    // Fail closed immediately! Never swallow or attempt un-atomic fallback!
    return {
      success: false,
      activated: false,
      alreadyActive: false,
      orderId,
      userId,
      planKey,
      planName: planInfo.name,
      planPeriod: planInfo.period,
      error: resultObj.error || "Payment activation rejected by database integrity rules.",
    };
  } catch (rpcEx: any) {
    console.error("[activateMembershipOrder] RPC exception:", rpcEx?.message || rpcEx);
    return {
      success: false,
      activated: false,
      alreadyActive: false,
      orderId,
      userId,
      planKey,
      planName: planInfo.name,
      planPeriod: planInfo.period,
      error: `Activation failed: ${rpcEx?.message || "RPC execution error"}`,
    };
  }
}

interface ConfirmationEmailOpts {
  userId: string;
  recipientEmail?: string | null;
  recipientName?: string | null;
  planName: string;
  planPeriod: string;
  planFeatures: string[];
  amount: number;
  paymentId: string;
  expiryIso: string;
}

/**
 * Sends confirmation email safely.
 * An email delivery failure NEVER fails or rolls back a confirmed payment.
 */
async function sendConfirmationEmailSafely(opts: ConfirmationEmailOpts) {
  const { recipientEmail, recipientName, planName, planPeriod, planFeatures, amount, paymentId, expiryIso } = opts;
  if (!recipientEmail || recipientEmail.endsWith("@etm.app")) {
    return;
  }

  const name = recipientName || "Member";
  const readableExpiry = new Date(expiryIso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  try {
    await resend.emails.send({
      from: FROM,
      to: [recipientEmail],
      subject: `Your ${planName} Membership is Confirmed — Elite Tamil Matrimony`,
      html: paymentConfirmationHtml({
        name,
        plan: planName,
        amount: Math.round(amount),
        paymentId,
        planPeriod,
        planFeatures,
        expiryDate: readableExpiry,
      }),
      text: paymentConfirmationText({
        name,
        plan: planName,
        amount: Math.round(amount),
        paymentId,
        planPeriod,
        expiryDate: readableExpiry,
      }),
    });
  } catch (emailErr: any) {
    // Log clearly for audit/retry without disrupting successful payment
    console.error(
      `[activateMembershipOrder] Non-fatal: Email delivery failed for user ${opts.userId} (Order payment is confirmed):`,
      emailErr?.message || emailErr
    );
  }
}
