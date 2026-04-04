import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hqwmobnsxsefkcbsvzon.supabase.co'
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhxd21vYm5zeHNlZmtjYnN2em9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NDM1ODYsImV4cCI6MjA5MDQxOTU4Nn0.4dlPT0iwUWzIhXZfh97GMnNM3KouWPAzAlGmTmFsY8s'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Admin Supabase client.
 *
 * When SUPABASE_SERVICE_ROLE_KEY is set → uses direct client (bypasses ALL RLS).
 * When not set → falls back to SSR cookie client (subject to RLS policies).
 *
 * To get the service role key:
 * 1. Go to Supabase Dashboard → Settings → API
 * 2. Copy the "service_role" key (NOT the anon key)
 * 3. Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=eyJ...
 */
export async function createAdminClient() {
  if (SERVICE_ROLE_KEY) {
    // Direct client with service role — bypasses ALL Row Level Security
    // No cookies, no user context, full database access
    return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  // Fallback: SSR client with anon key + user cookies
  // This WILL be subject to RLS and may cause "infinite recursion" errors
  // if the profiles table has recursive policies.
  const cookieStore = await cookies()
  return createServerClient(SUPABASE_URL, ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // ignore in server components
        }
      },
    },
  })
}

/**
 * Whether the admin client has service role access (bypasses RLS).
 * Used by API routes to inform the frontend about the auth mode.
 */
export function hasServiceRoleKey(): boolean {
  return !!SERVICE_ROLE_KEY
}
