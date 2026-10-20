-- ==============================================================================
-- ELITE TAMIL MATRIMONY — CASHFREE MEMBERSHIP PAYMENT MIGRATION
-- Run in: Supabase Dashboard -> SQL Editor (Do not execute automatically)
--
-- Adds:
-- 1. Payments audit & idempotency table with strict RLS (service_role only for mutations)
-- 2. Enhanced columns on membership_transactions with safe deduplication & unique order_id
-- 3. Profiles membership_plan CHECK constraint reconciliation
-- 4. Secure SECURITY DEFINER activate_membership_payment() RPC (service_role only)
-- ==============================================================================

-- ── 1. PAYMENTS AUDIT & IDEMPOTENCY TABLE ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       TEXT UNIQUE NOT NULL,
  user_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  gateway        TEXT NOT NULL DEFAULT 'cashfree',
  payment_id     TEXT,
  plan_key       TEXT NOT NULL,
  amount         NUMERIC(10, 2) NOT NULL,
  currency       TEXT NOT NULL DEFAULT 'INR',
  status         TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'processing' | 'success' | 'failed'
  payment_method TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ── 2. AUDIT & RECONCILE EXISTING POLICIES ON PAYMENTS & TRANSACTIONS ────────
-- Current policy audit:
-- 1. "Service role manages payments" on public.payments:
--    CRITICAL ISSUE: lacked explicit "TO service_role", granting permissive mutation access to all roles.
--    REPLACED BY: "payments_service_role_all" strictly scoped TO service_role.
-- 2. "Users view own payments" on public.payments:
--    REPLACED BY: "payments_user_select" (SELECT only, authenticated role, user_id = auth.uid()).
-- 3. "Service role inserts transactions" on public.membership_transactions:
--    CRITICAL ISSUE: lacked explicit "TO service_role", and only covered INSERT.
--    REPLACED BY: "membership_transactions_service_role_all" strictly scoped TO service_role for ALL commands.
-- 4. "Users view own transactions" on public.membership_transactions:
--    REPLACED BY: "membership_transactions_user_select" (SELECT only, authenticated role, profile_id = auth.uid()).
--
-- Safely drop only the policies on payments and membership_transactions.
-- Unrelated tables and policies are completely untouched.
DO $$
DECLARE
  pol RECORD;
BEGIN
  -- Drop existing policies on public.payments with logging
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'payments'
  LOOP
    RAISE NOTICE 'Replacing legacy policy: % on public.payments', pol.policyname;
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.payments', pol.policyname);
  END LOOP;

  -- Drop existing policies on public.membership_transactions with logging
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'membership_transactions'
  LOOP
    RAISE NOTICE 'Replacing legacy policy: % on public.membership_transactions', pol.policyname;
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.membership_transactions', pol.policyname);
  END LOOP;
END $$;

-- ── 3. STRICT RLS POLICIES ON PAYMENTS ───────────────────────────────────────
-- Full mutation access ONLY to service_role (ordinary users cannot insert/update/delete)
CREATE POLICY "payments_service_role_all"
  ON public.payments
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- Authenticated users have SELECT-ONLY access strictly scoped to their own records
CREATE POLICY "payments_user_select"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());


-- ── 4. ENHANCE MEMBERSHIP_TRANSACTIONS & SAFE AUDIT-PRESERVED DEDUPLICATION ──
ALTER TABLE public.membership_transactions
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS order_id TEXT,
  ADD COLUMN IF NOT EXISTS gateway TEXT DEFAULT 'cashfree';

-- 4a. Audit archive table for preserved financial trail
-- Guarantees zero data loss when reconciling duplicate order_id records
CREATE TABLE IF NOT EXISTS public.membership_transactions_audit_archive (
  archive_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  archived_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archive_reason      TEXT NOT NULL DEFAULT 'duplicate_order_id_reconciliation',
  original_id         UUID,
  profile_id          UUID,
  plan                TEXT,
  payment_id          TEXT,
  order_id            TEXT,
  gateway             TEXT,
  razorpay_payment_id TEXT,
  amount_paid_inr     NUMERIC(10, 2),
  plan_period         TEXT,
  activated_at        TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ
);

-- Secure audit archive table immediately with strict RLS and role permissions
ALTER TABLE public.membership_transactions_audit_archive ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'membership_transactions_audit_archive'
  LOOP
    RAISE NOTICE 'Replacing legacy policy: % on public.membership_transactions_audit_archive', pol.policyname;
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.membership_transactions_audit_archive', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "audit_archive_service_role_all"
  ON public.membership_transactions_audit_archive
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

