import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from('site_settings')
      .select('*')

    if (error) {
      return NextResponse.json({ settings: {} }, { status: 200 })
    }

    const settings: Record<string, string> = {}
    data?.forEach((s) => {
      if (s.key) settings[s.key] = s.value || ''
    })

    return NextResponse.json({ settings })
  } catch {
    return NextResponse.json({ settings: {} }, { status: 200 })
  }
}
