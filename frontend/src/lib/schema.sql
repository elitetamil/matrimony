-- ============================================================
-- ELITE TAMIL MATRIMONY — Consolidated Supabase Schema & Migration
-- Complete, safe to re-run (all statements use IF NOT EXISTS / OR REPLACE)
-- Paste & Run in: Supabase Dashboard -> SQL Editor
-- ============================================================


-- ── 1. PROFILES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                     UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  profile_for            TEXT NOT NULL DEFAULT 'Myself',
  name                   TEXT NOT NULL,
  mobile                 TEXT UNIQUE,
  email                  TEXT,
  auth_email             TEXT,
  gender                 TEXT CHECK (gender IN ('male', 'female')),
  dob                    DATE,
  height                 TEXT,
  weight                 TEXT,
  body_type              TEXT,
  physical_status        TEXT,
  marital_status         TEXT,
  religion               TEXT,
  caste                  TEXT,
  subcaste               TEXT,
  gothram                TEXT,
  mother_tongue          TEXT,
  education              TEXT,
  college                TEXT,
  occupation             TEXT,
  company                TEXT,
  employment_type        TEXT,
  income                 TEXT,
  country                TEXT NOT NULL DEFAULT 'India',
  state                  TEXT,
  city                   TEXT,
  native_place           TEXT,
  diet                   TEXT,
  smoking                TEXT,
  drinking               TEXT,
  disabilities           TEXT,
  star                   TEXT,
  rasi                   TEXT,
  dhosham                TEXT,
  time_of_birth          TEXT,
  languages              TEXT[] DEFAULT '{}',
  hobbies                TEXT[] DEFAULT '{}',
  interests              TEXT[] DEFAULT '{}',
  about                  TEXT CHECK (CHAR_LENGTH(about) <= 500),
  photo_url              TEXT,
  is_verified            BOOLEAN NOT NULL DEFAULT false,
  is_premium             BOOLEAN NOT NULL DEFAULT false,
  membership_plan        TEXT CHECK (membership_plan IN ('Gold', 'PrimeGold', 'PrimeTillUMarry', 'Diamond', 'Platinum')),
  membership_expiry      TIMESTAMPTZ,
  membership_activated   TIMESTAMPTZ,
  membership_price_paid  NUMERIC(10, 2),
  membership_plan_period TEXT,
  father_occupation      TEXT,
  mother_occupation      TEXT,
  family_status          TEXT,
  family_type            TEXT,
  brothers               INT DEFAULT 0,
  sisters                INT DEFAULT 0,
  partner_gender         TEXT CHECK (partner_gender IN ('male', 'female', 'any')),
  partner_age_min        INT DEFAULT 22,
  partner_age_max        INT DEFAULT 35,
  partner_religion       TEXT,
  partner_caste          TEXT,
  partner_education      TEXT,
  partner_occupation     TEXT,
  partner_income         TEXT,
  partner_height_min     TEXT,
  partner_height_max     TEXT,
  partner_country        TEXT DEFAULT 'India',
  partner_marital_status TEXT[] DEFAULT '{}',
  partner_mother_tongue  TEXT[] DEFAULT '{}',
  is_banned              BOOLEAN NOT NULL DEFAULT false,
  ban_reason             TEXT,
  verification_status    TEXT DEFAULT 'unsubmitted' CHECK (verification_status IN ('unsubmitted','pending','approved','rejected')),
  verification_document  TEXT,
  admin_notes            TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all columns exist on pre-existing tables
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS partner_gender         TEXT CHECK (partner_gender IN ('male', 'female', 'any')),
  ADD COLUMN IF NOT EXISTS auth_email             TEXT,
  ADD COLUMN IF NOT EXISTS is_premium             BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS membership_plan        TEXT CHECK (membership_plan IN ('Gold','Diamond','Platinum')),
  ADD COLUMN IF NOT EXISTS membership_expiry      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS membership_activated   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS membership_price_paid  NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS membership_plan_period TEXT,
  ADD COLUMN IF NOT EXISTS is_banned              BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ban_reason             TEXT,
  ADD COLUMN IF NOT EXISTS verification_status    TEXT DEFAULT 'unsubmitted',
  ADD COLUMN IF NOT EXISTS verification_document  TEXT,
  ADD COLUMN IF NOT EXISTS admin_notes            TEXT,
  ADD COLUMN IF NOT EXISTS updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_active            TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS profiles_gender_idx              ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS profiles_religion_idx            ON public.profiles(religion);