REVOKE ALL ON public.membership_transactions_audit_archive FROM PUBLIC;
REVOKE ALL ON public.membership_transactions_audit_archive FROM anon;
REVOKE ALL ON public.membership_transactions_audit_archive FROM authenticated;
GRANT ALL ON public.membership_transactions_audit_archive TO service_role;

-- Idempotency constraint on audit archive table: never allow duplicate archive rows for the same original transaction
CREATE UNIQUE INDEX IF NOT EXISTS uq_tx_audit_archive_original_id
  ON public.membership_transactions_audit_archive(original_id)
  WHERE original_id IS NOT NULL;

-- Lock membership_transactions in SHARE ROW EXCLUSIVE mode during migration to serialize any concurrent writes
LOCK TABLE public.membership_transactions IN SHARE ROW EXCLUSIVE MODE;

-- 4b. Deterministic duplicate reconciliation:
-- Ranks duplicate order_ids deterministically:
-- 1. Matches verified payment_id in public.payments (highest priority)
-- 2. Earliest reliable created_at timestamp
-- 3. Deterministic tie-breaker on UUID id
-- Archives non-canonical duplicates before removal so financial audit history is preserved.
-- Fully idempotent: skips rows already archived on previous runs.
WITH ranked_transactions AS (
  SELECT
    t.*,
    ROW_NUMBER() OVER (
      PARTITION BY t.order_id
      ORDER BY
        CASE WHEN p.payment_id IS NOT NULL AND t.payment_id = p.payment_id THEN 0 ELSE 1 END ASC,
        COALESCE(t.created_at, t.activated_at, NOW()) ASC,
        t.id ASC
    ) AS ranking
  FROM public.membership_transactions t
  LEFT JOIN public.payments p ON p.order_id = t.order_id
  WHERE t.order_id IS NOT NULL
),
duplicates_to_archive AS (
  SELECT * FROM ranked_transactions WHERE ranking > 1
)
INSERT INTO public.membership_transactions_audit_archive (
  archive_reason, original_id, profile_id, plan, payment_id, order_id, gateway,
  razorpay_payment_id, amount_paid_inr, plan_period, activated_at, expires_at, created_at
)
SELECT
  'duplicate_order_id_reconciliation', id, profile_id, plan, payment_id, order_id, gateway,
  razorpay_payment_id, amount_paid_inr, plan_period, activated_at, expires_at, created_at
FROM duplicates_to_archive d
WHERE NOT EXISTS (
  SELECT 1 FROM public.membership_transactions_audit_archive a
  WHERE a.original_id = d.id
);

-- 4c. Delete from active table ONLY rows verified to be safely stored in the audit archive
WITH ranked_transactions AS (
  SELECT
    t.id,
    ROW_NUMBER() OVER (
      PARTITION BY t.order_id
      ORDER BY
        CASE WHEN p.payment_id IS NOT NULL AND t.payment_id = p.payment_id THEN 0 ELSE 1 END ASC,
        COALESCE(t.created_at, t.activated_at, NOW()) ASC,
        t.id ASC
    ) AS ranking
  FROM public.membership_transactions t
  LEFT JOIN public.payments p ON p.order_id = t.order_id
  WHERE t.order_id IS NOT NULL
)
DELETE FROM public.membership_transactions
WHERE id IN (
  SELECT r.id FROM ranked_transactions r
  JOIN public.membership_transactions_audit_archive a ON a.original_id = r.id
  WHERE r.ranking > 1
);

-- 4d. Pre-index verification: ensure zero duplicate non-null order_ids remain
DO $$
DECLARE
  v_dup_count INT;
BEGIN
  SELECT COUNT(*) INTO v_dup_count
  FROM (
    SELECT order_id
    FROM public.membership_transactions
    WHERE order_id IS NOT NULL
    GROUP BY order_id
    HAVING COUNT(*) > 1
  ) dups;

  IF v_dup_count > 0 THEN
    RAISE EXCEPTION 'Cannot enforce uniqueness: % duplicate non-null order_id records remain in public.membership_transactions', v_dup_count;
  END IF;
END $$;

-- 4e. Enforce uniqueness on non-null order_ids (safe for legacy null order_ids)
CREATE UNIQUE INDEX IF NOT EXISTS uq_membership_tx_order_id
  ON public.membership_transactions(order_id)
  WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_membership_tx_payment_id ON public.membership_transactions(payment_id);

