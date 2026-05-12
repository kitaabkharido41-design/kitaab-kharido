import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * PUT /api/user/profile
 * Update a user's profile fields.
 * Uses admin client (service role key) to bypass RLS.
 *
 * Body: { userId, full_name, phone, address, city, pincode }
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()

    const { userId, full_name, phone, address, city, pincode } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (full_name !== undefined) updates.full_name = full_name
    if (phone !== undefined) updates.phone = phone
    if (address !== undefined) updates.address = address
    if (city !== undefined) updates.city = city
    if (pincode !== undefined) updates.pincode = pincode

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)

    if (error) {
      console.error('Failed to update profile:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Profile update error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
