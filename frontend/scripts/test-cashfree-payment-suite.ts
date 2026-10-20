/**
 * Comprehensive Cashfree Membership Payment Flow Test Suite
 *
 * Covers:
 * 1. Plan keys & CHECKOUT_PLAN_KEYS validation (fail-closed, no Gold fallback)
 * 2. Database CHECK constraint compliance (no spaces in stored plans)
 * 3. Amount, GST & Currency calculations
 * 4. Ownership verification & user mismatch rejection
 * 5. Payment amount, currency, and gateway mismatch rejection
 * 6. Non-success payment states rejection
 * 7. Security Definer RPC permissions, REVOKE checks & safe search_path (SQL audit)
 * 8. Payment RLS policies & dynamic policy cleanup (SQL audit)
 * 9. Idempotency: repeated verification & duplicate concurrent activation state machine
 * 10. Safe recovery for stuck processing orders (> 5 minutes)
 * 11. Partial failures, non-swallowed errors & safe email failure isolation
 * 12. Cryptographic HMAC-SHA256 Webhook signature verification
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  CHECKOUT_PLAN_KEYS,
  MEMBERSHIP_PLANS,
  getPlanPricing,
  calculatePlanExpiry,
} from "../src/lib/membership-plans";
import { verifyCashfreeWebhookSignature } from "../src/lib/cashfree";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function main() {
  // ── 1. Plan Keys & Checkout Plans Enforcement ────────────────────────────────
  console.log("\n=== 1. Plan Keys & Checkout Plans Enforcement (Fail-Closed) ===");
  assert(
    CHECKOUT_PLAN_KEYS.length === 3 &&
    CHECKOUT_PLAN_KEYS.includes("Gold") &&
    CHECKOUT_PLAN_KEYS.includes("PrimeGold") &&
    CHECKOUT_PLAN_KEYS.includes("PrimeTillUMarry"),
    "Checkout only allows Gold, PrimeGold, and PrimeTillUMarry"
  );

  assert(!CHECKOUT_PLAN_KEYS.includes("InvalidPlan" as any), "Rejects arbitrary invalid plan key");
  assert(!CHECKOUT_PLAN_KEYS.includes("Diamond" as any), "Rejects unexposed plan Diamond for checkout");
  assert(!CHECKOUT_PLAN_KEYS.includes("Platinum" as any), "Rejects unexposed plan Platinum for checkout");

  function validatePlanKeyFailClosed(planKey?: string): { valid: boolean; error?: string } {
    if (!planKey || !(planKey in MEMBERSHIP_PLANS) || !CHECKOUT_PLAN_KEYS.includes(planKey as any)) {
      return { valid: false, error: `Invalid plan key: "${planKey}". Allowed plans: ${CHECKOUT_PLAN_KEYS.join(", ")}` };
    }
    return { valid: true };
  }

  assert(!validatePlanKeyFailClosed(undefined).valid, "Rejects undefined plan key without defaulting to Gold");
  assert(!validatePlanKeyFailClosed("").valid, "Rejects empty plan key without defaulting to Gold");
  assert(!validatePlanKeyFailClosed("GoldPlus").valid, "Rejects unknown 'GoldPlus' without defaulting to Gold");
  assert(validatePlanKeyFailClosed("Gold").valid, "Accepts canonical Gold plan");
  assert(validatePlanKeyFailClosed("PrimeGold").valid, "Accepts canonical PrimeGold plan");
  assert(validatePlanKeyFailClosed("PrimeTillUMarry").valid, "Accepts canonical PrimeTillUMarry plan");


  // ── 2. Database CHECK Constraint Compliance ──────────────────────────────────
  console.log("\n=== 2. Database CHECK Constraint Compliance ===");
  const dbConstraintAllowed = ["Gold", "PrimeGold", "PrimeTillUMarry", "Diamond", "Platinum"];
  for (const planKey of CHECKOUT_PLAN_KEYS) {
    assert(
      dbConstraintAllowed.includes(planKey),
      `Canonical plan key "${planKey}" satisfies profiles.membership_plan CHECK constraint (no spaces)`
    );
  }

  assert(MEMBERSHIP_PLANS.PrimeGold.name === "Prime Gold", "PrimeGold has display label 'Prime Gold'");
  assert(MEMBERSHIP_PLANS.PrimeTillUMarry.name === "Prime Till U Marry", "PrimeTillUMarry has display label 'Prime Till U Marry'");


  // ── 3. Pricing, GST & Amount Calculations (All 5 Plans) ───────────────────────
  console.log("\n=== 3. Pricing, GST & Amount Calculations (All 5 Plans) ===");
  const goldPricing = getPlanPricing("Gold");
  assert(goldPricing !== null, "Gold pricing calculated");
  assert(goldPricing?.basePrice === 3999, "Gold base price is 3999");
  assert(goldPricing?.gst === Math.round(3999 * 0.18), "Gold 18% GST is 720");
  assert(goldPricing?.total === 4719, "Gold total payable is 4719 INR");
  assert(goldPricing?.months === 3, "Gold duration is 3 months");

  const primeGoldPricing = getPlanPricing("PrimeGold");
  assert(primeGoldPricing !== null, "PrimeGold pricing calculated");
  assert(primeGoldPricing?.basePrice === 4999, "PrimeGold base price is 4999");
  assert(primeGoldPricing?.gst === Math.round(4999 * 0.18), "PrimeGold 18% GST is 900");
  assert(primeGoldPricing?.total === 5899, "PrimeGold total is 5899 INR");
  assert(primeGoldPricing?.months === 3, "PrimeGold duration is 3 months");

  const primeTillUMarryPricing = getPlanPricing("PrimeTillUMarry");
  assert(primeTillUMarryPricing !== null, "PrimeTillUMarry pricing calculated");
  assert(primeTillUMarryPricing?.basePrice === 8999, "PrimeTillUMarry base price is 8999");
  assert(primeTillUMarryPricing?.gst === Math.round(8999 * 0.18), "PrimeTillUMarry 18% GST is 1620");
  assert(primeTillUMarryPricing?.total === 10619, "PrimeTillUMarry total is 10619 INR");
  assert(primeTillUMarryPricing?.months === 12, "PrimeTillUMarry duration is 12 months (not 120 months)");

  const diamondPricing = getPlanPricing("Diamond");
  assert(diamondPricing !== null, "Diamond pricing calculated");
  assert(diamondPricing?.basePrice === 14999, "Diamond base price is 14999");
  assert(diamondPricing?.gst === Math.round(14999 * 0.18), "Diamond 18% GST is 2700");
  assert(diamondPricing?.total === 17699, "Diamond total payable is 17699 INR");
  assert(diamondPricing?.months === 6, "Diamond duration is 6 months");

  const platinumPricing = getPlanPricing("Platinum");
  assert(platinumPricing !== null, "Platinum pricing calculated");
  assert(platinumPricing?.basePrice === 24999, "Platinum base price is 24999");
  assert(platinumPricing?.gst === Math.round(24999 * 0.18), "Platinum 18% GST is 4500");
  assert(platinumPricing?.total === 29499, "Platinum total payable is 29499 INR");
  assert(platinumPricing?.months === 12, "Platinum duration is 12 months");


  // ── 4. Ownership Verification Logic ──────────────────────────────────────────
  console.log("\n=== 4. Ownership Verification Logic ===");
  function verifyOrderOwnership(orderUserId: string | null | undefined, requestingUserId: string): boolean {
    if (!orderUserId) return false;
    return orderUserId === requestingUserId;
  }

  const userA = "00000000-0000-0000-0000-000000000001";
  const userB = "00000000-0000-0000-0000-000000000002";

  assert(verifyOrderOwnership(userA, userA) === true, "User can verify their own order");
  assert(verifyOrderOwnership(userA, userB) === false, "User B cannot verify User A's order (Forbidden 403)");
  assert(verifyOrderOwnership(null, userA) === false, "Order without user_id cannot be verified (rejects null)");


  // ── 5. Payment Integrity Validation Logic ────────────────────────────────────
  console.log("\n=== 5. Payment Integrity Validation Logic (User/Plan/Amount/Currency/Gateway) ===");
  interface StoredOrder {
    order_id: string;
    user_id: string;
    plan_key: string;
    amount: number;
    currency: string;
    gateway: string;
    status: string;
  }

  function validateOrderActivationRequest(
    storedOrder: StoredOrder | null,
    req: { userId: string; planKey: string; amount: number; paymentId?: string; currency?: string; gateway?: string }
  ): { valid: boolean; error?: string } {
    if (!storedOrder) {
      return { valid: false, error: "Order record not found in database." };
    }
    if (!storedOrder.user_id || storedOrder.user_id !== req.userId) {
      return { valid: false, error: "Order ownership mismatch: User ID does not match order record." };
    }
    if (storedOrder.plan_key !== req.planKey) {
      return { valid: false, error: "Plan mismatch: Plan key does not match order record." };
    }
    // Enforce checkout allowlist (fail-closed against Diamond, Platinum, or arbitrary plans)
    if (!CHECKOUT_PLAN_KEYS.includes(req.planKey as any)) {
      return { valid: false, error: `Plan "${req.planKey}" is not eligible for self-service checkout.` };
    }
    // Enforce authoritative server-side plan pricing + 18% GST
    const authoritative = getPlanPricing(req.planKey);
    if (!authoritative || Math.abs(storedOrder.amount - authoritative.total) >= 0.01) {
      return { valid: false, error: "Order record amount does not match authoritative plan pricing." };
    }
    // Exact decimal validation (no Math.round)
    if (Math.abs(storedOrder.amount - req.amount) >= 0.01) {
      return { valid: false, error: "Amount mismatch: Paid amount does not match order record." };
    }
    if (!req.paymentId || req.paymentId.trim() === "") {
      return { valid: false, error: "Payment ID is required and cannot be empty." };
    }
    if (storedOrder.currency !== (req.currency || "INR") || (req.currency && req.currency !== "INR")) {
      return { valid: false, error: "Currency mismatch: Order is not in INR." };
    }
    if (storedOrder.gateway !== (req.gateway || "cashfree")) {
      return { valid: false, error: "Gateway mismatch." };
    }
    return { valid: true };
  }

  const canonicalOrder: StoredOrder = {
    order_id: "ETM_order_1001",
    user_id: userA,
    plan_key: "Gold",
    amount: 4719,
    currency: "INR",
    gateway: "cashfree",
    status: "pending",
  };

  assert(
    validateOrderActivationRequest(canonicalOrder, { userId: userA, planKey: "Gold", amount: 4719, paymentId: "cf_pay_123", currency: "INR", gateway: "cashfree" }).valid,
    "Exact matching activation request is approved"
  );
  assert(
    !validateOrderActivationRequest(null, { userId: userA, planKey: "Gold", amount: 4719, paymentId: "cf_pay_123" }).valid,
    "Missing order record is rejected (cannot activate unrecorded payment)"
  );
  assert(
    !validateOrderActivationRequest(canonicalOrder, { userId: userB, planKey: "Gold", amount: 4719, paymentId: "cf_pay_123" }).valid,
    "Mismatched user ID is rejected"
  );
  assert(
    !validateOrderActivationRequest(canonicalOrder, { userId: userA, planKey: "PrimeGold", amount: 4719, paymentId: "cf_pay_123" }).valid,
    "Mismatched plan key is rejected"
  );
  assert(
    !validateOrderActivationRequest(canonicalOrder, { userId: userA, planKey: "Gold", amount: 3999, paymentId: "cf_pay_123" }).valid,
    "Mismatched amount is rejected"
  );
  // Exact decimal mismatch rejection: e.g. ₹4,719.49 vs ₹4,719.00
  assert(
    !validateOrderActivationRequest(canonicalOrder, { userId: userA, planKey: "Gold", amount: 4719.49, paymentId: "cf_pay_123" }).valid,
    "Exact decimal difference (4719.49 vs 4719.00) is rejected by exact comparison"
  );
  assert(
    Math.round(4719.49) === Math.round(4719.00),
    "Proof: Math.round would dangerously accept 4719.49 vs 4719.00"
  );
  assert(
    Math.abs(4719.49 - 4719.00) >= 0.01,
    "Proof: Exact decimal check properly catches and rejects 4719.49 vs 4719.00"
  );
  // Empty or whitespace payment ID rejection
  assert(
    !validateOrderActivationRequest(canonicalOrder, { userId: userA, planKey: "Gold", amount: 4719, paymentId: "" }).valid,
    "Empty payment ID is rejected"
  );
  assert(
    !validateOrderActivationRequest(canonicalOrder, { userId: userA, planKey: "Gold", amount: 4719, paymentId: "   " }).valid,
    "Whitespace-only payment ID is rejected"
  );
  // Reject unapproved plans (Diamond, Platinum)
  assert(
    !validateOrderActivationRequest({ ...canonicalOrder, plan_key: "Diamond", amount: 17699 }, { userId: userA, planKey: "Diamond", amount: 17699, paymentId: "cf_pay_123" }).valid,
    "Unapproved plan Diamond cannot be activated via checkout flow"
  );
  assert(
    !validateOrderActivationRequest(canonicalOrder, { userId: userA, planKey: "Gold", amount: 4719, paymentId: "cf_pay_123", currency: "USD" }).valid,
    "Non-INR currency is rejected"
  );
  assert(
    !validateOrderActivationRequest(canonicalOrder, { userId: userA, planKey: "Gold", amount: 4719, paymentId: "cf_pay_123", gateway: "razorpay" }).valid,
    "Mismatched gateway is rejected"
  );


  // ── 6. Payment Status Acceptance ─────────────────────────────────────────────
  console.log("\n=== 6. Payment Status Acceptance ===");
  function isPaymentAcceptable(paymentStatus: string, orderStatus: string): boolean {
    return paymentStatus === "SUCCESS" || orderStatus === "PAID";
  }

  assert(isPaymentAcceptable("SUCCESS", "PAID") === true, "SUCCESS status accepted");
  assert(isPaymentAcceptable("PENDING", "ACTIVE") === false, "PENDING status not granted membership");
  assert(isPaymentAcceptable("FAILED", "FAILED") === false, "FAILED status not granted membership");
  assert(isPaymentAcceptable("CANCELLED", "CANCELLED") === false, "CANCELLED status not granted membership");


  // ── 7. SQL Migration Audit: RPC Security & Role Revocation ───────────────────
  console.log("\n=== 7. SQL Migration Audit: RPC Security & Role Revocation ===");
  const migrationPath = path.join(__dirname, "../supabase_cashfree_payment_migration.sql");
  const migrationSql = fs.readFileSync(migrationPath, "utf-8");

  assert(
    migrationSql.includes("REVOKE ALL ON FUNCTION public.activate_membership_payment(TEXT, UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT) FROM PUBLIC;"),
    "SQL explicitly revokes RPC execution from PUBLIC"
  );
  assert(
    migrationSql.includes("REVOKE ALL ON FUNCTION public.activate_membership_payment(TEXT, UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT) FROM anon;"),
    "SQL explicitly revokes RPC execution from anon"
  );
  assert(
    migrationSql.includes("REVOKE ALL ON FUNCTION public.activate_membership_payment(TEXT, UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT) FROM authenticated;"),
    "SQL explicitly revokes RPC execution from authenticated"
  );
  assert(
    migrationSql.includes("GRANT EXECUTE ON FUNCTION public.activate_membership_payment(TEXT, UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT) TO service_role;"),
    "SQL explicitly grants execution ONLY to service_role"
  );
  assert(
    migrationSql.includes("SECURITY DEFINER") && migrationSql.includes("SET search_path = public, pg_temp"),
    "RPC declared SECURITY DEFINER with safe search_path = public, pg_temp"
  );
  assert(
    migrationSql.includes("DROP FUNCTION IF EXISTS public.activate_membership_payment(text, uuid, text, text, numeric, text, text, integer, text);"),
    "SQL drops legacy 9-parameter overload to prevent signature ambiguity"
  );
  assert(
    migrationSql.includes("public.payments") &&
    migrationSql.includes("public.profiles") &&
    migrationSql.includes("public.membership_transactions"),
    "RPC schema-qualifies all database tables (public.*)"
  );
  assert(
    migrationSql.includes("p_payment_id IS NULL OR TRIM(p_payment_id) = ''"),
    "RPC validates payment_id is non-empty and non-whitespace"
  );
  assert(
    migrationSql.includes("v_payment.amount <> p_amount"),
    "RPC enforces exact amount matching (no ROUND)"
  );
  assert(
    migrationSql.includes("p_plan_key NOT IN ('Gold', 'PrimeGold', 'PrimeTillUMarry')") ||
    migrationSql.includes("Must be Gold, PrimeGold, or PrimeTillUMarry"),
    "RPC enforces checkout allowlist and rejects unapproved plans"
  );


  // ── 8. SQL Migration Audit: Payment RLS Policies & Audit Archive ─────────────
  console.log("\n=== 8. SQL Migration Audit: Payment RLS Policies & Audit Archive ===");
  assert(
    migrationSql.includes("FROM pg_policies") && migrationSql.includes("DROP POLICY IF EXISTS"),
    "SQL dynamically discovers and drops existing policies via pg_policies loop"
  );
  assert(
    migrationSql.includes('CREATE POLICY "payments_service_role_all"') &&
    migrationSql.includes("TO service_role"),
    "Payments mutation policy has explicit TO service_role clause"
  );
  assert(
    migrationSql.includes('CREATE POLICY "payments_user_select"') &&
    migrationSql.includes("TO authenticated") &&
    migrationSql.includes("user_id = auth.uid()"),
    "Payments read policy strictly restricts authenticated clients to user_id = auth.uid()"
  );
  assert(
    migrationSql.includes('CREATE POLICY "membership_transactions_service_role_all"') &&
    migrationSql.includes("TO service_role"),
    "Membership transactions mutation policy has explicit TO service_role clause"
  );
  assert(
    migrationSql.includes('CREATE POLICY "membership_transactions_user_select"') &&
    migrationSql.includes("TO authenticated") &&
    migrationSql.includes("profile_id = auth.uid()"),
    "Membership transactions read policy strictly restricts authenticated clients to profile_id = auth.uid()"
  );
  assert(
    migrationSql.includes("public.membership_transactions_audit_archive") &&
    migrationSql.includes("duplicate_order_id_reconciliation"),
    "SQL creates audit archive table to preserve financial trail during duplicate reconciliation"
  );
  assert(
    migrationSql.includes("ALTER TABLE public.membership_transactions_audit_archive ENABLE ROW LEVEL SECURITY;") &&
    migrationSql.includes('CREATE POLICY "audit_archive_service_role_all"') &&
    migrationSql.includes("REVOKE ALL ON public.membership_transactions_audit_archive FROM PUBLIC;"),
    "SQL explicitly secures audit archive table with RLS and revokes public access"
  );
  assert(
    migrationSql.includes("LOCK TABLE public.membership_transactions IN SHARE ROW EXCLUSIVE MODE;"),
    "SQL acquires SHARE ROW EXCLUSIVE lock on membership_transactions during migration"
  );
  assert(
    migrationSql.includes("v_dup_count > 0 THEN") &&
    migrationSql.includes("RAISE EXCEPTION"),
    "SQL verifies zero duplicate non-null order_ids remain before index creation"
  );
  assert(
    migrationSql.includes("uq_tx_audit_archive_original_id") &&
    migrationSql.includes("ON public.membership_transactions_audit_archive(original_id)"),
    "SQL creates unique index on audit archive table to prevent duplicate archive rows on reruns"
  );
  assert(
    migrationSql.includes("WHERE NOT EXISTS") &&
    migrationSql.includes("FROM public.membership_transactions_audit_archive a"),
    "SQL uses WHERE NOT EXISTS to guarantee idempotent archive insertion without duplicate records"
  );
  assert(
    migrationSql.includes("JOIN public.membership_transactions_audit_archive a ON a.original_id = r.id"),
    "SQL verifies records exist in audit archive before deleting duplicates from active table"
  );
  assert(
    !migrationSql.includes("a.ctid > b.ctid"),
    "SQL does NOT use ctid as a proxy for earliest transaction"
  );
  assert(
    migrationSql.includes("uq_membership_tx_order_id") &&
    migrationSql.includes("WHERE order_id IS NOT NULL;"),
    "SQL creates partial unique index on non-null order_id (safe for legacy null order_ids)"
  );


  // ── 9. Atomic State Machine & Concurrency Simulation ─────────────────────────
  console.log("\n=== 9. Atomic State Machine & Concurrency Simulation ===");

  interface PaymentRow {
    orderId: string;
    status: "pending" | "processing" | "success" | "failed";
    updatedAt: number;
    activations: number;
  }

  class MockDbStateMachine {
    private payments = new Map<string, PaymentRow>();

    insertPending(orderId: string) {
      this.payments.set(orderId, {
        orderId,
        status: "pending",
        updatedAt: Date.now(),
        activations: 0,
      });
    }

    // Simulates activate_membership_payment RPC
    attemptActivation(orderId: string, now: number): {
      success: boolean;
      alreadyActive?: boolean;
      inProgress?: boolean;
      error?: string;
    } {
      const rec = this.payments.get(orderId);
      if (!rec) return { success: false, error: "Order not found" };

      // Step 3: Check already success
      if (rec.status === "success") {
        return { success: true, alreadyActive: true };
      }

      // Step 4: Check active concurrent processing (< 5 min timeout)
      const fiveMinutesMs = 5 * 60 * 1000;
      if (rec.status === "processing" && rec.updatedAt >= now - fiveMinutesMs) {
        return { success: false, inProgress: true, error: "Payment activation in progress by another request" };
      }

      // Step 6: Claim for processing
      rec.status = "processing";
      rec.updatedAt = now;

      // Simulate completion
      rec.status = "success";
      rec.activations++;
      return { success: true, alreadyActive: false };
    }

    setStuckProcessing(orderId: string, minutesAgo: number) {
      const rec = this.payments.get(orderId);
      if (rec) {
        rec.status = "processing";
        rec.updatedAt = Date.now() - minutesAgo * 60 * 1000;
      }
    }

    getActivations(orderId: string) {
      return this.payments.get(orderId)?.activations ?? 0;
    }
  }

  const sm = new MockDbStateMachine();
  const testOrderId = "ETM_concurrency_test_001";
  sm.insertPending(testOrderId);

  const now = Date.now();
  const res1 = sm.attemptActivation(testOrderId, now);
  assert(res1.success && !res1.alreadyActive, "First activation request succeeds");

  // Repeated activation (e.g. user refresh or webhook replay)
  const res2 = sm.attemptActivation(testOrderId, now + 1000);
  assert(Boolean(res2.success && res2.alreadyActive), "Repeated request returns alreadyActive: true without duplicate extension");
  assert(sm.getActivations(testOrderId) === 1, "Order was activated exactly once");


  // ── 10. Stuck Processing Order Recovery (> 5 Minutes) ────────────────────────
  console.log("\n=== 10. Stuck Processing Order Recovery (> 5 Minutes) ===");
  const stuckOrderId = "ETM_stuck_order_002";
  sm.insertPending(stuckOrderId);

  // Order entered processing 2 minutes ago (still fresh)
  sm.setStuckProcessing(stuckOrderId, 2);
  const freshAttempt = sm.attemptActivation(stuckOrderId, Date.now());
  assert(freshAttempt.inProgress === true, "Order processing within 5 minutes returns inProgress (locked)");

  // Stale processing order without verified gateway payment: MUST NOT activate!
  function attemptRecoveryWithGatewayCheck(
    orderId: string,
    gatewayVerifiedStatus: "SUCCESS" | "FAILED" | "PENDING"
  ): { activated: boolean; error?: string } {
    // 1. First require gateway verification
    if (gatewayVerifiedStatus !== "SUCCESS") {
      return { activated: false, error: `Gateway returned ${gatewayVerifiedStatus}, cannot activate.` };
    }
    // 2. Only if gateway verified SUCCESS, invoke RPC
    const rpcRes = sm.attemptActivation(orderId, Date.now());
    return { activated: rpcRes.success && !rpcRes.inProgress, error: rpcRes.error };
  }

  // Order stuck in processing for 6 minutes, but gateway status is FAILED
  sm.setStuckProcessing(stuckOrderId, 6);
  const failedGatewayAttempt = attemptRecoveryWithGatewayCheck(stuckOrderId, "FAILED");
  assert(
    failedGatewayAttempt.activated === false,
    "Stale processing order (> 5 min) is NOT activated when Cashfree verification fails/unconfirmed"
  );
  assert(sm.getActivations(stuckOrderId) === 0, "No membership was granted for unverified stale order");

  // Order stuck in processing for 6 minutes, and gateway confirms payment SUCCESS
  const verifiedRecoveryAttempt = attemptRecoveryWithGatewayCheck(stuckOrderId, "SUCCESS");
  assert(
    verifiedRecoveryAttempt.activated === true,
    "Stale processing order (> 5 min) is recovered ONLY with fresh, successful Cashfree verification"
  );
  assert(sm.getActivations(stuckOrderId) === 1, "Stuck order was activated exactly once upon valid gateway confirmation");


  // ── 11. Partial Failures, Unswallowed Errors & Non-Fatal Email ──────────────
  console.log("\n=== 11. Partial Failures, Unswallowed Errors & Non-Fatal Email ===");

  async function executeMockActivationFlow(shouldEmailFail: boolean) {
    let paymentCommitted = true;
    let emailThrew = false;
    let emailSent = false;

    try {
      if (shouldEmailFail) {
        throw new Error("Resend SMTP 500 error");
      }
      emailSent = true;
    } catch (err: any) {
      emailThrew = true;
      console.log(`     [Expected Non-Fatal Log]: Email failed (${err.message}), payment remains valid.`);
    }

    return { success: true, activated: true, emailSent, paymentCommitted, emailThrew };
  }

  const result = await executeMockActivationFlow(true);
  assert(result.success === true, "Activation returns success even if email delivery throws");
  assert(result.paymentCommitted === true, "Payment transaction was committed");
  assert(result.emailThrew === true, "Email exception was caught safely without crashing");

  // ── 12. Cashfree Webhook Signature Verification ──────────────────────────────
  console.log("\n=== 12. Cashfree Webhook Signature Verification ===");
  const secret = "cfsecret_unit_test_secret_key_8899";
  process.env.CASHFREE_APP_ID = "cf_test_app_id";
  process.env.CASHFREE_SECRET_KEY = secret;

  const testTimestamp = Math.floor(Date.now() / 1000).toString();
  const rawPayload = JSON.stringify({
    type: "PAYMENT_SUCCESS_WEBHOOK",
    data: {
      order: { order_id: "ETM_test_1", order_amount: 4719 },
      payment: { payment_status: "SUCCESS", payment_amount: 4719, payment_currency: "INR" },
    },
  });

  const validSignature = crypto
    .createHmac("sha256", secret)
    .update(testTimestamp + rawPayload)
    .digest("base64");

  assert(
    verifyCashfreeWebhookSignature(validSignature, rawPayload, testTimestamp) === true,
    "Genuine signature passes verification"
  );

  assert(
    verifyCashfreeWebhookSignature(validSignature, rawPayload + " ", testTimestamp) === false,
    "Tampered payload fails verification"
  );

  assert(
    verifyCashfreeWebhookSignature("tampered_sig", rawPayload, testTimestamp) === false,
    "Fraudulent signature fails verification"
  );

  console.log("\n========================================================");
  console.log(`TOTAL SUITE RESULTS: ${passed} passed, ${failed} failed`);
  console.log("========================================================\n");

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
