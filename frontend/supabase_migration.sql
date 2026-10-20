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
  membership_plan        TEXT CHECK (membership_plan IN ('Gold', 'Diamond', 'Platinum')),
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
  has_horoscope          BOOLEAN NOT NULL DEFAULT false,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all columns exist on pre-existing tables
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS body_type              TEXT,
  ADD COLUMN IF NOT EXISTS time_of_birth          TEXT,
  ADD COLUMN IF NOT EXISTS partner_gender         TEXT CHECK (partner_gender IN ('male', 'female', 'any')),
  ADD COLUMN IF NOT EXISTS caste_change_count     INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auth_email             TEXT,
  ADD COLUMN IF NOT EXISTS is_premium             BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS membership_plan        TEXT CHECK (membership_plan IN ('Gold','PrimeGold','PrimeTillUMarry','Diamond','Platinum')),
  ADD COLUMN IF NOT EXISTS membership_expiry      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS membership_activated   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS membership_price_paid  NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS membership_plan_period TEXT,
  ADD COLUMN IF NOT EXISTS is_banned              BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ban_reason             TEXT,
  ADD COLUMN IF NOT EXISTS verification_status    TEXT DEFAULT 'unsubmitted',
  ADD COLUMN IF NOT EXISTS verification_document  TEXT,
  ADD COLUMN IF NOT EXISTS admin_notes            TEXT,
  ADD COLUMN IF NOT EXISTS has_horoscope          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_active            TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS profiles_gender_idx              ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS profiles_religion_idx            ON public.profiles(religion);
CREATE INDEX IF NOT EXISTS profiles_caste_idx               ON public.profiles(caste);
CREATE INDEX IF NOT EXISTS profiles_city_idx                ON public.profiles(city);
CREATE INDEX IF NOT EXISTS profiles_last_active_idx         ON public.profiles(last_active DESC);
CREATE INDEX IF NOT EXISTS profiles_mobile_idx              ON public.profiles(mobile);
CREATE INDEX IF NOT EXISTS profiles_is_premium_idx          ON public.profiles(is_premium);
CREATE INDEX IF NOT EXISTS idx_profiles_has_horoscope       ON public.profiles(has_horoscope);
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
CREATE POLICY "Owner can manage horoscope" ON public.horoscopes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- One-time backfill based on existing rows
UPDATE public.profiles p
SET has_horoscope = EXISTS (
  SELECT 1 FROM public.horoscopes h WHERE h.user_id = p.id
);

-- Trigger function to keep profiles.has_horoscope in sync
CREATE OR REPLACE FUNCTION public.sync_profile_has_horoscope()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET has_horoscope = EXISTS (SELECT 1 FROM public.horoscopes WHERE user_id = NEW.user_id)
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET has_horoscope = EXISTS (SELECT 1 FROM public.horoscopes WHERE user_id = OLD.user_id)
    WHERE id = OLD.user_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN
      UPDATE public.profiles
      SET has_horoscope = EXISTS (SELECT 1 FROM public.horoscopes WHERE user_id = OLD.user_id)
      WHERE id = OLD.user_id;
      UPDATE public.profiles
      SET has_horoscope = EXISTS (SELECT 1 FROM public.horoscopes WHERE user_id = NEW.user_id)
      WHERE id = NEW.user_id;
    ELSE
      UPDATE public.profiles
      SET has_horoscope = EXISTS (SELECT 1 FROM public.horoscopes WHERE user_id = NEW.user_id)
      WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_has_horoscope ON public.horoscopes;
CREATE TRIGGER trg_sync_profile_has_horoscope
  AFTER INSERT OR UPDATE OR DELETE ON public.horoscopes
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_has_horoscope();

REVOKE EXECUTE ON FUNCTION public.sync_profile_has_horoscope() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_profile_has_horoscope() TO authenticated, service_role;


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
ALTER TABLE public.success_stories ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE;
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
DROP POLICY IF EXISTS "Users view own transactions"     ON public.membership_transactions;
DROP POLICY IF EXISTS "Service role inserts transactions" ON public.membership_transactions;
CREATE POLICY "Users view own transactions"     ON public.membership_transactions FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Service role inserts transactions" ON public.membership_transactions FOR INSERT WITH CHECK (TRUE);

ALTER TABLE public.membership_transactions ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE public.membership_transactions ADD COLUMN IF NOT EXISTS order_id TEXT;
ALTER TABLE public.membership_transactions ADD COLUMN IF NOT EXISTS gateway TEXT DEFAULT 'cashfree';

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
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own payments" ON public.payments;
DROP POLICY IF EXISTS "Service role manages payments" ON public.payments;
CREATE POLICY "Users view own payments" ON public.payments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service role manages payments" ON public.payments FOR ALL WITH CHECK (TRUE);

