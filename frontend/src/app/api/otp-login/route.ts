import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Admin client — uses service role key, NEVER exposed to the browser
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_key',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const { profileId } = await req.json();

    if (!profileId) {
      return NextResponse.json({ error: "profileId is required." }, { status: 400 });
    }

    // 1. Look up profile row to get auth_email or fallback details
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, mobile, auth_email, email')
      .eq('id', profileId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const mobile = profile.mobile;

    // Collect candidate auth emails for this profile
    const candidateEmails: string[] = [];
    if (profile.auth_email) candidateEmails.push(profile.auth_email);
    if (profile.email) candidateEmails.push(profile.email);

    // Also check auth.users by profile ID
    const { data: authData } = await supabaseAdmin.auth.admin.getUserById(profileId);
    if (authData?.user?.email) candidateEmails.push(authData.user.email);

    if (mobile) {
      candidateEmails.push(`${mobile}@etm.app`);
      for (let i = 2; i <= 20; i++) {
        candidateEmails.push(`${mobile}_${i}@etm.app`);
      }
    }

    // Deduplicate candidate emails
    const uniqueEmails = Array.from(new Set(candidateEmails));

    // Try generating magiclink for candidate emails until one matches this profile ID
    let linkData: any = null;

    for (const email of uniqueEmails) {
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

      if (!error && data?.user?.id === profileId) {
        linkData = data;
        // Persist verified auth_email to profile row for fast path next time
        void supabaseAdmin
          .from('profiles')
          .update({ auth_email: email })
          .eq('id', profileId);
        break;
      } else if (!error && data && !profileId) {
        linkData = data;
        break;
      }
    }

    if (!linkData) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // 3. Exchange the OTP token for a real session
    const url = new URL(linkData.properties.action_link);
    const token_hash = url.searchParams.get("token") || linkData.properties.hashed_token;
    const type = url.searchParams.get("type") || "magiclink";

    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.verifyOtp({
      token_hash,
      type: type as "magiclink",
    });

    if (sessionError || !sessionData.session) {
      console.error("[otp-login] verifyOtp error:", sessionError);
      return NextResponse.json({ error: "Failed to establish session." }, { status: 500 });
    }

    return NextResponse.json({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
    });
  } catch (err) {
    console.error("[otp-login] Unexpected error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
