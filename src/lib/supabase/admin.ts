import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Hardcoded keys — these NEVER get lost (unlike .env files that get overwritten)
const SUPABASE_URL = 'https://hqwmobnsxsefkcbsvzon.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhxd21vYm5zeHNlZmtjYnN2em9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NDM1ODYsImV4cCI6MjA5MDQxOTU4Nn0.4dlPT0iwUWzIhXZfh97GMnNM3KouWPAzAlGmTmFsY8s'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhxd21vYm5zeHNlZmtjYnN2em9uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg0MzU4NiwiZXhwIjoyMDkwNDE5NTg2fQ.qFg8RxfJPgnHCK1uuewWDdfnPTTaNYwOG6Ox2yNyfZ0'

/**
 * Admin Supabase client using service role key.
 * Bypasses ALL Row Level Security policies.
 */
export async function createAdminClient() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function hasServiceRoleKey(): boolean {
  return true // Always true — key is hardcoded
}
