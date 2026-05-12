import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/sell-requests
 * Insert a new sell request.
 * Uses admin client (service role key) to bypass RLS.
 *
 * Body: { user_id, user_name, user_email, user_phone, book_title, author, category, book_condition, asking_price, description }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()

    const {
      user_id,
      user_name,
      user_email,
      user_phone,
      book_title,
      author,
      category,
      book_condition,
      asking_price,
      description,
    } = body

    if (!book_title || !book_title.trim()) {
      return NextResponse.json({ error: 'book_title is required' }, { status: 400 })
    }

    const { error } = await supabase.from('sell_requests').insert({
      user_id,
      user_name: user_name || null,
      user_email: user_email || null,
      user_phone: user_phone || null,
      book_title: book_title.trim(),
      author: author || null,
      category: category || null,
      book_condition: book_condition || null,
      asking_price: asking_price ? Number(asking_price) : null,
      description: description || null,
    })

    if (error) {
      console.error('Failed to insert sell request:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Sell request error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