CREATE INDEX IF NOT EXISTS profiles_caste_idx               ON public.profiles(caste);
CREATE INDEX IF NOT EXISTS profiles_city_idx                ON public.profiles(city);
CREATE INDEX IF NOT EXISTS profiles_last_active_idx         ON public.profiles(last_active DESC);
CREATE INDEX IF NOT EXISTS profiles_mobile_idx              ON public.profiles(mobile);
CREATE INDEX IF NOT EXISTS profiles_is_premium_idx          ON public.profiles(is_premium);
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned          ON public.profiles(is_banned);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_membership_plan    ON public.profiles(membership_plan);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile"   ON public.profiles;
CREATE POLICY "Profiles are publicly readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile"   ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile"   ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can delete own profile"   ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Auto-create profile on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, mobile, email, auth_email, profile_for, created_at, updated_at, last_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Member'),
    NEW.raw_user_meta_data->>'mobile',
    CASE WHEN NEW.email NOT LIKE '%@etm.app' THEN NEW.email ELSE NULL END,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'profile_for', 'Myself'),
    NOW(), NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name        = EXCLUDED.name,
    mobile      = COALESCE(EXCLUDED.mobile, public.profiles.mobile),
    profile_for = COALESCE(EXCLUDED.profile_for, public.profiles.profile_for),
    updated_at  = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.add_auth_email_column()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auth_email TEXT; END;
$$;
GRANT EXECUTE ON FUNCTION public.add_auth_email_column() TO anon, authenticated;


-- ── 2. PROFILE PHOTOS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profile_photos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS profile_photos_profile_idx ON public.profile_photos(profile_id);
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read profile photos" ON public.profile_photos;
DROP POLICY IF EXISTS "Users manage own photos"        ON public.profile_photos;
CREATE POLICY "Anyone can read profile photos" ON public.profile_photos FOR SELECT USING (true);
CREATE POLICY "Users manage own photos"        ON public.profile_photos FOR ALL USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());


-- ── 3. OTP STORE ─────────────────────────────────────────────────────
-- Accessed only via server-side API routes -> RLS disabled.
CREATE TABLE IF NOT EXISTS public.otp_store (
  identifier TEXT PRIMARY KEY,
  otp        TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts   INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS otp_store_expires_idx ON public.otp_store(expires_at);
ALTER TABLE public.otp_store DISABLE ROW LEVEL SECURITY;


-- ── 4. PROFILE VIEWS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profile_views (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS views_viewer_idx ON public.profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS views_viewed_idx ON public.profile_views(viewed_id);
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth users can insert views"   ON public.profile_views;
DROP POLICY IF EXISTS "Users can see their own views" ON public.profile_views;
CREATE POLICY "Auth users can insert views"   ON public.profile_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);
CREATE POLICY "Users can see their own views" ON public.profile_views FOR SELECT USING (auth.uid() = viewer_id OR auth.uid() = viewed_id);


-- ── 5. SHORTLISTS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shortlists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, target_id)
);
CREATE INDEX IF NOT EXISTS shortlists_user_idx   ON public.shortlists(user_id);
CREATE INDEX IF NOT EXISTS shortlists_target_idx ON public.shortlists(target_id);
ALTER TABLE public.shortlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own shortlists"        ON public.shortlists;
DROP POLICY IF EXISTS "Users can see who shortlisted them" ON public.shortlists;
CREATE POLICY "Users manage own shortlists"        ON public.shortlists FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can see who shortlisted them" ON public.shortlists FOR SELECT USING (auth.uid() = target_id);


-- ── 6. INTERESTS & INTERESTS_SENT ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.interests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID NOT NULL CONSTRAINT interests_sender_id_fkey REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id  UUID NOT NULL CONSTRAINT interests_receiver_id_fkey REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  message      TEXT,
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);
CREATE INDEX IF NOT EXISTS interests_sender_idx   ON public.interests(sender_id);
CREATE INDEX IF NOT EXISTS interests_receiver_idx ON public.interests(receiver_id);
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sender can insert interest"           ON public.interests;
DROP POLICY IF EXISTS "Sender or receiver can view interest" ON public.interests;
DROP POLICY IF EXISTS "Receiver can update interest"         ON public.interests;
DROP POLICY IF EXISTS "Sender can delete interest"           ON public.interests;
DROP POLICY IF EXISTS "Users manage own interests"           ON public.interests;
CREATE POLICY "Sender can insert interest"           ON public.interests FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Sender or receiver can view interest" ON public.interests FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Receiver can update interest"         ON public.interests FOR UPDATE USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);
CREATE POLICY "Sender can delete interest"           ON public.interests FOR DELETE USING (auth.uid() = sender_id);

