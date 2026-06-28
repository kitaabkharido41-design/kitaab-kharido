import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()
    const { type, id, ...payload } = body

    if (!type || !id) {
      return NextResponse.json({ error: 'Type and id are required' }, { status: 400 })
    }

    const validTypes = ['book_requests', 'sell_requests', 'ebook_requests']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Use book_requests, sell_requests, or ebook_requests' }, { status: 400 })
    }

    // If accepting a sell request, automatically insert it into the books table and email the seller
    if (type === 'sell_requests' && payload.status === 'accepted') {
      const { data: sellRequest } = await supabase
        .from('sell_requests')
        .select('*')
        .eq('id', id)
        .single()

      if (sellRequest) {
        // Check if this book has already been listed in the books table to avoid duplicates
        const { data: existingBooks } = await supabase
          .from('books')
          .select('id')
          .eq('title', sellRequest.book_title)
          .eq('seller_email', sellRequest.user_email)
          .limit(1)

        if (!existingBooks || existingBooks.length === 0) {
          const listPrice = Number(payload.offer_price || sellRequest.asking_price || 0)
          const askPrice = Number(sellRequest.asking_price || 0)

          const bookPayload = {
            title: sellRequest.book_title,
            author: sellRequest.author || 'Unknown',
            category: sellRequest.category || 'Academic',
            sub_category: null,
            price: listPrice,
            original_price: askPrice > 0 ? askPrice * 2 : listPrice * 2,
            discount_tag: '50% OFF',
            condition: sellRequest.book_condition || 'Good',
            stock_quantity: 1,
            image_urls: sellRequest.image_urls || [],
            description: sellRequest.description || `Originally listed from sell request.`,
            active: true,
            featured: false,
            seller_name: sellRequest.user_name,
            seller_email: sellRequest.user_email,
            seller_phone: sellRequest.user_phone,
          }

          const { error: bookInsertErr } = await supabase.from('books').insert(bookPayload)
          if (bookInsertErr) {
            console.error('Failed to auto-insert book listing:', bookInsertErr.message)
          }

          // Notify the seller
          try {
            const { sendSellerAcceptanceEmail } = await import('@/lib/email/client')
            await sendSellerAcceptanceEmail(
              sellRequest.user_email,
              sellRequest.user_name,
              sellRequest.book_title,
              askPrice,
              listPrice
            )
          } catch (emailErr) {
            console.error('Failed to send seller acceptance email:', emailErr)
          }
        }
      }
    }

    const { error } = await supabase.from(type).update(payload).eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
