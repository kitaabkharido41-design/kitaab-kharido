import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/orders — Place a new order (used by cart checkout)
 * Uses admin client (service role key) to bypass RLS for order creation.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()

    const {
      user_id,
      order_number,
      total_amount,
      delivery_charge,
      grand_total,
      payment_method,
      payment_status,
      order_status,
      shipping_name,
      shipping_phone,
      shipping_address,
      shipping_city,
      shipping_pincode,
      items,
    } = body

    if (!user_id || !order_number || !shipping_name || !shipping_phone || !shipping_address || !shipping_city || !shipping_pincode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Order must have at least one item' }, { status: 400 })
    }

    // 1. Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id,
        order_number,
        total_amount,
        delivery_charge,
        grand_total,
        payment_method: payment_method || 'whatsapp',
        payment_status: payment_status || 'pending',
        order_status: order_status || 'pending',
        shipping_name,
        shipping_phone,
        shipping_address,
        shipping_city,
        shipping_pincode,
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order creation failed:', orderError.message)
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    // 2. Create order items
    const orderItemsData = items.map((item: Record<string, unknown>) => ({
      order_id: order.id,
      book_id: item.book_id,
      book_title: item.book_title,
      book_author: item.book_author,
      book_price: item.book_price,
      book_original_price: item.book_original_price,
      book_image_url: item.book_image_url,
      quantity: item.quantity,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData)

    if (itemsError) {
      console.error('Order items creation failed:', itemsError.message)
      // Try to clean up the order
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    // 3. Update user profile with shipping details (best-effort)
    await supabase
      .from('profiles')
      .update({
        full_name: shipping_name,
        phone: shipping_phone,
        address: shipping_address,
        city: shipping_city,
        pincode: shipping_pincode,
      })
      .eq('id', user_id)

    return NextResponse.json({
      success: true,
      order: { id: order.id, order_number: order.order_number },
    })
  } catch (err) {
    console.error('Order placement error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
