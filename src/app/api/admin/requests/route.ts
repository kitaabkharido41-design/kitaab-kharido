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

    const validTypes = ['book_requests', 'sell_requests']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Use book_requests or sell_requests' }, { status: 400 })
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
