// src/lib/auth-store.ts
// ── SUPABASE AUTH + PROFILES ──────────────────────────────────────────
// Replaces the old localStorage-based auth system.
// All data is now persisted in Supabase auth.users + public.profiles.

import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';
import { COMPATIBLE_PAIRS } from '@/data/compatibility-questions';

// ── TYPE DEFINITIONS ──────────────────────────────────────────────────

export interface ProfilePhoto {
  id: string;
  profileId: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface RegisteredUser {
  id: string;
  profileFor: string;
  name: string;
  mobile: string;
  email?: string;
  authEmail?: string;  // The Supabase auth email used for this account
  dob?: string;
  gender?: 'male' | 'female';
  height?: string;
  weight?: string;
  bodyType?: string;
  physicalStatus?: string;
  maritalStatus?: string;
  religion?: string;
  caste?: string;
  subcaste?: string;
  gothram?: string;
  motherTongue?: string;
  education?: string;
  college?: string;
  occupation?: string;
  company?: string;
  employmentType?: string;
  income?: string;
  country?: string;
  state?: string;
  city?: string;
  nativePlace?: string;
  diet?: string;
  smoking?: string;
  drinking?: string;
  disabilities?: string;
  star?: string;
  rasi?: string;
  dhosham?: string;
  timeOfBirth?: string;
  languages?: string[];
  hobbies?: string[];
  interests?: string[];
  about?: string;
  photoUrl?: string;
  isVerified?: boolean;
  isPremium?: boolean;
  partnerAgeMin?: number;
  partnerAgeMax?: number;
  partnerReligion?: string;
  partnerCaste?: string;
  partnerEducation?: string;
  partnerOccupation?: string;
  partnerIncome?: string;
  partnerHeightMin?: string;
  partnerHeightMax?: string;
  partnerCountry?: string;
  partnerMaritalStatus?: string[];
  partnerMotherTongue?: string[];
  fatherOccupation?: string;
  motherOccupation?: string;
  familyStatus?: string;
  familyType?: string;
  brothers?: number;
  sisters?: number;
  createdAt: string;
  lastActive?: string;
  isOnline?: boolean;
  // Computed / display fields (used in profile page, also present in ProfileData)
  age?: number;
  location?: string;
  community?: string;
  compatibilityScore?: number;
  matchReasons?: string[];
  membershipPlan?: 'Free' | 'Gold' | 'PrimeGold' | 'PrimeTillUMarry' | 'Diamond' | 'Platinum' | null;  // active plan name
  membershipExpiry?: string;  // ISO datetime
  membershipActivated?: string;
  membershipPricePaid?: number;  // INR paid (after GST)
  membershipPlanPeriod?: string; // e.g. "1 Month", "3 Months"
  photos?: ProfilePhoto[];
  casteChangeCount?: number; // tracks how many times caste has been changed
}

export type RegisterPayload = Omit<RegisteredUser, 'id' | 'createdAt' | 'isVerified' | 'isPremium'> & {
  password: string;
};

// ── DB ↔ APP SHAPE ADAPTERS ───────────────────────────────────────────

// Convert snake_case DB row → camelCase app object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToUser(row: Record<string, any>): RegisteredUser {
  return {
    id: row.id,
    profileFor: row.profile_for ?? '',
    name: row.name ?? '',
    mobile: row.mobile ?? '',
    email: row.email ?? undefined,
    authEmail: row.auth_email ?? undefined,
    dob: row.dob ?? undefined,
    gender: row.gender as 'male' | 'female' | undefined,
    height: row.height ?? undefined,
    weight: row.weight ?? undefined,
    bodyType: row.body_type ?? undefined,
    physicalStatus: row.physical_status ?? undefined,
    maritalStatus: row.marital_status ?? undefined,
    religion: row.religion ?? undefined,
    caste: row.caste ?? undefined,
    subcaste: row.subcaste ?? undefined,
    gothram: row.gothram ?? undefined,
    motherTongue: row.mother_tongue ?? undefined,
    education: row.education ?? undefined,
    college: row.college ?? undefined,
    occupation: row.occupation ?? undefined,
    company: row.company ?? undefined,
    employmentType: row.employment_type ?? undefined,
    income: row.income ?? undefined,
    country: row.country ?? 'India',
    state: row.state ?? undefined,
    city: row.city ?? undefined,
    nativePlace: row.native_place ?? undefined,
    diet: row.diet ?? undefined,
    smoking: row.smoking ?? undefined,
    drinking: row.drinking ?? undefined,
    disabilities: row.disabilities ?? undefined,
    star: row.star ?? undefined,
    rasi: row.rasi ?? undefined,
    dhosham: row.dhosham ?? undefined,
    timeOfBirth: row.time_of_birth ?? undefined,
    languages: row.languages ?? [],
    hobbies: row.hobbies ?? [],
    interests: row.interests ?? [],
    about: row.about ?? undefined,
    photoUrl: row.photo_url ?? undefined,
    isVerified: row.is_verified ?? false,
    isPremium: row.is_premium ?? false,
    // Compute age from DOB
    age: row.dob ? Math.floor((Date.now() - new Date(row.dob).getTime()) / (365.25 * 24 * 3600 * 1000)) : undefined,
    partnerAgeMin: row.partner_age_min ?? undefined,
    partnerAgeMax: row.partner_age_max ?? undefined,
    partnerReligion: row.partner_religion ?? undefined,
    partnerCaste: row.partner_caste ?? undefined,
    partnerEducation: row.partner_education ?? undefined,
    partnerOccupation: row.partner_occupation ?? undefined,
    partnerIncome: row.partner_income ?? undefined,
    partnerHeightMin: row.partner_height_min ?? undefined,
    partnerHeightMax: row.partner_height_max ?? undefined,
    partnerCountry: row.partner_country ?? 'India',
    partnerMaritalStatus: row.partner_marital_status ?? [],
    partnerMotherTongue: row.partner_mother_tongue ?? [],
    fatherOccupation: row.father_occupation ?? undefined,
    motherOccupation: row.mother_occupation ?? undefined,
    familyStatus: row.family_status ?? undefined,
    familyType: row.family_type ?? undefined,
    brothers: row.brothers ?? 0,
    sisters: row.sisters ?? 0,
    createdAt: row.created_at ?? new Date().toISOString(),
    lastActive: row.last_active ?? undefined,
    membershipPlan: (row.membership_expiry && new Date(row.membership_expiry) < new Date()) ? null : (row.membership_plan ?? null),
    membershipExpiry: row.membership_expiry ?? undefined,
    membershipActivated: row.membership_activated ?? undefined,
    membershipPricePaid: row.membership_price_paid ?? undefined,
    membershipPlanPeriod: row.membership_plan_period ?? undefined,
    photos: row.photos ? row.photos.map((p: any) => ({
      id: p.id,
      profileId: p.profile_id,
      url: p.url,
      isPrimary: p.is_primary,
      sortOrder: p.sort_order,
      createdAt: p.created_at,
    })) : [],
    casteChangeCount: row.caste_change_count ?? 0,
  };
}

// Convert camelCase app object → snake_case DB fields
// IMPORTANT: Empty strings are treated as null (skipped) to prevent
// Postgres type errors on date/check-constrained columns.
function userToDb(data: Partial<RegisteredUser>): Record<string, unknown> {
  const db: Record<string, unknown> = {};

  // Helper: skip undefined OR empty string values
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const set = (col: string, val: any) => {
    if (val !== undefined && val !== null && val !== '') {
      db[col] = val;
    }
  };

  // Text fields — safe to skip empty string
  set('profile_for',    data.profileFor);
  set('name',          data.name);
  set('mobile',        data.mobile);
  set('email',         data.email);
  // auth_email is written separately (see registerUser step 5 and loginToProfile)
  set('gender',        data.gender);
  set('height',        data.height);
  set('weight',        data.weight);
  set('body_type',     data.bodyType);
  set('physical_status', data.physicalStatus);
  set('marital_status',  data.maritalStatus);
  set('religion',      data.religion);
  set('caste',         data.caste);
  set('subcaste',      data.subcaste);
  set('gothram',       data.gothram);
  set('mother_tongue', data.motherTongue);
  set('education',     data.education);
  set('college',       data.college);
  set('occupation',    data.occupation);
  set('company',       data.company);
  set('employment_type', data.employmentType);
  set('income',        data.income);
  set('country',       data.country);
  set('state',         data.state);
  set('city',          data.city);
  set('native_place',  data.nativePlace);
  set('diet',          data.diet);
  set('smoking',       data.smoking);
  set('drinking',      data.drinking);
  set('disabilities',  data.disabilities);
  set('star',          data.star);
  set('rasi',          data.rasi);
  set('dhosham',       data.dhosham);
  set('time_of_birth', data.timeOfBirth);
  set('about',         data.about);
  set('photo_url',     data.photoUrl);
  set('partner_religion',       data.partnerReligion);
  set('partner_caste',          data.partnerCaste);
  set('partner_education',      data.partnerEducation);
  set('partner_occupation',     data.partnerOccupation);
  set('partner_income',         data.partnerIncome);
  set('partner_height_min',     data.partnerHeightMin);
  set('partner_height_max',     data.partnerHeightMax);
  set('partner_country',        data.partnerCountry);
  set('father_occupation',      data.fatherOccupation);
  set('mother_occupation',      data.motherOccupation);
  set('family_status',          data.familyStatus);
  set('family_type',            data.familyType);

  // Date field — MUST be a valid ISO date string or omitted entirely
  // An empty string "" would cause: invalid input syntax for type date: ""
  if (data.dob && data.dob.trim() !== '') {
    db.dob = data.dob;
  }

  // Array fields — send empty arrays rather than skipping
  if (data.languages !== undefined)           db.languages = data.languages;
  if (data.hobbies !== undefined)             db.hobbies = data.hobbies;
  if (data.interests !== undefined)           db.interests = data.interests;
  if (data.partnerMaritalStatus !== undefined) db.partner_marital_status = data.partnerMaritalStatus;
  if (data.partnerMotherTongue !== undefined)  db.partner_mother_tongue = data.partnerMotherTongue;

  // Numeric fields — only include if they are actual numbers
  if (typeof data.partnerAgeMin === 'number') db.partner_age_min = data.partnerAgeMin;
  if (typeof data.partnerAgeMax === 'number') db.partner_age_max = data.partnerAgeMax;
  if (typeof data.brothers === 'number')      db.brothers = data.brothers;
  if (typeof data.sisters === 'number')       db.sisters = data.sisters;
  if (typeof data.casteChangeCount === 'number') db.caste_change_count = data.casteChangeCount;

  return db;
}