ALTER TABLE public.membership_transactions ENABLE ROW LEVEL SECURITY;

-- Service role has full mutation and read access
CREATE POLICY "membership_transactions_service_role_all"
  ON public.membership_transactions
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- Authenticated users have SELECT-ONLY access to their own transaction history
CREATE POLICY "membership_transactions_user_select"
  ON public.membership_transactions
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());


-- ── 5. RECONCILE PROFILES MEMBERSHIP PLAN CHECK CONSTRAINT ──────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_membership_plan_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_membership_plan_check;
  END IF;

  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_membership_plan_check
    CHECK (membership_plan IS NULL OR membership_plan IN ('Gold', 'PrimeGold', 'PrimeTillUMarry', 'Diamond', 'Platinum'));
END $$;


-- ── 6. SECURE ATOMIC MEMBERSHIP ACTIVATION STORED PROCEDURE ──────────────────
-- Drop legacy function overloads (e.g. 9-parameter version with plan_months/plan_period defaults)
-- to prevent signature ambiguity in PostgREST and ensure clean RPC identity
DROP FUNCTION IF EXISTS public.activate_membership_payment(text, uuid, text, text, numeric, text, text, integer, text);
DROP FUNCTION IF EXISTS public.activate_membership_payment(text, uuid, text, text, numeric, text, text);

