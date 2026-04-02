import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hqwmobnsxsefkcbsvzon.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhxd21vYm5zeHNlZmtjYnN2em9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NDM1ODYsImV4cCI6MjA5MDQxOTU4Nn0.4dlPT0iwUWzIhXZfh97GMnNM3KouWPAzAlGmTmFsY8s'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Only refresh the session — do NOT block any routes here
  // Admin protection is handled by the admin page itself
  await supabase.auth.getUser()

  return supabaseResponse
}
