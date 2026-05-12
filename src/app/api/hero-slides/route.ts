import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from('hero_slides')
      .select('*')
      .eq('active', true)
      .order('sort_order')

    if (error) {
      return NextResponse.json({ slides: [] }, { status: 200 })
    }

    return NextResponse.json({ slides: data || [] })
  } catch {
    return NextResponse.json({ slides: [] }, { status: 200 })
  }
}