-- Exact function identity: public.activate_membership_payment(text, uuid, text, text, numeric, text, text)
-- SECURITY DEFINER with safe search_path and execution restricted to service_role only.
-- Validates that the order exists, matches the user, plan, amount, currency, and gateway.
-- Atomically transitions state and updates profiles, transactions, and payments in one transaction.
CREATE OR REPLACE FUNCTION public.activate_membership_payment(
  p_order_id TEXT,
  p_user_id UUID,
  p_plan_key TEXT,
  p_payment_id TEXT,
  p_amount NUMERIC,
  p_gateway TEXT DEFAULT 'cashfree',
  p_payment_method TEXT DEFAULT 'CASHFREE'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_payment RECORD;
  v_profile RECORD;
  v_now TIMESTAMPTZ := NOW();
  v_new_expiry TIMESTAMPTZ;
  v_plan_months INT;
  v_plan_period TEXT;
  v_plan_display_name TEXT;
BEGIN
  -- 1. Validate canonical checkout plan key and derive duration internally (never trust arbitrary input)
  -- Fails closed for Diamond, Platinum, or any unapproved plan
  IF p_plan_key = 'Gold' THEN
    v_plan_months := 3;
    v_plan_period := '3 months';
    v_plan_display_name := 'Gold';
  ELSIF p_plan_key = 'PrimeGold' THEN
    v_plan_months := 3;
    v_plan_period := '3 months';
    v_plan_display_name := 'Prime Gold';
  ELSIF p_plan_key = 'PrimeTillUMarry' THEN
    v_plan_months := 12;
    v_plan_period := '12 months';
    v_plan_display_name := 'Prime Till U Marry';
  ELSE
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Invalid checkout plan key. Must be Gold, PrimeGold, or PrimeTillUMarry.'
    );
  END IF;

  -- 2. Validate payment_id is non-empty
  IF p_payment_id IS NULL OR TRIM(p_payment_id) = '' THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Payment ID is required and cannot be empty.'
    );
  END IF;

  -- 3. Row lock on payments table for this order to serialize concurrent requests
  SELECT * INTO v_payment
  FROM public.payments
  WHERE order_id = p_order_id
  FOR UPDATE;

  -- The order MUST already be persisted in database (created via /api/create-order)
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Order record not found in database.'
    );
  END IF;

  -- 4. Check for already fulfilled order (Idempotency)
  IF v_payment.status = 'success' THEN
    SELECT membership_expiry INTO v_new_expiry FROM public.profiles WHERE id = v_payment.user_id;
    RETURN jsonb_build_object(
      'success', TRUE,
      'already_active', TRUE,
      'activated', FALSE,
      'order_id', p_order_id,
      'user_id', v_payment.user_id,
      'plan_key', v_payment.plan_key,
      'plan_name', v_plan_display_name,
      'plan_period', v_plan_period,
      'expiry', v_new_expiry
    );
  END IF;

  -- 5. Check for active concurrent processing (with 5-minute timeout recovery)
  IF v_payment.status = 'processing' AND v_payment.updated_at >= (v_now - INTERVAL '5 minutes') THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'in_progress', TRUE,
      'message', 'Payment activation is currently in progress by another request.'
    );
  END IF;

  -- Only pending or stale-processing orders can be activated
  IF v_payment.status NOT IN ('pending', 'processing') THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Order cannot be activated from current status: ' || v_payment.status
    );
  END IF;

  -- 6. Strict Order Integrity Validation
  -- Never allow activating a different user, plan, amount, currency, or gateway than the persisted order
  IF v_payment.user_id IS NULL OR v_payment.user_id <> p_user_id THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Order ownership mismatch: User ID does not match order record.'
    );
  END IF;

  IF v_payment.plan_key <> p_plan_key THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Plan mismatch: Plan key does not match order record.'
    );
  END IF;

  -- Exact payment amount validation: remove rounded comparison that can accept incorrect amounts
  IF v_payment.amount <> p_amount THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Amount mismatch: Paid amount does not match order record.'
    );
  END IF;

  IF v_payment.currency <> 'INR' THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Currency mismatch: Order is not in INR.'
    );
  END IF;

  IF v_payment.gateway <> p_gateway THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Gateway mismatch.'
    );
  END IF;

  -- 7. Atomically claim order for processing
  UPDATE public.payments
  SET status = 'processing',
      user_id = COALESCE(user_id, p_user_id),
      payment_id = COALESCE(p_payment_id, payment_id),
      payment_method = COALESCE(p_payment_method, payment_method),
      updated_at = v_now
  WHERE order_id = p_order_id;

  -- 8. Lock profile row for extension
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    UPDATE public.payments SET status = 'failed', updated_at = v_now WHERE order_id = p_order_id;
    RETURN jsonb_build_object('success', FALSE, 'error', 'Target user profile not found.');
  END IF;

  -- 9. Safe expiry calculation without double extensions
  IF v_profile.membership_expiry IS NOT NULL AND v_profile.membership_expiry > v_now THEN
    v_new_expiry := v_profile.membership_expiry + (v_plan_months || ' months')::INTERVAL;
  ELSE
    v_new_expiry := v_now + (v_plan_months || ' months')::INTERVAL;
  END IF;

  -- 10. Update profile (satisfies CHECK constraint, exact numeric price)
  UPDATE public.profiles
  SET is_premium = TRUE,
      membership_plan = p_plan_key,
      membership_expiry = v_new_expiry,
      membership_activated = v_now,
      membership_price_paid = p_amount,
      membership_plan_period = v_plan_period,
      updated_at = v_now
  WHERE id = p_user_id;

  -- 11. Record in membership_transactions (guaranteed unique by order_id, exact numeric price)
  -- Does NOT swallow insert errors; any constraint failure aborts the entire transaction
  INSERT INTO public.membership_transactions (
    profile_id,
    plan,
    payment_id,
    order_id,
    gateway,
    razorpay_payment_id,
    amount_paid_inr,
    plan_period,
    activated_at,
    expires_at,
    created_at
  ) VALUES (
    p_user_id,
    p_plan_key,
    p_payment_id,
    p_order_id,
    p_gateway,
    p_payment_id,
    p_amount,
    v_plan_period,
    v_now,
    v_new_expiry,
    v_now
  );

  -- 11. Finalize payment record status to 'success'
  -- Does NOT swallow update errors
  UPDATE public.payments
  SET status = 'success',
      payment_id = p_payment_id,
      payment_method = p_payment_method,
      amount = p_amount,
      updated_at = v_now
  WHERE order_id = p_order_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'already_active', FALSE,
    'activated', TRUE,
    'order_id', p_order_id,
    'user_id', p_user_id,
    'plan_key', p_plan_key,
    'plan_name', v_plan_display_name,
    'plan_period', v_plan_period,
    'expiry', v_new_expiry
  );
END;
$$;

-- ── 7. STRICT ACCESS PERMISSIONS ON RPC ──────────────────────────────────────
-- Explicitly revoke execution from PUBLIC, anon, and authenticated
REVOKE ALL ON FUNCTION public.activate_membership_payment(TEXT, UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activate_membership_payment(TEXT, UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.activate_membership_payment(TEXT, UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT) FROM authenticated;

-- Grant execution ONLY to service_role (bypasses RLS only from secure backend API)
GRANT EXECUTE ON FUNCTION public.activate_membership_payment(TEXT, UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT) TO service_role;

