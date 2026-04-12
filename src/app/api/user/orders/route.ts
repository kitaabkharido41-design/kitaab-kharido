import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/user/orders?userId=xxx
 * Fetch all orders with order_items for a given user.
 * Uses admin client (service role key) to bypass RLS.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch orders:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ orders: data || [] })
  } catch (err) {
    console.error('Orders fetch error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
