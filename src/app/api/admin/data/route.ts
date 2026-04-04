import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createAdminClient()

    // Fetch all tables in parallel, gracefully handling RLS errors
    const [booksRes, ordersRes, slidesRes, bookRequestsRes, sellRequestsRes, settingsRes] = await Promise.all([
      supabase.from('books').select('*').order('created_at', { ascending: false }).then(r => {
        if (r.error) { console.warn('books fetch error:', r.error.message); return { data: [] } }
        return r
      }),
      supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).then(r => {
        if (r.error) { console.warn('orders fetch error:', r.error.message); return { data: [] } }
        return r
      }),
      supabase.from('hero_slides').select('*').order('sort_order').then(r => {
        if (r.error) { console.warn('hero_slides fetch error:', r.error.message); return { data: [] } }
        return r
      }),
      supabase.from('book_requests').select('*').order('created_at', { ascending: false }).then(r => {
        if (r.error) { console.warn('book_requests fetch error:', r.error.message); return { data: [] } }
        return r
      }),
      supabase.from('sell_requests').select('*').order('created_at', { ascending: false }).then(r => {
        if (r.error) { console.warn('sell_requests fetch error:', r.error.message); return { data: [] } }
        return r
      }),
      supabase.from('site_settings').select('*').then(r => {
        if (r.error) { console.warn('site_settings fetch error:', r.error.message); return { data: [] } }
        return r
      }),
    ])

    return NextResponse.json({
      books: booksRes.data || [],
      orders: ordersRes.data || [],
      slides: slidesRes.data || [],
      bookRequests: bookRequestsRes.data || [],
      sellRequests: sellRequestsRes.data || [],
      settings: settingsRes.data || [],
    })
  } catch (err) {
    console.error('Admin data fetch failed:', err)
    // Return empty data rather than error so dashboard still loads
    return NextResponse.json({
      books: [], orders: [], slides: [],
      bookRequests: [], sellRequests: [], settings: [],
    }, { status: 200 })
  }
}