CREATE TABLE IF NOT EXISTS public.interests_sent (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID NOT NULL CONSTRAINT interests_sent_sender_id_fkey REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id  UUID NOT NULL CONSTRAINT interests_sent_receiver_id_fkey REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  message      TEXT,
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);
CREATE INDEX IF NOT EXISTS interests_sent_sender_idx   ON public.interests_sent(sender_id);
CREATE INDEX IF NOT EXISTS interests_sent_receiver_idx ON public.interests_sent(receiver_id);
ALTER TABLE public.interests_sent ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sender can insert interest_sent"           ON public.interests_sent;
DROP POLICY IF EXISTS "Sender or receiver can view interest_sent" ON public.interests_sent;
DROP POLICY IF EXISTS "Receiver can update interest_sent"         ON public.interests_sent;
DROP POLICY IF EXISTS "Sender can delete interest_sent"           ON public.interests_sent;
CREATE POLICY "Sender can insert interest_sent"           ON public.interests_sent FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Sender or receiver can view interest_sent" ON public.interests_sent FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Receiver can update interest_sent"         ON public.interests_sent FOR UPDATE USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);
CREATE POLICY "Sender can delete interest_sent"           ON public.interests_sent FOR DELETE USING (auth.uid() = sender_id);


-- ── 7. MESSAGES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  read_at     TIMESTAMPTZ,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS messages_sender_idx   ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver_idx ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS messages_sent_at_idx  ON public.messages(sent_at DESC);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sender can insert message"            ON public.messages;
DROP POLICY IF EXISTS "Sender or receiver can view messages" ON public.messages;
DROP POLICY IF EXISTS "Receiver can mark as read"            ON public.messages;
CREATE POLICY "Sender can insert message"            ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Sender or receiver can view messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Receiver can mark as read"            ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);


-- ── 8. HOROSCOPES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.horoscopes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  file_url    TEXT NOT NULL,
  file_name   TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.horoscopes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner can manage horoscope" ON public.horoscopes;
CREATE POLICY "Owner can manage horoscope" ON public.horoscopes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 9. VERIFICATION REQUESTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_path TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at   TIMESTAMPTZ
);
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner manages own verification requests" ON public.verification_requests;
CREATE POLICY "Owner manages own verification requests" ON public.verification_requests FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── 10. NOTIFICATIONS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  href       TEXT,
  read       BOOLEAN NOT NULL DEFAULT false,
  is_read    BOOLEAN NOT NULL DEFAULT false,
  read_at    TIMESTAMPTZ,
  data       JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS href TEXT,
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS notifications_user_idx       ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read    ON public.notifications(user_id, is_read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own notifications"        ON public.notifications;
DROP POLICY IF EXISTS "Users see own notifications"           ON public.notifications;
DROP POLICY IF EXISTS "Users mark notifications read"          ON public.notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users mark notifications read" ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);


-- ── 11. COMPATIBILITY ANSWERS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.compatibility_answers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  answer      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, question_id)
);
CREATE INDEX IF NOT EXISTS idx_compat_answers_profile ON public.compatibility_answers(profile_id);
ALTER TABLE public.compatibility_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "compat_answers_owner_all"          ON public.compatibility_answers;
DROP POLICY IF EXISTS "compat_answers_read_authenticated" ON public.compatibility_answers;
CREATE POLICY "compat_answers_owner_all"          ON public.compatibility_answers FOR ALL    USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
CREATE POLICY "compat_answers_read_authenticated" ON public.compatibility_answers FOR SELECT USING (auth.role() = 'authenticated');


-- ── 12. SUCCESS STORIES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.success_stories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  city       TEXT,
  married    TEXT,
  story      TEXT NOT NULL,
  photo_url  TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure is_visible column exists on pre-existing tables
ALTER TABLE public.success_stories
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view success stories"         ON public.success_stories;
DROP POLICY IF EXISTS "Service role manages success stories"    ON public.success_stories;
CREATE POLICY "Public can view success stories"      ON public.success_stories FOR SELECT USING (is_visible = TRUE);
CREATE POLICY "Service role manages success stories" ON public.success_stories FOR ALL WITH CHECK (TRUE);

DROP TRIGGER IF EXISTS set_success_stories_updated_at ON public.success_stories;
CREATE TRIGGER set_success_stories_updated_at
  BEFORE UPDATE ON public.success_stories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ── 13. MEMBERSHIP TRANSACTIONS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.membership_transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan                TEXT NOT NULL,
  razorpay_payment_id TEXT,
  amount_paid_inr     NUMERIC(10, 2),
  plan_period         TEXT,
  activated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_membership_tx_profile ON public.membership_transactions(profile_id);