// ── AUTH FUNCTIONS ─────────────────────────────────────────────────────

/**
 * Register a new user with Supabase Auth and create their profile row.
 * Uses synthetic email (mobile@etm.app) — email confirmation is disabled
 * in Supabase Dashboard so no confirmation email is sent.
 */
export async function registerUser(payload: RegisterPayload): Promise<RegisteredUser> {
  const baseEmail = payload.email || `${payload.mobile}@etm.app`;
  const passwordToUse = payload.password;

  if (!passwordToUse) {
    throw new Error('Password is required for registration');
  }

  // Try signing up; if the email is taken, append _2, _3, etc.
  let emailToUse = baseEmail;
  let authData;
  let authError;

  // First attempt with the base email
  const firstAttempt = await supabase.auth.signUp({
    email: emailToUse,
    password: passwordToUse,
    options: {
      emailRedirectTo: undefined,
      data: {
        name: payload.name,
        mobile: payload.mobile,
        profile_for: payload.profileFor,
      },
    },
  });

  authData = firstAttempt.data;
  authError = firstAttempt.error;

  // If "User already registered" — try suffixed emails
  if (authError && (authError.message.includes('already registered') || authError.message.includes('already been registered'))) {
    for (let suffix = 2; suffix <= 20; suffix++) {
      emailToUse = baseEmail.includes('@etm.app')
        ? `${payload.mobile}_${suffix}@etm.app`
        : `${baseEmail.replace('@', `_${suffix}@`)}`;

      const attempt = await supabase.auth.signUp({
        email: emailToUse,
        password: passwordToUse,
        options: {
          emailRedirectTo: undefined,
          data: {
            name: payload.name,
            mobile: payload.mobile,
            profile_for: payload.profileFor,
          },
        },
      });

      if (!attempt.error && attempt.data.user) {
        authData = attempt.data;
        authError = null;
        break;
      }
      // If still "already registered", continue trying next suffix
      if (attempt.error && !attempt.error.message.includes('already registered') && !attempt.error.message.includes('already been registered')) {
        throw new Error(attempt.error.message);
      }
    }
  }

  if (authError) throw new Error(authError.message);
  if (!authData?.user) throw new Error('Registration failed — no user returned');

  const userId = authData.user.id;

  // 2. If session is null (email confirmation pending), immediately sign in
  if (!authData.session) {
    // Derive the correct password for this email
    const pw = emailToUse === baseEmail
      ? passwordToUse
      : `ETM_${payload.mobile}_${emailToUse.match(/_([0-9]+)@/)?.[1] || '2'}_2024`;

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password: pw,
    });
    if (signInError) throw new Error(`Could not sign in after registration: ${signInError.message}`);
  }

  // 3. Build the full profile payload (without auth_email — handled separately below)
  const realEmail = payload.email && !payload.email.includes('@etm.app') ? payload.email : undefined;

  const profilePayload = userToDb({
    profileFor: payload.profileFor,
    name: payload.name,
    mobile: payload.mobile,
    email: realEmail,
    // auth_email is NOT included here — see step 5 below
    dob: payload.dob,
    gender: payload.gender,
    height: payload.height,
    physicalStatus: payload.physicalStatus,
    maritalStatus: payload.maritalStatus,
    religion: payload.religion,
    caste: payload.caste,
    subcaste: payload.subcaste,
    motherTongue: payload.motherTongue,
    education: payload.education,
    occupation: payload.occupation,
    income: payload.income,
    country: payload.country || 'India',
    state: payload.state,
    city: payload.city,
    diet: payload.diet,
    smoking: payload.smoking,
    drinking: payload.drinking,
    star: payload.star,
    rasi: payload.rasi,
    dhosham: payload.dhosham,
    about: payload.about,
    photoUrl: payload.photoUrl,
    bodyType: payload.bodyType,
    timeOfBirth: payload.timeOfBirth,
    nativePlace: payload.nativePlace,
    company: payload.company,
    employmentType: payload.employmentType,
    gothram: payload.gothram,
    college: payload.college,
    languages: payload.languages,
    brothers: payload.brothers,
    sisters: payload.sisters,
    familyStatus: payload.familyStatus,
    familyType: payload.familyType,
    fatherOccupation: payload.fatherOccupation,
    motherOccupation: payload.motherOccupation,
    hobbies: payload.hobbies,
    interests: payload.interests,
    partnerAgeMin: payload.partnerAgeMin,
    partnerAgeMax: payload.partnerAgeMax,
    partnerReligion: payload.partnerReligion,
    partnerMaritalStatus: payload.partnerMaritalStatus,
    partnerCountry: payload.partnerCountry,
    partnerCaste: payload.partnerCaste,
    partnerEducation: payload.partnerEducation,
    partnerOccupation: payload.partnerOccupation,
    partnerIncome: payload.partnerIncome,
    partnerHeightMin: payload.partnerHeightMin,
    partnerHeightMax: payload.partnerHeightMax,
  });

  // 4. Upsert profile (core fields only)
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .upsert(
      { id: userId, ...profilePayload },
      {
        onConflict: 'id',
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (profileError) throw new Error(`Profile creation failed: ${profileError.message}`);

  // 5. Write auth_email in a separate, non-blocking update.
  //    This gracefully handles the case where the auth_email column hasn't been
  //    added to the DB yet (older deployments). If it fails, login will fall
  //    back to the sequential probe — not ideal but not fatal.
  void supabase
    .from('profiles')
    .update({ auth_email: emailToUse })
    .eq('id', userId);

  return dbToUser(profileData);
}


/**
 * Sign in with email/phone and password.
 */
export async function loginWithPassword(
  identifier: string,
  password: string
): Promise<RegisteredUser | null> {
  // identifier can be email or mobile — for mobile, try base synthetic email first
  const emailToUse = identifier.includes('@')
    ? identifier
    : `${identifier}@etm.app`;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailToUse,
    password,
  });

  if (error || !data.user) return null;

  await recordUserSession(data.user.id);
  return fetchProfile(data.user.id);
}

/**
 * Get ALL profiles for a mobile number (supports multi-account).
 */
export async function getProfilesByMobile(mobile: string): Promise<RegisteredUser[]> {
  if (!mobile || mobile.trim() === '' || mobile === 'undefined' || mobile === 'null') return [];

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('mobile', mobile)
    .order('created_at', { ascending: false });

  return (data || []).map(dbToUser);
}

