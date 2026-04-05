import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const SUPABASE_URL = 'https://hqwmobnsxsefkcbsvzon.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhxd21vYm5zeHNlZmtjYnN2em9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NDM1ODYsImV4cCI6MjA5MDQxOTU4Nn0.4dlPT0iwUWzIhXZfh97GMnNM3KouWPAzAlGmTmFsY8s'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
