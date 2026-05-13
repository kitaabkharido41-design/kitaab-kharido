import { NextResponse } from 'next/server'
import { createAdminClient, hasServiceRoleKey } from '@/lib/supabase/admin'

export async function GET() {
  const usingServiceRole = hasServiceRoleKey()
  const errors: string[] = []

  try {
    const supabase = await createAdminClient()

    // Fetch all tables in parallel, tracking any RLS errors
    const [booksRes, ordersRes, slidesRes, bookRequestsRes, sellRequestsRes, ebookRequestsRes, settingsRes] = await Promise.all([
      supabase.from('books').select('*').order('created_at', { ascending: false }).then(r => {
        if (r.error) { errors.push(`books: ${r.error.message}`); return { data: [] } }
        return r
      }),
      supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).then(r => {
        if (r.error) { errors.push(`orders: ${r.error.message}`); return { data: [] } }
        return r
      }),
      supabase.from('hero_slides').select('*').order('sort_order').then(r => {
        if (r.error) { errors.push(`hero_slides: ${r.error.message}`); return { data: [] } }
        return r
      }),
      supabase.from('book_requests').select('*').order('created_at', { ascending: false }).then(r => {
        if (r.error) { errors.push(`book_requests: ${r.error.message}`); return { data: [] } }
        return r
      }),
      supabase.from('sell_requests').select('*').order('created_at', { ascending: false }).then(r => {
        if (r.error) { errors.push(`sell_requests: ${r.error.message}`); return { data: [] } }
        return r
      }),
      supabase.from('ebook_requests').select('*').order('created_at', { ascending: false }).then(r => {
        if (r.error) { errors.push(`ebook_requests: ${r.error.message}`); return { data: [] } }
        return r
      }),
      supabase.from('site_settings').select('*').then(r => {
        if (r.error) { errors.push(`site_settings: ${r.error.message}`); return { data: [] } }
        return r
      }),
    ])

    // Detect RLS issues
    const hasRlsError = errors.some(e => e.includes('recursion') || e.includes('RLS') || e.includes('policy'))

    return NextResponse.json({
      books: booksRes.data || [],
      orders: ordersRes.data || [],
      slides: slidesRes.data || [],
      bookRequests: bookRequestsRes.data || [],
      sellRequests: sellRequestsRes.data || [],
      ebookRequests: ebookRequestsRes.data || [],
      settings: settingsRes.data || [],
      // Metadata for the admin dashboard
      _meta: {
        usingServiceRole,
        hasRlsError,
        errors: hasRlsError ? errors : undefined,
      },
    })
  } catch (err) {
    console.error('Admin data fetch failed:', err)
    return NextResponse.json({
      books: [], orders: [], slides: [],
      bookRequests: [], sellRequests: [], ebookRequests: [], settings: [],
      _meta: {
        usingServiceRole,
        hasRlsError: true,
        errors: [String(err)],
      },
    }, { status: 200 })
  }
}