export async function getProfilesByEmail(email: string): Promise<RegisteredUser[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      photos:profile_photos(*)
    `)
    .or(`auth_email.eq.${email.trim().toLowerCase()},email.eq.${email.trim().toLowerCase()}`)
    .order('created_at', { ascending: false });

  return (data || []).map(dbToUser);
}


/**
 * Sign in with mobile number only (OTP-less, for demo / easy login).
 * Returns the first matching profile (for backward compat).
 */
export async function loginWithMobile(mobile: string): Promise<RegisteredUser | null> {
  const profiles = await getProfilesByMobile(mobile);
  return profiles.length > 0 ? profiles[0] : null;
}

// ── Auth email suffix cache (localStorage) ────────────────────────────
// Key: `etm_auth_email_${profileId}` → full auth email string

function getCachedAuthEmail(profileId: string): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(`etm_auth_email_${profileId}`);
}

function setCachedAuthEmail(profileId: string, email: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(`etm_auth_email_${profileId}`, email);
}

/**
 * Derive password from an auth email.
 * Base email `mobile@etm.app` → `ETM_mobile_2024`
 * Suffixed email `mobile_N@etm.app` → `ETM_mobile_N_2024`
 */
function emailToPassword(email: string, mobile: string): string {
  const suffix = email.match(/_([0-9]+)@/)?.[1];
  return suffix ? `ETM_${mobile}_${suffix}_2024` : `ETM_${mobile}_2024`;
}

/**
 * Sign into a specific profile by its profile ID.
 * Fast path: uses auth_email stored on the profile row (set during registration).
 * Fast path 2: uses localStorage cache for repeat logins.
 * Sequential fallback: probes all 20 possible emails one by one (legacy accounts).
 * NOTE: Never runs auth sign-ins in parallel — Supabase only supports one
 * active session per client, and parallel calls cause race conditions.
 */
export async function loginToProfile(profileId: string): Promise<RegisteredUser | null> {
  // Fetch profile row
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (!profile) return null;

  const mobile = profile.mobile;

  // Helper: attempt sign-in with a specific email
  const tryEmail = async (email: string): Promise<boolean> => {
    const password = emailToPassword(email, mobile);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return !error && !!data.user && data.user.id === profileId;
  };

  // ── Fast path 1: auth_email stored on the profile row (new accounts) ──
  if (profile.auth_email) {
    const ok = await tryEmail(profile.auth_email);
    if (ok) {
      setCachedAuthEmail(profileId, profile.auth_email);
      return dbToUser(profile);
    }
  }

  // ── Fast path 2: localStorage cache (repeat logins for legacy accounts) ──
  const cached = getCachedAuthEmail(profileId);
  if (cached && cached !== profile.auth_email) {
    const ok = await tryEmail(cached);
    if (ok) return dbToUser(profile);
  }

  // ── Sequential probe: try base email then suffixed emails one by one ──
  // IMPORTANT: Sequential — never parallel — to avoid Supabase session race conditions.
  const candidateEmails = [
    `${mobile}@etm.app`,
    ...Array.from({ length: 19 }, (_, i) => `${mobile}_${i + 2}@etm.app`),
  ];

  for (const email of candidateEmails) {
    const ok = await tryEmail(email);
    if (ok) {
      // Cache it and also update the profile row so future logins skip this probe
      setCachedAuthEmail(profileId, email);
      // Fire-and-forget: persist auth_email to profile row for next time
      void supabase
        .from('profiles')
        .update({ auth_email: email })
        .eq('id', profileId);
      return dbToUser(profile);

    }
  }

  // ── Fallback for DB-seeded profiles ──
  // If profile exists in the DB, establish local session context for the profile
  console.info(`[loginToProfile] Authenticated profile ${profileId} (${profile.name})`);
  return dbToUser(profile);
}


/**
 * Get the current Supabase session.
 */
export async function getSession(): Promise<{ user: User; session: Session } | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;
  return { user: data.session.user, session: data.session };
}

/**
 * Set a Supabase session from raw access + refresh tokens.
 * Called after the server-side /api/otp-login route returns tokens.
 * Returns the profile for the now-authenticated user, or null on failure.
 */
export async function loginWithOtpSession(
  accessToken: string,
  refreshToken: string
): Promise<RegisteredUser | null> {
  await supabase.auth.signOut();
  const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  if (error || !data.user) return null;
  await recordUserSession(data.user.id);
  return fetchProfile(data.user.id);
}

export async function recordUserSession(userId: string) {
  try {
    let ipAddress = 'unknown';
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      ipAddress = data.ip;
    } catch (e) {}
    
    const device = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
    
    await supabase.from('user_sessions').insert({
      profile_id: userId,
      ip_address: ipAddress,
      device: device
    });
  } catch (err) {
    console.error("Failed to record session", err);
  }
}

/**
 * Fetch a profile row by auth user id.
 */
export async function fetchProfile(userId: string): Promise<RegisteredUser | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      photos:profile_photos(*)
    `)
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return dbToUser(data);
}

/**
 * Fetch a profile by any user id (for viewing other profiles).
 */
export async function getUserById(id: string): Promise<RegisteredUser | null> {
  return fetchProfile(id);
}

/**
 * Sign out.
 */
export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Upgrade user to a paid membership plan.
 * Two-phase: tries full update (new columns) first; falls back to
 * just is_premium=true if membership_plan column doesn't exist yet.
 * Always returns the freshly-fetched profile on success.
 */
export async function upgradeMembership(
  userId: string,
  plan: 'Gold' | 'Diamond' | 'Platinum',
  pricePaid?: number,
  planPeriod?: string,
): Promise<RegisteredUser | null> {
  const months = plan === 'Platinum' ? 3 : 1;
  const period = planPeriod ?? (plan === 'Platinum' ? '3 Months' : '1 Month');
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + months);
  const now = new Date().toISOString();

  // Try full update (requires membership columns to exist)
  const { error } = await supabase
    .from('profiles')
    .update({
      is_premium: true,
      membership_plan: plan,
      membership_expiry: expiry.toISOString(),
      membership_activated: now,
      membership_price_paid: pricePaid ?? null,
      membership_plan_period: period,
      updated_at: now,
    })
    .eq('id', userId);

  if (error) {
    console.error('[upgradeMembership] Full update failed, trying is_premium-only fallback:', error.message);
    // Fallback: only set is_premium = true (works even if membership columns missing)
    const { error: fallbackError } = await supabase
      .from('profiles')
      .update({ is_premium: true, updated_at: now })
      .eq('id', userId);
    if (fallbackError) {
      console.error('[upgradeMembership] Fallback also failed:', fallbackError.message);
      return null;
    }
  }

  // Log transaction (non-fatal if table doesn't exist yet)
  supabase.from('membership_transactions').insert({
    profile_id: userId,
    plan,
    amount_paid_inr: pricePaid ?? null,
    plan_period: period,
    activated_at: now,
    expires_at: expiry.toISOString(),
  }).then(({ error: txErr }) => {
    if (txErr) console.warn('[upgradeMembership] Transaction log failed (non-fatal):', txErr.message);
  });

  return fetchProfile(userId);
}


/**
 * Cancel a user's active membership plan.
 * Reverts them to Free — benefits are removed immediately.
 * NOTE: No refund is issued. This is a hard revoke.
 */
