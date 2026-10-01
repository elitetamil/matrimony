// src/lib/supabase-admin.ts
// Server-only Supabase client with SERVICE ROLE key.
// ⚠️  NEVER expose this client to the browser — it bypasses all RLS.
// Only import in API routes (app/api/**) and server actions.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-key-for-build';

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  // This will warn at server runtime/build time.
  console.error('[supabase-admin] SUPABASE_SERVICE_ROLE_KEY is not set!');
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