-- Atomic stored procedure for race-free membership activation
CREATE OR REPLACE FUNCTION public.activate_membership_payment(
  p_order_id TEXT,
  p_user_id UUID,
  p_plan_key TEXT,
  p_payment_id TEXT,
  p_amount NUMERIC,
  p_gateway TEXT DEFAULT 'cashfree',
  p_payment_method TEXT DEFAULT 'CASHFREE',
  p_plan_months INT DEFAULT 3,
  p_plan_period TEXT DEFAULT '3 months'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment RECORD;
  v_profile RECORD;
  v_now TIMESTAMPTZ := NOW();
  v_new_expiry TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_payment FROM public.payments WHERE order_id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.payments (
      order_id, user_id, gateway, payment_id, plan_key, amount, currency, status, payment_method, created_at, updated_at
    ) VALUES (
      p_order_id, p_user_id, p_gateway, p_payment_id, p_plan_key, p_amount, 'INR', 'processing', p_payment_method, v_now, v_now
    ) RETURNING * INTO v_payment;
  ELSIF v_payment.status = 'success' THEN
    RETURN jsonb_build_object('success', TRUE, 'already_active', TRUE, 'order_id', p_order_id, 'user_id', v_payment.user_id, 'plan_key', v_payment.plan_key);
  ELSE
    UPDATE public.payments
    SET status = 'processing', user_id = COALESCE(user_id, p_user_id), payment_id = COALESCE(p_payment_id, payment_id), updated_at = v_now
    WHERE order_id = p_order_id;
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    UPDATE public.payments SET status = 'failed', updated_at = v_now WHERE order_id = p_order_id;
    RETURN jsonb_build_object('success', FALSE, 'error', 'User profile not found');
  END IF;

  IF v_profile.membership_expiry IS NOT NULL AND v_profile.membership_expiry > v_now THEN
    v_new_expiry := v_profile.membership_expiry + (p_plan_months || ' months')::INTERVAL;
  ELSE
    v_new_expiry := v_now + (p_plan_months || ' months')::INTERVAL;
  END IF;

  UPDATE public.profiles
  SET is_premium = TRUE, membership_plan = p_plan_key, membership_expiry = v_new_expiry, membership_activated = v_now, membership_price_paid = ROUND(p_amount), membership_plan_period = p_plan_period, updated_at = v_now
  WHERE id = p_user_id;

  INSERT INTO public.membership_transactions (
    profile_id, plan, payment_id, order_id, gateway, razorpay_payment_id, amount_paid_inr, plan_period, activated_at, expires_at, created_at
  ) VALUES (
    p_user_id, p_plan_key, p_payment_id, p_order_id, p_gateway, p_payment_id, ROUND(p_amount), p_plan_period, v_now, v_new_expiry, v_now
  );

  UPDATE public.payments
  SET status = 'success', payment_id = p_payment_id, payment_method = p_payment_method, amount = p_amount, updated_at = v_now
  WHERE order_id = p_order_id;

  RETURN jsonb_build_object('success', TRUE, 'already_active', FALSE, 'activated', TRUE, 'order_id', p_order_id, 'user_id', p_user_id, 'plan_key', p_plan_key, 'expiry', v_new_expiry, 'plan_period', p_plan_period);
END;
$$;


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

-- Private Horoscopes Storage Bucket (strictly private, public = false)
INSERT INTO storage.buckets (id, name, public) VALUES ('horoscopes', 'horoscopes', false) ON CONFLICT (id) DO UPDATE SET public = false;
DROP POLICY IF EXISTS "Auth users upload own horoscope" ON storage.objects;
DROP POLICY IF EXISTS "Auth users update own horoscope" ON storage.objects;
DROP POLICY IF EXISTS "Auth users read own horoscope"   ON storage.objects;
DROP POLICY IF EXISTS "Auth users delete own horoscope" ON storage.objects;

CREATE POLICY "Auth users upload own horoscope" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'horoscopes'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Auth users update own horoscope" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'horoscopes'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'horoscopes'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Auth users read own horoscope" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'horoscopes'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Auth users delete own horoscope" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'horoscopes'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- Success Stories Buckets (public read, service role / admin write)
INSERT INTO storage.buckets (id, name, public) VALUES ('success stories', 'success stories', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('success-stories', 'success-stories', true) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Public success stories photos read" ON storage.objects;
CREATE POLICY "Public success stories photos read" ON storage.objects FOR SELECT USING (bucket_id IN ('success stories', 'success-stories'));


-- ── 15. CONTACT REVEALS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_reveals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  revealed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(viewer_id, target_id)
);
CREATE INDEX IF NOT EXISTS idx_contact_reveals_viewer ON public.contact_reveals(viewer_id);
ALTER TABLE public.contact_reveals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access reveals" ON public.contact_reveals;
CREATE POLICY "Public access reveals" ON public.contact_reveals FOR ALL USING (true) WITH CHECK (true);

-- ── 16. VERIFY SCHEMA ────────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles','profile_photos','otp_store','profile_views',
                     'shortlists','interests','interests_sent','messages','horoscopes',
                     'verification_requests','notifications','compatibility_answers',
                     'success_stories','membership_transactions', 'contact_reveals',
                     'user_sessions', 'notification_preferences')
ORDER BY table_name;

-- ── 17. USER SESSIONS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    ip_address TEXT,
    device TEXT,
    login_time TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own sessions" ON public.user_sessions;
CREATE POLICY "Users access own sessions" ON public.user_sessions FOR ALL USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Public access sessions" ON public.user_sessions;
CREATE POLICY "Public access sessions" ON public.user_sessions FOR ALL USING (true) WITH CHECK (true);

-- ── 18. NOTIFICATION PREFERENCES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    email_matches BOOLEAN DEFAULT TRUE,
    email_messages BOOLEAN DEFAULT TRUE,
    email_promotions BOOLEAN DEFAULT FALSE,
    inapp_matches BOOLEAN DEFAULT TRUE,
    inapp_messages BOOLEAN DEFAULT TRUE,
    inapp_promotions BOOLEAN DEFAULT TRUE
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users access own notification preferences" ON public.notification_preferences FOR ALL USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Public access notifications prefs" ON public.notification_preferences;
CREATE POLICY "Public access notifications prefs" ON public.notification_preferences FOR ALL USING (true) WITH CHECK (true);