ALTER TABLE public.membership_transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.membership_transactions ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE public.membership_transactions ADD COLUMN IF NOT EXISTS order_id TEXT;
ALTER TABLE public.membership_transactions ADD COLUMN IF NOT EXISTS gateway TEXT DEFAULT 'cashfree';

-- Safely resolve existing duplicate order_ids before creating the unique index
-- 1. Create audit archive table to preserve financial audit trail
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

-- 2. Deterministic duplicate reconciliation based on payment_id, creation time, and tie-breaker
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
-- Idempotency constraint on audit archive table: never allow duplicate archive rows for the same original transaction
CREATE UNIQUE INDEX IF NOT EXISTS uq_tx_audit_archive_original_id
  ON public.membership_transactions_audit_archive(original_id)
  WHERE original_id IS NOT NULL;

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

-- Pre-index verification: ensure zero duplicate non-null order_ids remain
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

-- Enforce uniqueness on non-null order_ids (safe for legacy null order_ids)
CREATE UNIQUE INDEX IF NOT EXISTS uq_membership_tx_order_id
  ON public.membership_transactions(order_id)
  WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_membership_tx_payment_id ON public.membership_transactions(payment_id);

-- Payments audit table (for webhook and order verification tracking)
CREATE TABLE IF NOT EXISTS public.payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       TEXT UNIQUE NOT NULL,
  user_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  gateway        TEXT NOT NULL DEFAULT 'cashfree',
  payment_id     TEXT,
  plan_key       TEXT NOT NULL,
  amount         NUMERIC(10, 2) NOT NULL,
  currency       TEXT NOT NULL DEFAULT 'INR',
  status         TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Dynamically drop all existing policies on payments and membership_transactions
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'payments'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.payments', pol.policyname);
  END LOOP;

  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'membership_transactions'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.membership_transactions', pol.policyname);
  END LOOP;
END $$;

-- Payments policies
CREATE POLICY "payments_service_role_all"
  ON public.payments
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "payments_user_select"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Membership transactions policies
CREATE POLICY "membership_transactions_service_role_all"
  ON public.membership_transactions
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "membership_transactions_user_select"
  ON public.membership_transactions
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- Reconcile profiles membership_plan check constraint
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

-- Drop legacy overloads before creating new function
DROP FUNCTION IF EXISTS public.activate_membership_payment(text, uuid, text, text, numeric, text, text, integer, text);
DROP FUNCTION IF EXISTS public.activate_membership_payment(text, uuid, text, text, numeric, text, text);

-- Atomic stored procedure for race-free membership activation
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

  -- 12. Finalize payment record status to 'success'
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

REVOKE ALL ON FUNCTION public.activate_membership_payment(TEXT, UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activate_membership_payment(TEXT, UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.activate_membership_payment(TEXT, UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.activate_membership_payment(TEXT, UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT) TO service_role;



-- ── 14. STORAGE BUCKETS & POLICIES ───────────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Public profile photo reads"           ON storage.objects;
DROP POLICY IF EXISTS "Auth users upload own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Auth users update own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Auth users delete own profile photos" ON storage.objects;
CREATE POLICY "Public profile photo reads"           ON storage.objects FOR SELECT USING (bucket_id = 'profile-photos');
CREATE POLICY "Auth users upload own profile photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::TEXT = (storage.foldername(name))[1]);
CREATE POLICY "Auth users update own profile photos" ON storage.objects FOR UPDATE USING (bucket_id = 'profile-photos' AND auth.uid()::TEXT = (storage.foldername(name))[1]);
CREATE POLICY "Auth users delete own profile photos" ON storage.objects FOR DELETE USING (bucket_id = 'profile-photos' AND auth.uid()::TEXT = (storage.foldername(name))[1]);

INSERT INTO storage.buckets (id, name, public) VALUES ('verification-documents', 'verification-documents', false) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Owners access own verification docs" ON storage.objects;
CREATE POLICY "Owners access own verification docs" ON storage.objects FOR ALL USING (bucket_id = 'verification-documents' AND auth.uid()::TEXT = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'verification-documents' AND auth.uid()::TEXT = (storage.foldername(name))[1]);


-- ── 15. VERIFY SCHEMA ────────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles','profile_photos','otp_store','profile_views',
                     'shortlists','interests','interests_sent','messages','horoscopes',
                     'verification_requests','notifications','compatibility_answers',
                     'success_stories','membership_transactions')
ORDER BY table_name;
