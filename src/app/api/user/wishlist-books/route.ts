import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/user/wishlist-books?ids=id1,id2,id3
 * Fetch books by a comma-separated list of UUIDs.
 * Uses admin client (service role key) to bypass RLS.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')

    if (!idsParam) {
      return NextResponse.json({ books: [] })
    }

    const ids = idsParam.split(',').filter(Boolean).map((id) => id.trim())

    if (ids.length === 0) {
      return NextResponse.json({ books: [] })
    }

    const { data, error } = await supabase
      .from('books')
      .select('*')
      .in('id', ids)

    if (error) {
      console.error('Failed to fetch wishlist books:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ books: data || [] })
  } catch (err) {
    console.error('Wishlist books fetch error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
