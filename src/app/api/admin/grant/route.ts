import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Known admin emails that can be auto-promoted
const ADMIN_EMAILS = [
  'kitaabkharido41@gmail.com',
]

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify the user is logged in
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Only allow known admin emails
    if (!ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Not authorized for admin setup' }, { status: 403 })
    }

    // Try to update the profile to set is_admin = true
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, full_name, is_admin')
      .eq('id', user.id)
      .single()

    if (fetchError || !profile) {
      // Profile doesn't exist - try to create it with is_admin = true
      const meta = user.user_metadata || {}
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: meta.full_name || meta.name || user.email?.split('@')[0] || '',
          is_admin: true,
        })
        .select()
        .single()

      if (insertError) {
        return NextResponse.json({
          error: `Failed to create profile: ${insertError.message}`,
          hint: 'You may need to run the SQL setup script in Supabase SQL Editor. See supabase-setup.sql in the project root.',
          userId: user.id,
          email: user.email,
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Admin profile created with full privileges',
        profile: newProfile,
      })
    }

    // Profile exists but is_admin is false - update it
    if (!profile.is_admin) {
      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', user.id)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json({
          error: `Failed to update admin status: ${updateError.message}`,
          hint: 'RLS policy may be blocking the update. Run the SQL in supabase-setup.sql to fix this.',
          userId: user.id,
          email: user.email,
          currentIsAdmin: profile.is_admin,
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Admin privileges granted successfully',
        profile: updated,
      })
    }

    // Already admin
    return NextResponse.json({
      success: true,
      message: 'Already an admin',
      profile,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
