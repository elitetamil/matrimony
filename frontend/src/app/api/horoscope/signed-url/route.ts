import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { HOROSCOPES_BUCKET, PROFILE_PHOTOS_BUCKET } from '@/lib/supabase';

// Feature plan levels that allow horoscope viewing
const ALLOWED_HOROSCOPE_PLANS = ['Gold', 'PrimeGold', 'PrimeTillUMarry', 'Diamond', 'Platinum'];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('targetUserId');

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'targetUserId parameter is required.' },
        { status: 400 }
      );
    }

    // 1. Authenticate requesting user via Bearer token
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired authentication session.' },
        { status: 401 }
      );
    }

    const isOwner = user.id === targetUserId;

    // 2. Server-side authorization check:
    // If not the owner, verify active premium membership with horoscope_view access
    if (!isOwner) {
      const { data: requesterProfile, error: profileErr } = await supabaseAdmin
        .from('profiles')
        .select('is_premium, membership_plan, membership_expiry')
        .eq('id', user.id)
        .single();

      if (profileErr || !requesterProfile) {
        return NextResponse.json(
          { error: 'Requester profile not found.' },
          { status: 403 }
        );
      }

      const isPlanValid =
        requesterProfile.is_premium &&
        ALLOWED_HOROSCOPE_PLANS.includes(requesterProfile.membership_plan || '') &&
        (!requesterProfile.membership_expiry || new Date(requesterProfile.membership_expiry) > new Date());

      if (!isPlanValid) {
        return NextResponse.json(
          {
            error: 'Upgrade to Gold or higher plan to view member horoscopes.',
            code: 'PREMIUM_REQUIRED',
          },
          { status: 403 }
        );
      }
    }

    // 3. Retrieve target user's horoscope record from database
    const { data: horoscopeRecord, error: hErr } = await supabaseAdmin
      .from('horoscopes')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (hErr || !horoscopeRecord) {
      return NextResponse.json(
        { error: 'Horoscope document not found.' },
        { status: 404 }
      );
    }

    const rawFileUrl = horoscopeRecord.file_url;

    // Backward compatibility: If stored in legacy public profile-photos, return public URL
    if (rawFileUrl.includes(`/${PROFILE_PHOTOS_BUCKET}/`)) {
      return NextResponse.json(
        {
          signedUrl: rawFileUrl,
          fileName: horoscopeRecord.file_name || 'horoscope',
        },
        {
          headers: {
            'Cache-Control': 'private, no-cache, no-store, max-age=0',
          },
        }
      );
    }

    // Extract storage path e.g. "userId/horoscope_123.jpg"
    let cleanPath = rawFileUrl;
    if (cleanPath.includes(`/${HOROSCOPES_BUCKET}/`)) {
      cleanPath = cleanPath.split(`/${HOROSCOPES_BUCKET}/`)[1];
    }

    // 4. Generate time-limited signed URL (15 minutes) using server-side admin client
    const { data: signedData, error: signErr } = await supabaseAdmin.storage
      .from(HOROSCOPES_BUCKET)
      .createSignedUrl(cleanPath, 900);

    if (signErr || !signedData?.signedUrl) {
      console.error('[API signed-url] Error creating signed URL:', signErr);
      return NextResponse.json(
        { error: 'Failed to generate secure horoscope access URL.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        signedUrl: signedData.signedUrl,
        fileName: horoscopeRecord.file_name || 'horoscope',
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, max-age=0',
        },
      }
    );
  } catch (err: unknown) {
    console.error('[API signed-url] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error while accessing horoscope.' },
      { status: 500 }
    );
  }
}