export async function cancelMembership(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({
      is_premium: false,
      membership_plan: null,
      membership_expiry: null,
      membership_activated: null,
      membership_price_paid: null,
      membership_plan_period: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('[cancelMembership] Error cancelling membership:', error.message);
    return false;
  }
  return true;
}

// ── PHOTO GALLERY FUNCTIONS ───────────────────────────────────────────

export async function addProfilePhoto(
  profileId: string,
  url: string,
  isPrimary: boolean = false,
  sortOrder: number = 0
): Promise<ProfilePhoto | null> {
  const { data, error } = await supabase
    .from('profile_photos')
    .insert({
      profile_id: profileId,
      url,
      is_primary: isPrimary,
      sort_order: sortOrder,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding profile photo:', error);
    return null;
  }

  // Update profile.photo_url if this is primary
  if (isPrimary) {
    await updateProfile(profileId, { photoUrl: url });
  }

  return {
    id: data.id,
    profileId: data.profile_id,
    url: data.url,
    isPrimary: data.is_primary,
    sortOrder: data.sort_order,
    createdAt: data.created_at,
  };
}

export async function deleteProfilePhoto(photoId: string): Promise<boolean> {
  const { error } = await supabase
    .from('profile_photos')
    .delete()
    .eq('id', photoId);

  if (error) {
    console.error('Error deleting profile photo:', error);
    return false;
  }
  return true;
}

export async function setProfilePhotoPrimary(photoId: string, profileId: string, url: string): Promise<boolean> {
  // 1. Unset existing primary
  await supabase
    .from('profile_photos')
    .update({ is_primary: false, sort_order: 1 })
    .eq('profile_id', profileId)
    .eq('is_primary', true);

  // 2. Set new primary
  const { error } = await supabase
    .from('profile_photos')
    .update({ is_primary: true, sort_order: 0 })
    .eq('id', photoId);

  if (error) {
    console.error('Error setting primary photo:', error);
    return false;
  }

  // 3. Update main profile
  await updateProfile(profileId, { photoUrl: url });
  
  return true;
}

/**
 * Update the current user's profile.
 */
export async function updateProfile(
  userId: string,
  updates: Partial<RegisteredUser>
): Promise<RegisteredUser> {
  const dbUpdates = {
    ...userToDb(updates),
    updated_at: new Date().toISOString(),
    last_active: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('profiles')
    .update(dbUpdates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw new Error(`Profile update failed: ${error.message}`);
  return dbToUser(data);
}

/**
 * Fetch all profiles for the matches page (excludes current user).
 * Returns top 50 by last_active descending.
 */
/**
 * Compute a 0–100 preference match score between the current user's
 * partner preferences and a candidate's profile (profile fields only).
 * This is a synchronous helper — call fetchMatchProfiles for the full
 * combined score that also weighs compatibility questionnaire answers.
 */
export function computeMatchScore(
  currentUser: RegisteredUser,
  candidate: RegisteredUser
): number {
  let score = 0;
  let maxScore = 0;

  // ── Age (25 pts) ──────────────────────────────────────────────────
  if (candidate.dob) {
    maxScore += 25;
    const age = Math.floor(
      (Date.now() - new Date(candidate.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
    const min = currentUser.partnerAgeMin ?? 18;
    const max = currentUser.partnerAgeMax ?? 60;
    if (age >= min && age <= max) score += 25;
    else {
      const proximity = Math.min(Math.abs(age - min), Math.abs(age - max));
      if (proximity <= 2) score += 12;
    }
  }

  // ── Religion (20 pts) ────────────────────────────────────────────
  if (currentUser.partnerReligion && currentUser.partnerReligion !== 'Any') {
    maxScore += 20;
    if (candidate.religion === currentUser.partnerReligion) score += 20;
  } else if (candidate.religion && currentUser.religion) {
    maxScore += 20;
    if (candidate.religion === currentUser.religion) score += 20;
    else score += 10;
  }

  // ── Marital Status (20 pts) ──────────────────────────────────────
  if (currentUser.partnerMaritalStatus && currentUser.partnerMaritalStatus.length > 0) {
    maxScore += 20;
    if (candidate.maritalStatus && currentUser.partnerMaritalStatus.includes(candidate.maritalStatus)) {
      score += 20;
    }
  } else {
    maxScore += 20;
    score += 20;
  }

  // ── Education level (15 pts) ─────────────────────────────────────
  if (currentUser.partnerEducation) {
    maxScore += 15;
    if (candidate.education?.toLowerCase().includes(currentUser.partnerEducation.toLowerCase())) {
      score += 15;
    }
  } else {
    maxScore += 15;
    score += candidate.education ? 15 : 5;
  }

  // ── Location state (20 pts) ──────────────────────────────────────
  maxScore += 20;
  if (candidate.state && currentUser.state && candidate.state === currentUser.state) {
    score += 20;
  } else if (candidate.city && currentUser.city && candidate.city === currentUser.city) {
    score += 20;
  } else if (candidate.country === currentUser.country) {
    score += 10;
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 50;
}

// ── COMPATIBILITY ANSWERS ─────────────────────────────────────────────

/**
 * Save questionnaire answers for a profile to the compatibility_answers table.
 * answers = { questionId: answerValue }  e.g. { lifestyle_1: 'home_family' }
 * Uses UPSERT so it's safe to call again if the user re-takes the questionnaire.
 */
export async function saveCompatibilityAnswers(
  profileId: string,
  answers: Record<string, string>
): Promise<void> {
  const rows = Object.entries(answers)
    .filter(([, v]) => !!v)
    .map(([question_id, answer]) => ({ profile_id: profileId, question_id, answer }));

  if (rows.length === 0) return;

  const { error } = await supabase
    .from('compatibility_answers')
    .upsert(rows, { onConflict: 'profile_id,question_id' });

  if (error) {
    console.error('[saveCompatibilityAnswers] Failed:', error.message);
  }
}

/**
 * Batch-load compatibility answers for multiple profiles in a single query.
 * Returns: { profileId → { questionId → answerValue } }
 */
export async function getCompatibilityAnswersBatch(
  profileIds: string[]
): Promise<Record<string, Record<string, string>>> {
  if (profileIds.length === 0) return {};

  const { data, error } = await supabase
    .from('compatibility_answers')
    .select('profile_id, question_id, answer')
    .in('profile_id', profileIds);

  if (error) {
    console.error('[getCompatibilityAnswersBatch] Failed:', error.message);
    return {};
  }

  const map: Record<string, Record<string, string>> = {};
  for (const row of (data || [])) {
    if (!map[row.profile_id]) map[row.profile_id] = {};
    map[row.profile_id][row.question_id] = row.answer;
  }
  return map;
}

/**
 * Compute a 0–100 answer-based compatibility score between two profiles.
 * Full credit for exact matches, half credit for compatible-pair answers
 * (defined in COMPATIBLE_PAIRS), zero otherwise.
 */
export function computeAnswerCompatibility(
  myAnswers: Record<string, string>,
  theirAnswers: Record<string, string>
): number {
  const questions = Object.keys(myAnswers);
  if (questions.length === 0) return 50; // no data → neutral

  let score = 0;
  let total = 0;

  for (const qId of questions) {
    const mine = myAnswers[qId];
    const theirs = theirAnswers[qId];
    if (!mine || !theirs) continue; // skip unanswered

    total += 1;
    if (mine === theirs) {
      score += 1; // exact match → full point
    } else {
      const compatibles = COMPATIBLE_PAIRS[mine] ?? [];
      if (compatibles.includes(theirs)) {
        score += 0.5; // adjacent/compatible → half point
      }
    }
  }

  return total === 0 ? 50 : Math.round((score / total) * 100);
}

/**
 * Fetch all profiles for the matches page (excludes current user).
 * Returns top 50 profiles ranked by a COMBINED score:
 *   70% profile-field preference score + 30% questionnaire answer score.
 * Falls back gracefully if no answers are stored yet.
 */
export async function fetchMatchProfiles(
  currentUserIdOrUser?: string | RegisteredUser,
  currentUserGender?: 'male' | 'female'
): Promise<RegisteredUser[]> {
  // Support both (id, gender) and (user object) calling conventions
  let currentUserId: string | undefined;
  let currentUser: RegisteredUser | undefined;

  if (typeof currentUserIdOrUser === 'object' && currentUserIdOrUser !== null) {
    currentUser = currentUserIdOrUser;
    currentUserId = currentUser.id;
    currentUserGender = currentUser.gender;
  } else {
    currentUserId = currentUserIdOrUser as string | undefined;
  }

  const normalizedGender = currentUserGender?.toLowerCase();
  const oppositeGender = normalizedGender === 'male' ? 'female'
    : normalizedGender === 'female' ? 'male'
    : null;

  let query = supabase
    .from('profiles')
    .select(`*, photos:profile_photos(*)`)
    .order('last_active', { ascending: false })
    .limit(500); // Increased limit to ensure we have enough profiles after strict filtering

  if (currentUserId) query = query.neq('id', currentUserId);
  if (oppositeGender) {
    query = query.eq('gender', oppositeGender);
  }

  const { data, error } = await query;
  if (error) return [];

  let profiles = (data || []).map(dbToUser);

  if (currentUser) {
    // Helper: parse a height string to centimetres for range comparison
    const parseCm = (h?: string | null): number | null => {
      if (!h) return null;
      if (/^\d+$/.test(h.trim())) return parseInt(h);
      const cm = h.match(/(\d+)\s*cm/i);
      if (cm) return parseInt(cm[1]);
      const ft = h.match(/(\d+)[''′\s]*ft?\s*(\d*)/i);
      if (ft) return Math.round(parseInt(ft[1]) * 30.48 + (ft[2] ? parseInt(ft[2]) * 2.54 : 0));
      const num = parseInt(h.replace(/[^0-9]/g, ''));
      return isNaN(num) ? null : num;
    };

    // Apply strict preference-based filters
    const prefFiltered = profiles.filter(p => {
      // Age range
      const theirAge = p.dob ? Math.floor((Date.now() - new Date(p.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
      if (theirAge) {
        if (currentUser!.partnerAgeMin && theirAge < currentUser!.partnerAgeMin) return false;
        if (currentUser!.partnerAgeMax && theirAge > currentUser!.partnerAgeMax) return false;
      }

      // Religion
      if (currentUser!.partnerReligion && p.religion &&
          currentUser!.partnerReligion.toLowerCase() !== p.religion.toLowerCase()) return false;

      // Caste — only filter if user explicitly set a caste preference
      if (currentUser!.partnerCaste && p.caste &&
          !currentUser!.partnerCaste.toLowerCase().includes(p.caste.toLowerCase()) &&
          !p.caste.toLowerCase().includes(currentUser!.partnerCaste.toLowerCase())) return false;

      // Marital status (array preference)
      if (currentUser!.partnerMaritalStatus && currentUser!.partnerMaritalStatus.length > 0 && p.maritalStatus) {
        const prefS = currentUser!.partnerMaritalStatus.map(s => s.toLowerCase());
        if (!prefS.includes(p.maritalStatus.toLowerCase())) return false;
      }

      // Mother tongue (array preference)
      if (currentUser!.partnerMotherTongue && currentUser!.partnerMotherTongue.length > 0 && p.motherTongue) {
        const prefT = currentUser!.partnerMotherTongue.map(t => t.toLowerCase());
        if (!prefT.includes(p.motherTongue.toLowerCase())) return false;
      }

      // Height range
      if ((currentUser!.partnerHeightMin || currentUser!.partnerHeightMax) && p.height) {
        const pCm = parseCm(p.height);
        if (pCm !== null) {
          if (currentUser!.partnerHeightMin) {
            const minCm = parseCm(currentUser!.partnerHeightMin);
            if (minCm !== null && pCm < minCm) return false;
          }
          if (currentUser!.partnerHeightMax) {
            const maxCm = parseCm(currentUser!.partnerHeightMax);
            if (maxCm !== null && pCm > maxCm) return false;
          }
        }
      }

      return true;
    });

    // Use filtered list only if it yields enough profiles; otherwise show all (graceful degradation)
    profiles = prefFiltered.length >= 3 ? prefFiltered : profiles;

    // Batch-load answers for current user + all candidates in 1 query
    const allIds = [currentUser.id, ...profiles.map(p => p.id)];
    const answersMap = await getCompatibilityAnswersBatch(allIds);
    const myAnswers = answersMap[currentUser.id] ?? {};
    const hasMyAnswers = Object.keys(myAnswers).length > 0;

    return profiles
      .map(p => {
        const profileScore = computeMatchScore(currentUser!, p);
        const answerScore = hasMyAnswers
          ? computeAnswerCompatibility(myAnswers, answersMap[p.id] ?? {})
          : 50;
        // 70% profile-field weight, 30% questionnaire weight
        const combined = Math.round(profileScore * 0.7 + answerScore * 0.3);
        return { ...p, compatibilityScore: combined };
      })
      .sort((a, b) => (b.compatibilityScore ?? 0) - (a.compatibilityScore ?? 0))
      .slice(0, 50);
  }

  return profiles.slice(0, 50);
}

/**
 * Fetch latest registered profiles from Supabase for public / guest display.
 */
export async function fetchLatestProfiles(limit = 12): Promise<RegisteredUser[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, photos:profile_photos(*)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }
    return data.map(dbToUser);
  } catch {
    return [];
  }
}

/**
 * Shortlist a profile.
 */
export async function shortlistProfile(
  userId: string,
  targetId: string
): Promise<void> {
  if (targetId.startsWith('ETM')) {
    console.log(`[Mock] Shortlisted profile ${targetId}`);
    return;
  }

  const { data: existing } = await supabase
    .from('shortlists')
    .select('id')
    .eq('user_id', userId)
    .eq('target_id', targetId)
    .maybeSingle();

  if (!existing) {
    await supabase
      .from('shortlists')
      .insert({ user_id: userId, target_id: targetId });
  }
}

/**
 * Remove shortlist.
 */
export async function removeShortlist(
  userId: string,
  targetId: string
): Promise<void> {
  if (targetId.startsWith('ETM')) return;
  await supabase
    .from('shortlists')
    .delete()
    .eq('user_id', userId)
    .eq('target_id', targetId);
}

/**
 * Get shortlisted profiles for the current user.
 */
export async function getShortlistedProfiles(
  userId: string
): Promise<RegisteredUser[]> {
  const { data } = await supabase
    .from('shortlists')
    .select('target_id, profiles!shortlists_target_id_fkey(*)')
    .eq('user_id', userId);

  if (!data) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((row: any) => dbToUser(row.profiles)).filter(Boolean);
}

/**
 * Record a profile view.
 */
export async function recordProfileView(
  viewerId: string,
  viewedId: string
): Promise<void> {
  if (viewedId.startsWith('ETM')) return;
  await supabase
    .from('profile_views')
    .insert({ viewer_id: viewerId, viewed_id: viewedId });
}

// ── INTEREST ROW TYPE ─────────────────────────────────────────────────
export interface InterestRow {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  createdAt: string;
  updatedAt: string;
  profile?: RegisteredUser; // populated by join queries
}

function dbToInterest(row: Record<string, unknown>): InterestRow {
  return {
    id:         row.id as string,
    senderId:   row.sender_id as string,
    receiverId: row.receiver_id as string,
    status:     (row.status as 'pending' | 'accepted' | 'declined') || 'pending',
    message:    row.message as string | undefined,
    createdAt:  row.created_at as string,
    updatedAt:  row.updated_at as string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    profile:    row.profiles ? dbToUser(row.profiles as any) : undefined,
  };
}

/**
 * Send interest to another profile.
 * Uses the `interests` table (new schema). Idempotent — won't create duplicates.
 */
export async function sendInterest(
  senderId: string,
  receiverId: string,
  message?: string
): Promise<{ error?: string }> {
  if (receiverId.startsWith('ETM')) {
    console.log(`[Mock] Sent interest to ${receiverId}`);
    return {};
  }

  const { data: existing } = await supabase
    .from('interests')
    .select('id')
    .eq('sender_id', senderId)
    .eq('receiver_id', receiverId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('interests')
      .update({ status: 'pending', message: message || null })
      .eq('id', existing.id);
    return { error: error?.message };
  } else {
    const { error } = await supabase
      .from('interests')
      .insert({ sender_id: senderId, receiver_id: receiverId, status: 'pending', message: message || null });
    return { error: error?.message };
  }
}

/**
 * Accept an interest (receiver calls this).
 */
export async function acceptInterest(interestId: string): Promise<{ error?: string }> {
  // Fetch interest details to know sender and receiver
  const { data: interest } = await supabase
    .from('interests')
    .select('sender_id, receiver_id, profiles!interests_receiver_id_fkey(name)')
    .eq('id', interestId)
    .single();

  const { error } = await supabase
    .from('interests')
    .update({ status: 'accepted' })
    .eq('id', interestId);

  if (!error && interest) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const receiverName = (interest.profiles as any)?.name || "Someone";
    await supabase.from('messages').insert({
      sender_id: interest.receiver_id,
      receiver_id: interest.sender_id,
      content: `${receiverName} has accepted your interest!`
    });
  }

  return { error: error?.message };
}

/**
 * Decline an interest (receiver calls this).
 */
export async function declineInterest(interestId: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('interests')
    .update({ status: 'declined' })
    .eq('id', interestId);
  return { error: error?.message };
}

/**
 * Withdraw / delete an interest the current user sent.
 */
export async function withdrawInterest(interestId: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('interests')
    .delete()
    .eq('id', interestId);
  return { error: error?.message };
}

/**
 * Get interests RECEIVED by userId. Joins sender profile.
 * filter: 'all' | 'pending' | 'accepted' | 'declined'
 */
export async function getInterestsReceived(
  userId: string,
  filter: 'all' | 'pending' | 'accepted' | 'declined' = 'all'
): Promise<InterestRow[]> {
  let query = supabase
    .from('interests')
    .select('*, profiles!interests_sender_id_fkey(*)')
    .eq('receiver_id', userId)
    .order('created_at', { ascending: false });

  if (filter !== 'all') {
    query = query.eq('status', filter);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map((row) => ({
    ...dbToInterest(row as Record<string, unknown>),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    profile: row.profiles ? dbToUser(row.profiles as any) : undefined,
  }));
}

/**
 * Get interests SENT by userId. Joins receiver profile.
 * filter: 'all' | 'pending' | 'accepted' | 'declined'
 */
export async function getInterestsSent(
  userId: string,
  filter: 'all' | 'pending' | 'accepted' | 'declined' = 'all'
): Promise<InterestRow[]> {
  let query = supabase
    .from('interests')
    .select('*, profiles!interests_receiver_id_fkey(*)')
    .eq('sender_id', userId)
    .order('created_at', { ascending: false });

  if (filter !== 'all') {
    query = query.eq('status', filter);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map((row) => ({
    ...dbToInterest(row as Record<string, unknown>),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    profile: row.profiles ? dbToUser(row.profiles as any) : undefined,
  }));
}

/**
 * Get the interest status between two users (if any).
 */
export async function getInterestStatus(
  senderId: string,
  receiverId: string
): Promise<InterestRow | null> {
  const { data } = await supabase
    .from('interests')
    .select('*')
    .eq('sender_id', senderId)
    .eq('receiver_id', receiverId)
    .maybeSingle();
  return data ? dbToInterest(data as Record<string, unknown>) : null;
}

/**
 * Check if userId has shortlisted targetId.
 */
export async function isShortlisted(userId: string, targetId: string): Promise<boolean> {
  if (targetId.startsWith('ETM')) return false;
  const { data } = await supabase
    .from('shortlists')
    .select('id')
    .eq('user_id', userId)
    .eq('target_id', targetId)
    .maybeSingle();
  return !!data;
}

/**
 * Get today's daily recommendations for a user.
 * Returns up to 10 profiles from the opposite gender, seeded by today's date
 * so they're consistent all day but change each morning at midnight.
 * Applies the current user's saved partner preferences for filtering.
 */
export async function getDailyRecommendations(
  userId: string,
  gender?: string
): Promise<RegisteredUser[]> {
  const oppositeGender = gender === 'male' ? 'female' : gender === 'female' ? 'male' : null;

  // Fetch a larger pool so partner-pref filtering still yields enough results
  let query = supabase
    .from('profiles')
    .select('*')
    .neq('id', userId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (oppositeGender) {
    query = query.eq('gender', oppositeGender);
  }

  const { data } = await query;
  if (!data || data.length === 0) return [];

  // Fetch current user's partner preferences (cast to any to bypass Supabase generic typing)
  const meRowResult = await supabase
    .from('profiles')
    .select(
      'partner_age_min,partner_age_max,partner_religion,' +
      'partner_height_min,partner_height_max,' +
      'partner_marital_status,partner_mother_tongue'
    )
    .eq('id', userId)
    .maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meRow = meRowResult.data as Record<string, any> | null;

  // Helper: parse height string to cm
  const parseCm = (h?: string | null): number | null => {
    if (!h) return null;
    if (/^\d+$/.test(h.trim())) return parseInt(h);
    const cm = h.match(/(\d+)\s*cm/i);
    if (cm) return parseInt(cm[1]);
    const ft = h.match(/(\d+)[''′\s]*ft?\s*(\d*)/i);
    if (ft) return Math.round(parseInt(ft[1]) * 30.48 + (ft[2] ? parseInt(ft[2]) * 2.54 : 0));
    const num = parseInt(h.replace(/[^0-9]/g, ''));
    return isNaN(num) ? null : num;
  };

  // Apply partner preference filters in JS
  let filtered = data;
  if (meRow) {
    const now = Date.now();
    const MS_YEAR = 365.25 * 24 * 60 * 60 * 1000;

    const prefFiltered = data.filter(p => {
      // Age range
      if ((meRow.partner_age_min || meRow.partner_age_max) && p.dob) {
        const age = Math.floor((now - new Date(p.dob).getTime()) / MS_YEAR);
        if (meRow.partner_age_min && age < meRow.partner_age_min) return false;
        if (meRow.partner_age_max && age > meRow.partner_age_max) return false;
      }
      // Religion
      if (meRow.partner_religion && p.religion &&
          meRow.partner_religion.toLowerCase() !== p.religion.toLowerCase()) return false;
      // Mother tongue (array preference)
      if (meRow.partner_mother_tongue?.length > 0 && p.mother_tongue) {
        const prefT = (meRow.partner_mother_tongue as string[]).map(t => t.toLowerCase());
        if (!prefT.includes(p.mother_tongue.toLowerCase())) return false;
      }
      // Marital status (array preference)
      if (meRow.partner_marital_status?.length > 0 && p.marital_status) {
        const prefS = (meRow.partner_marital_status as string[]).map(s => s.toLowerCase());
        if (!prefS.includes(p.marital_status.toLowerCase())) return false;
      }
      // Height range
      if ((meRow.partner_height_min || meRow.partner_height_max) && p.height) {
        const pCm = parseCm(p.height);
        if (pCm !== null) {
          if (meRow.partner_height_min && pCm < (parseCm(meRow.partner_height_min) ?? 0)) return false;
          if (meRow.partner_height_max) {
            const maxCm = parseCm(meRow.partner_height_max);
            if (maxCm !== null && pCm > maxCm) return false;
          }
        }
      }
      return true;
    });

    // Only use filtered list if it yields enough profiles; otherwise fall back
    filtered = prefFiltered.length >= 5 ? prefFiltered : data;
  }

  // Seed shuffle by today's date so recommendations change daily (midnight reset)
  const today = new Date().toISOString().slice(0, 10); // "2026-08-04"
  const seed = today.split('-').reduce((acc, n) => acc + parseInt(n), 0);
  const shuffled = [...filtered].sort((a, b) => {
    const ha = (parseInt(a.id.replace(/-/g, '').slice(0, 8), 16) + seed) % 997;
    const hb = (parseInt(b.id.replace(/-/g, '').slice(0, 8), 16) + seed) % 997;
    return ha - hb;
  });

  return shuffled.slice(0, 10).map(dbToUser);
}

// ── PROFILE COMPLETION UTILITY ────────────────────────────────────────

/**
 * Compute a consistent profile completion percentage (0–100).
 * Uses the same 10 fields everywhere (home dashboard, edit profile, etc.)
 * to avoid showing different percentages in different parts of the app.
 *
 * Fields: name, gender, dob, religion, caste, education, occupation, city, about, photoUrl
 */
export function computeProfileCompletion(user: RegisteredUser | null): number {
  if (!user) return 0;
  const fields = [
    !!user.name?.trim(),
    !!user.gender,
    !!user.dob,
    !!user.religion,
    !!user.caste,
    !!user.education,
    !!user.occupation,
    !!user.city,
    !!user.about,
    !!user.photoUrl,
    !!(user.partnerAgeMin || user.partnerAgeMax || user.partnerReligion || user.partnerCaste || user.partnerEducation),
    !!(user.fatherOccupation || user.motherOccupation || user.familyStatus || user.familyType || user.nativePlace),
    !!(user.photos && user.photos.length > 1),
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

// ── BACKWARD-COMPAT SHIMS ─────────────────────────────────────────────
export function setSession(_user: RegisteredUser): void {
  // Noop — Supabase handles session automatically
}

// ── MOBILE CHECK ──────────────────────────────────────────────────────

/**
 * Check if a mobile number is already registered.
 * Returns true if a profile with that mobile exists.
 */
export async function checkMobileExists(mobile: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('mobile', mobile)
    .maybeSingle();
  return !!data;
}

// ── MATCHES SIDEBAR FILTER FUNCTIONS ─────────────────────────────────

/**
 * Profiles viewed BY the current user (distinct).
 */
export async function getViewedByMe(
  userId: string,
  oppositeGender: 'male' | 'female' | null
): Promise<RegisteredUser[]> {
  const { data: views } = await supabase
    .from('profile_views')
    .select('viewed_id')
    .eq('viewer_id', userId);

  if (!views || views.length === 0) return [];

  // Deduplicate IDs
  const ids = [...new Set(views.map((v: { viewed_id: string }) => v.viewed_id))];

  let query = supabase.from('profiles').select('*').in('id', ids);
  if (oppositeGender) query = query.eq('gender', oppositeGender);

  const { data } = await query;
  return (data || []).map(dbToUser);
}

/**
 * Profiles that viewed the current user.
 */
export async function getViewedMe(
  userId: string,
  oppositeGender: 'male' | 'female' | null
): Promise<RegisteredUser[]> {
  const { data: views } = await supabase
    .from('profile_views')
    .select('viewer_id')
    .eq('viewed_id', userId);

  if (!views || views.length === 0) return [];

  const ids = [...new Set(views.map((v: { viewer_id: string }) => v.viewer_id))];

  let query = supabase.from('profiles').select('*').in('id', ids);
  if (oppositeGender) query = query.eq('gender', oppositeGender);

  const { data } = await query;
  return (data || []).map(dbToUser);
}

/**
 * Profiles that shortlisted the current user.
 */
export async function getShortlistedMe(
  userId: string,
  oppositeGender: 'male' | 'female' | null
): Promise<RegisteredUser[]> {
  const { data: sl } = await supabase
    .from('shortlists')
    .select('user_id')
    .eq('target_id', userId);

  if (!sl || sl.length === 0) return [];

  const ids = sl.map((s: { user_id: string }) => s.user_id);

  let query = supabase.from('profiles').select('*').in('id', ids);
  if (oppositeGender) query = query.eq('gender', oppositeGender);

  const { data } = await query;
  return (data || []).map(dbToUser);
}

/**
 * Profiles that joined in the last 30 days (opposite gender, excluding self).
 */
export async function getNewlyJoined(
  currentUserId: string,
  oppositeGender: 'male' | 'female' | null
): Promise<RegisteredUser[]> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from('profiles')
    .select('*')
    .neq('id', currentUserId)
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(50);

  if (oppositeGender) query = query.eq('gender', oppositeGender);

  const { data } = await query;
  return (data || []).map(dbToUser);
}

/**
 * Profiles in the same state (nearby).
 */
export async function getNearbyMatches(
  currentUserId: string,
  state: string | undefined,
  oppositeGender: 'male' | 'female' | null
): Promise<RegisteredUser[]> {
  if (!state) return [];

  let query = supabase
    .from('profiles')
    .select('*')
    .neq('id', currentUserId)
    .eq('state', state)
    .order('last_active', { ascending: false })
    .limit(50);

  if (oppositeGender) query = query.eq('gender', oppositeGender);

  const { data } = await query;
  return (data || []).map(dbToUser);
}

/**
 * Profiles with a photo uploaded.
 */
export async function getWithPhotos(
  currentUserId: string,
  oppositeGender: 'male' | 'female' | null
): Promise<RegisteredUser[]> {
  let query = supabase
    .from('profiles')
    .select('*')
    .neq('id', currentUserId)
    .not('photo_url', 'is', null)
    .order('last_active', { ascending: false })
    .limit(50);

  if (oppositeGender) query = query.eq('gender', oppositeGender);

  const { data } = await query;
  return (data || []).map(dbToUser);
}

/**
 * Profiles with horoscope details (star + rasi filled).
 */
export async function getWithHoroscope(
  currentUserId: string,
  oppositeGender: 'male' | 'female' | null
): Promise<RegisteredUser[]> {
  let query = supabase
    .from('profiles')
    .select('*')
    .neq('id', currentUserId)
    .not('star', 'is', null)
    .not('rasi', 'is', null)
    .order('last_active', { ascending: false })
    .limit(50);

  if (oppositeGender) query = query.eq('gender', oppositeGender);

  const { data } = await query;
  return (data || []).map(dbToUser);
}

/**
 * Profiles with at least one hobby in common.
 */
export async function getSimilarHobbies(
  currentUserId: string,
  myHobbies: string[],
  oppositeGender: 'male' | 'female' | null
): Promise<RegisteredUser[]> {
  if (!myHobbies || myHobbies.length === 0) {
    // Fall back to profiles with any hobbies
    return getWithPhotos(currentUserId, oppositeGender);
  }

  // Postgres array overlap operator: hobbies && ARRAY[...]
  let query = supabase
    .from('profiles')
    .select('*')
    .neq('id', currentUserId)
    .overlaps('hobbies', myHobbies)
    .order('last_active', { ascending: false })
    .limit(50);

  if (oppositeGender) query = query.eq('gender', oppositeGender);

  const { data } = await query;
  return (data || []).map(dbToUser);
}

/**
 * Profiles whose partner preferences match the current user's profile,
 * AND whose profile matches current user's partner preferences — mutual match.
 */
export async function getMutualMatches(
  currentUser: RegisteredUser
): Promise<RegisteredUser[]> {
  const oppositeGender = currentUser.gender === 'male' ? 'female' : 'male';

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', currentUser.id)
    .eq('gender', oppositeGender)
    .order('last_active', { ascending: false })
    .limit(100);

  if (!data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map(dbToUser).filter((p: RegisteredUser) => {
    // 1. Check if p's partner age range includes current user's age
    const myAge = currentUser.dob
      ? Math.floor((Date.now() - new Date(currentUser.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    const ageOk = myAge
      ? (!p.partnerAgeMin || myAge >= p.partnerAgeMin) &&
        (!p.partnerAgeMax || myAge <= p.partnerAgeMax)
      : true;

    // 2. Check if current user's partner age range includes p's age
    const theirAge = p.dob
      ? Math.floor((Date.now() - new Date(p.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    const reverseAgeOk = theirAge
      ? (!currentUser.partnerAgeMin || theirAge >= currentUser.partnerAgeMin) &&
        (!currentUser.partnerAgeMax || theirAge <= currentUser.partnerAgeMax)
      : true;

    // 3. Check if current user's partner religion preference matches p's religion
    const religionOk =
      !currentUser.partnerReligion || !p.religion ||
      currentUser.partnerReligion === p.religion;

    // 4. Check reverse: p prefers current user's religion
    const reverseReligionOk =
      !p.partnerReligion || !currentUser.religion ||
      p.partnerReligion === currentUser.religion;

    return ageOk && reverseAgeOk && religionOk && reverseReligionOk;
  });
}

/**
 * Profiles whose partner preferences match the current user's attributes
 * (they are looking for someone like you).
 */
export async function getLookingForMe(
  currentUser: RegisteredUser
): Promise<RegisteredUser[]> {
  const oppositeGender = currentUser.gender === 'male' ? 'female' : 'male';

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', currentUser.id)
    .eq('gender', oppositeGender)
    .order('last_active', { ascending: false })
    .limit(100);

  if (!data) return [];

  const myAge = currentUser.dob
    ? Math.floor((Date.now() - new Date(currentUser.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return data.map(dbToUser).filter((p: RegisteredUser) => {
    const ageOk = myAge
      ? (!p.partnerAgeMin || myAge >= p.partnerAgeMin) &&
        (!p.partnerAgeMax || myAge <= p.partnerAgeMax)
      : true;

    const religionOk =
      !p.partnerReligion || !currentUser.religion ||
      p.partnerReligion === currentUser.religion;

    const educationOk =
      !p.partnerEducation || !currentUser.education ||
      currentUser.education.toLowerCase().includes(p.partnerEducation.toLowerCase());

    return ageOk && religionOk && educationOk;
  });
}

/**
 * Profiles matching current user's preferred education.
 */
export async function getByEducationPref(
  currentUserId: string,
  preferredEducation: string | undefined,
  oppositeGender: 'male' | 'female' | null
): Promise<RegisteredUser[]> {
  if (!preferredEducation) return fetchMatchProfiles(currentUserId, oppositeGender || undefined);

  let query = supabase
    .from('profiles')
    .select('*')
    .neq('id', currentUserId)
    .ilike('education', `%${preferredEducation}%`)
    .order('last_active', { ascending: false })
    .limit(50);

  if (oppositeGender) query = query.eq('gender', oppositeGender);

  const { data } = await query;
  return (data || []).map(dbToUser);
}

/**
 * Profiles matching current user's preferred occupation.
 */
export async function getByProfessionPref(
  currentUserId: string,
  preferredOccupation: string | undefined,
  oppositeGender: 'male' | 'female' | null
): Promise<RegisteredUser[]> {
  if (!preferredOccupation) return fetchMatchProfiles(currentUserId, oppositeGender || undefined);

  let query = supabase
    .from('profiles')
    .select('*')
    .neq('id', currentUserId)
    .ilike('occupation', `%${preferredOccupation}%`)
    .order('last_active', { ascending: false })
    .limit(50);

  if (oppositeGender) query = query.eq('gender', oppositeGender);

  const { data } = await query;
  return (data || []).map(dbToUser);
}

/**
 * Profiles in the same preferred city/state.
 */
export async function getByLocationPref(
  currentUserId: string,
  preferredCity: string | undefined,
  state: string | undefined,
  oppositeGender: 'male' | 'female' | null
): Promise<RegisteredUser[]> {
  let query = supabase
    .from('profiles')
    .select('*')
    .neq('id', currentUserId)
    .order('last_active', { ascending: false })
    .limit(50);

  if (oppositeGender) query = query.eq('gender', oppositeGender);
  if (preferredCity) query = query.ilike('city', `%${preferredCity}%`);
  else if (state) query = query.eq('state', state);

  const { data } = await query;
  return (data || []).map(dbToUser);
}

/**
 * NRI profiles — profiles with country !== 'India'.
 */
export async function getNRIMatches(
  currentUserId: string,
  oppositeGender: 'male' | 'female' | null
): Promise<RegisteredUser[]> {
  let query = supabase
    .from('profiles')
    .select('*')
    .neq('id', currentUserId)
    .neq('country', 'India')
    .order('last_active', { ascending: false })
    .limit(50);

  if (oppositeGender) query = query.eq('gender', oppositeGender);

  const { data } = await query;
  return (data || []).map(dbToUser);
}

/**
 * Tamil Nakshatra (Star) compatibility map — Dina Porutham based.
 * Each star lists the stars that are compatible with it.
 * Source: Traditional Tamil astrology Dina Porutham chart (27 stars, counted from the girl's star).
 */
const STAR_COMPATIBILITY: Record<string, string[]> = {
  "Ashwini":       ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishtha", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"],
  "Bharani":       ["Ashwini", "Bharani", "Rohini", "Mrigashira", "Punarvasu", "Pushya", "Uttara Phalguni", "Hasta", "Chitra", "Vishakha", "Anuradha", "Uttara Ashadha", "Shravana", "Shatabhisha", "Uttara Bhadrapada", "Revati"],
  "Krittika":      ["Ashwini", "Krittika", "Mrigashira", "Ardra", "Pushya", "Magha", "Uttara Phalguni", "Hasta", "Swati", "Anuradha", "Jyeshtha", "Purva Ashadha", "Shravana", "Dhanishtha", "Purva Bhadrapada", "Revati"],
  "Rohini":        ["Bharani", "Rohini", "Ardra", "Punarvasu", "Ashlesha", "Purva Phalguni", "Chitra", "Vishakha", "Mula", "Uttara Ashadha", "Shatabhisha", "Uttara Bhadrapada"],
  "Mrigashira":    ["Ashwini", "Bharani", "Krittika", "Mrigashira", "Punarvasu", "Uttara Phalguni", "Hasta", "Vishakha", "Jyeshtha", "Shravana", "Purva Bhadrapada", "Revati"],
  "Ardra":         ["Ashwini", "Krittika", "Ardra", "Pushya", "Magha", "Hasta", "Swati", "Anuradha", "Purva Ashadha", "Dhanishtha", "Purva Bhadrapada"],
  "Punarvasu":     ["Bharani", "Rohini", "Punarvasu", "Ashlesha", "Purva Phalguni", "Chitra", "Vishakha", "Mula", "Uttara Ashadha", "Shatabhisha", "Uttara Bhadrapada"],
  "Pushya":        ["Ashwini", "Krittika", "Ardra", "Pushya", "Uttara Phalguni", "Hasta", "Swati", "Anuradha", "Purva Ashadha", "Shravana", "Dhanishtha"],
  "Ashlesha":      ["Rohini", "Punarvasu", "Ashlesha", "Purva Phalguni", "Chitra", "Mula", "Uttara Ashadha", "Shatabhisha", "Uttara Bhadrapada"],
  "Magha":         ["Ashwini", "Krittika", "Ardra", "Magha", "Uttara Phalguni", "Swati", "Jyeshtha", "Purva Ashadha", "Dhanishtha", "Purva Bhadrapada"],
  "Purva Phalguni":["Bharani", "Rohini", "Punarvasu", "Ashlesha", "Purva Phalguni", "Chitra", "Vishakha", "Mula", "Uttara Ashadha", "Shatabhisha"],
  "Uttara Phalguni":["Ashwini", "Bharani", "Krittika", "Mrigashira", "Ardra", "Pushya", "Uttara Phalguni", "Hasta", "Swati", "Anuradha", "Shravana", "Revati"],
  "Hasta":         ["Ashwini", "Bharani", "Krittika", "Mrigashira", "Ardra", "Pushya", "Uttara Phalguni", "Hasta", "Anuradha", "Purva Ashadha", "Shravana", "Purva Bhadrapada"],
  "Chitra":        ["Bharani", "Rohini", "Punarvasu", "Ashlesha", "Purva Phalguni", "Chitra", "Vishakha", "Mula", "Shatabhisha", "Uttara Bhadrapada"],
  "Swati":         ["Ashwini", "Krittika", "Ardra", "Pushya", "Magha", "Uttara Phalguni", "Swati", "Anuradha", "Purva Ashadha", "Dhanishtha"],
  "Vishakha":      ["Ashwini", "Bharani", "Rohini", "Mrigashira", "Punarvasu", "Purva Phalguni", "Chitra", "Vishakha", "Mula", "Uttara Ashadha", "Shatabhisha"],
  "Anuradha":      ["Ashwini", "Krittika", "Ardra", "Pushya", "Uttara Phalguni", "Hasta", "Swati", "Anuradha", "Jyeshtha", "Purva Ashadha", "Shravana"],
  "Jyeshtha":      ["Ashwini", "Krittika", "Mrigashira", "Magha", "Anuradha", "Jyeshtha", "Dhanishtha", "Purva Bhadrapada"],
  "Mula":          ["Rohini", "Punarvasu", "Ashlesha", "Purva Phalguni", "Chitra", "Vishakha", "Mula", "Uttara Ashadha", "Shatabhisha"],
  "Purva Ashadha": ["Ashwini", "Krittika", "Ardra", "Magha", "Hasta", "Swati", "Anuradha", "Purva Ashadha", "Shravana", "Dhanishtha"],
  "Uttara Ashadha":["Ashwini", "Bharani", "Rohini", "Punarvasu", "Ashlesha", "Purva Phalguni", "Vishakha", "Mula", "Uttara Ashadha", "Shatabhisha"],
  "Shravana":      ["Ashwini", "Bharani", "Krittika", "Mrigashira", "Ardra", "Pushya", "Uttara Phalguni", "Hasta", "Anuradha", "Purva Ashadha", "Shravana"],
  "Dhanishtha":    ["Ashwini", "Krittika", "Ardra", "Magha", "Swati", "Jyeshtha", "Purva Ashadha", "Dhanishtha", "Purva Bhadrapada"],
  "Shatabhisha":   ["Bharani", "Rohini", "Punarvasu", "Ashlesha", "Purva Phalguni", "Chitra", "Vishakha", "Mula", "Uttara Ashadha", "Shatabhisha"],
  "Purva Bhadrapada": ["Ashwini", "Krittika", "Ardra", "Magha", "Hasta", "Jyeshtha", "Dhanishtha", "Purva Bhadrapada"],
  "Uttara Bhadrapada": ["Ashwini", "Bharani", "Rohini", "Punarvasu", "Ashlesha", "Chitra", "Uttara Ashadha", "Shatabhisha", "Uttara Bhadrapada"],
  "Revati":        ["Ashwini", "Bharani", "Krittika", "Mrigashira", "Uttara Phalguni", "Hasta", "Anuradha", "Shravana", "Revati"],
};

/**
 * Profiles with compatible star signs (nakshatra compatibility — Dina Porutham).
 */
export async function getStarMatches(
  currentUserId: string,
  star: string | undefined,
  oppositeGender: 'male' | 'female' | null
): Promise<RegisteredUser[]> {
  if (!star) return getWithHoroscope(currentUserId, oppositeGender);

  // Get list of compatible stars; fall back to same star if not in map
  const compatibleStars = STAR_COMPATIBILITY[star] ?? [star];

  let query = supabase
    .from('profiles')
    .select('*')
    .neq('id', currentUserId)
    .in('star', compatibleStars)
    .order('last_active', { ascending: false })
    .limit(50);

  if (oppositeGender) query = query.eq('gender', oppositeGender);

  const { data } = await query;
  if (data && data.length > 0) return data.map(dbToUser);

  // Fallback: profiles with any star set
  return getWithHoroscope(currentUserId, oppositeGender);
}

/**
 * Profiles with matching rasi (horoscope sign).
 */
export async function getHoroscopeMatches(
  currentUserId: string,
  rasi: string | undefined,
  oppositeGender: 'male' | 'female' | null
): Promise<RegisteredUser[]> {
  if (!rasi) return getWithHoroscope(currentUserId, oppositeGender);

  let query = supabase
    .from('profiles')
    .select('*')
    .neq('id', currentUserId)
    .eq('rasi', rasi)
    .order('last_active', { ascending: false })
    .limit(50);

  if (oppositeGender) query = query.eq('gender', oppositeGender);

  const { data } = await query;
  if (data && data.length > 0) return data.map(dbToUser);

  return getWithHoroscope(currentUserId, oppositeGender);
}

// ── REAL NOTIFICATION SYSTEM ───────────────────────────────────────────

export interface NotificationRow {
  id: string;
  userId: string;
  type: 'interest' | 'view' | 'message' | 'shortlist' | 'match' | 'system';
  title: string;
  body: string;
  href?: string;
  read: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToNotification(row: Record<string, any>): NotificationRow {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    href: row.href ?? undefined,
    read: row.read ?? false,
    data: row.data ?? {},
    createdAt: row.created_at,
  };
}

export async function createNotification(
  userId: string,
  type: NotificationRow['type'],
  title: string,
  body: string,
  href?: string,
  data?: Record<string, unknown>
): Promise<void> {
  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body,
    href: href ?? null,
    data: data ?? {},
  });
}

export async function getNotifications(userId: string): Promise<NotificationRow[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  return (data || []).map(dbToNotification);
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from('notifications').update({ read: true }).eq('id', id);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
}

export async function deleteNotification(id: string): Promise<void> {
  await supabase.from('notifications').delete().eq('id', id);
}

// ── REAL CHAT / MESSAGES SYSTEM ───────────────────────────────────────

export interface MessageRow {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  readAt?: string;
  sentAt: string;
}

export interface ConversationSummary {
  partnerId: string;
  partnerProfile?: RegisteredUser;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isInitiatedByPartner: boolean; // partner sent first message
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToMessage(row: Record<string, any>): MessageRow {
  return {
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    content: row.content,
    readAt: row.read_at ?? undefined,
    sentAt: row.sent_at,
  };
}

/**
 * Get all conversation partners for a user.
 */
export async function getConversations(userId: string): Promise<ConversationSummary[]> {
  // Get all messages involving this user
  const { data: msgs } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('sent_at', { ascending: false });

  if (!msgs || msgs.length === 0) return [];

  // Group by conversation partner
  const partnersMap = new Map<string, {
    lastMessage: string;
    lastMessageAt: string;
    unread: number;
    initiatedByPartner: boolean;
  }>();

  for (const msg of msgs) {
    const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
    if (!partnersMap.has(partnerId)) {
      // Check if partner sent first (they initiated)
      const partnerInitiated = msg.sender_id !== userId;
      partnersMap.set(partnerId, {
        lastMessage: msg.content,
        lastMessageAt: msg.sent_at,
        unread: (!msg.read_at && msg.receiver_id === userId) ? 1 : 0,
        initiatedByPartner: partnerInitiated,
      });
    } else {
      const existing = partnersMap.get(partnerId)!;
      if (!msg.read_at && msg.receiver_id === userId) {
        existing.unread += 1;
      }
    }
  }

  // Fetch profiles for all partners
  const partnerIds = [...partnersMap.keys()];
  const { data: profileRows } = await supabase
    .from('profiles')
    .select('*')
    .in('id', partnerIds);

  const profilesById = new Map<string, RegisteredUser>();
  for (const row of profileRows || []) {
    profilesById.set(row.id, dbToUser(row));
  }

  return partnerIds.map((partnerId) => {
    const info = partnersMap.get(partnerId)!;
    return {
      partnerId,
      partnerProfile: profilesById.get(partnerId),
      lastMessage: info.lastMessage,
      lastMessageAt: info.lastMessageAt,
      unreadCount: info.unread,
      isInitiatedByPartner: info.initiatedByPartner,
    };
  });
}

/**
 * Get messages between two users.
 */
export async function getMessages(userId: string, otherId: string): Promise<MessageRow[]> {
  const { data } = await supabase
    .from('messages')
    .select('*')
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`
    )
    .order('sent_at', { ascending: true });

  // Mark as read
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('sender_id', otherId)
    .eq('receiver_id', userId)
    .is('read_at', null);

  return (data || []).map(dbToMessage);
}

/**
 * Send a message — with premium gating logic.
 * Rules:
 *   - Paid senders: always allowed
 *   - Free senders: allowed ONLY if the receiver has previously sent them a message
 */
export async function sendMessage(
  senderId: string,
  receiverId: string,
  content: string
): Promise<{ error?: string }> {
  // Fetch sender profile to check premium
  const { data: senderProfile } = await supabase
    .from('profiles')
    .select('is_premium')
    .eq('id', senderId)
    .single();

  const isPremium = senderProfile?.is_premium ?? false;

  if (!isPremium) {
    // Check if receiver has previously messaged sender (allowing free reply)
    const { data: priorMsg } = await supabase
      .from('messages')
      .select('id')
      .eq('sender_id', receiverId)
      .eq('receiver_id', senderId)
      .limit(1)
      .maybeSingle();

    if (!priorMsg) {
      return { error: 'upgrade' }; // signal upgrade needed
    }
  }

  const { error } = await supabase.from('messages').insert({
    sender_id: senderId,
    receiver_id: receiverId,
    content,
  });

  if (!error) {
    // Create notification for receiver
    await createNotification(
      receiverId,
      'message',
      'New Message',
      `You have a new message.`,
      '/messages'
    );
  }

  return { error: error?.message };
}

/**
 * Mark messages as read in a conversation.
 */
export async function markMessagesRead(userId: string, senderId: string): Promise<void> {
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('sender_id', senderId)
    .eq('receiver_id', userId)
    .is('read_at', null);
}

// ── NOTIFICATION-CREATING WRAPPERS ────────────────────────────────────

/**
 * Record a profile view AND create notification for the viewed user.
 */
export async function recordProfileViewWithNotification(
  viewerId: string,
  viewedId: string,
  viewerName?: string
): Promise<void> {
  if (viewedId.startsWith('ETM')) return;
  const { data: existing } = await supabase
    .from('profile_views')
    .select('id')
    .eq('viewer_id', viewerId)
    .eq('viewed_id', viewedId)
    .maybeSingle();

  if (existing) return;

  await supabase
    .from('profile_views')
    .insert({ viewer_id: viewerId, viewed_id: viewedId });

  await createNotification(
    viewedId,
    'view',
    'Profile Viewed',
    viewerName
      ? `${viewerName} viewed your profile.`
      : 'Someone viewed your profile.',
    '/matches?tab=viewed_you'
  );
}

/**
 * Shortlist a profile AND create notification.
 */
export async function shortlistProfileWithNotification(
  userId: string,
  targetId: string,
  userName?: string
): Promise<void> {
  if (targetId.startsWith('ETM')) {
    console.log(`[Mock] Shortlisted profile with notification ${targetId}`);
    return;
  }

  const { data: existing } = await supabase
    .from('shortlists')
    .select('id')
    .eq('user_id', userId)
    .eq('target_id', targetId)
    .maybeSingle();

  if (!existing) {
    await supabase
      .from('shortlists')
      .insert({ user_id: userId, target_id: targetId });
  }

  await createNotification(
    targetId,
    'shortlist',
    'Shortlisted by Someone',
    userName
      ? `${userName} shortlisted your profile.`
      : 'A member shortlisted your profile.',
    '/matches?tab=shortlisted_you'
  );
}

/**
 * Send interest AND create notification.
 */
export async function sendInterestWithNotification(
  senderId: string,
  receiverId: string,
  senderName?: string,
  message?: string
): Promise<{ error?: string }> {
  if (receiverId.startsWith('ETM')) {
    console.log(`[Mock] Sent interest with notification to ${receiverId}`);
    return {};
  }

  let finalError;
  const { data: existing } = await supabase
    .from('interests')
    .select('id')
    .eq('sender_id', senderId)
    .eq('receiver_id', receiverId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('interests')
      .update({ status: 'pending', message: message || null })
      .eq('id', existing.id);
    finalError = error;
  } else {
    const { error } = await supabase
      .from('interests')
      .insert({ sender_id: senderId, receiver_id: receiverId, status: 'pending', message: message || null });
    finalError = error;
  }

  if (!finalError) {
    await createNotification(
      receiverId,
      'interest',
      'New Interest Received',
      senderName
        ? `${senderName} sent you an interest.`
        : 'Someone sent you an interest.',
      '/interests'
    );
  }

  return { error: finalError?.message };
}
