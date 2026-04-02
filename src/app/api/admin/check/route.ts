import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify the user is logged in
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check admin status from profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, is_admin')
      .eq('id', user.id)
      .single()

    if (error) {
      return NextResponse.json({
        authenticated: true,
        isAdmin: false,
        error: 'Profile not found — may need to be created',
        userId: user.id,
        userEmail: user.email,
      }, { status: 200 })
    }

    return NextResponse.json({
      authenticated: true,
      isAdmin: !!profile.is_admin,
      userId: user.id,
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        is_admin: profile.is_admin,
      },
      userEmail: user.email,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
