import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('active', true)
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message, books: [] }, { status: 200 })
    }

    return NextResponse.json({ books: data || [] })
  } catch (err) {
    return NextResponse.json({ error: String(err), books: [] }, { status: 200 })
  }
}
