import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Admin emails — this is the single source of truth for admin access.
// No database dependency. No RLS issues. Just email matching.
const ADMIN_EMAILS = new Set([
  'kitaabkharido41@gmail.com',
])

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the currently logged-in user from session cookies
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        isAdmin: false,
      })
    }

    // Admin check is purely email-based — no profiles table needed
    const isAdmin = !!user.email && ADMIN_EMAILS.has(user.email)

    return NextResponse.json({
      authenticated: true,
      isAdmin,
      userId: user.id,
      userEmail: user.email,
      userName: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
