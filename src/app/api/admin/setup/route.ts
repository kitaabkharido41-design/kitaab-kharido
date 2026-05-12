import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'kitaabkharido41@gmail.com'
const ADMIN_PASSWORD = 'Kitaab@3176'
const ADMIN_NAME = 'Adarsh Gupta'

export async function POST(request: NextRequest) {
  try {
    const { setupKey } = await request.json()

    // Simple protection against accidental runs
    if (setupKey !== 'kitaab-admin-setup-2025') {
      return NextResponse.json({ error: 'Invalid setup key' }, { status: 403 })
    }

    // Use server client only for auth signup attempt
    const serverSupabase = await createClient()

    // Use admin client for all database operations
    const supabase = await createAdminClient()
    const results: Record<string, string> = {}

    // 1. Try to create the admin user via Supabase Auth (email/password)
    try {
      const { data, error } = await serverSupabase.auth.signUp({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        options: {
          data: { full_name: ADMIN_NAME },
        },
      })

      if (error) {
        results.user = `Warning: ${error.message} — User may already exist or email conflict`
      } else if (data.user) {
        results.user = `Auth user created/exists: ${data.user.id}`
        results.confirmed = data.user.confirmed_at ? 'Email confirmed' : 'Email NOT confirmed'
      }
    } catch (e: unknown) {
      results.user = `Auth signup error: ${e instanceof Error ? e.message : String(e)}`
    }

    // 2. Get the user ID
    const ADMIN_UUID = '06585517-b6a2-438c-b26d-dbfb1a0cbba5'

    // 3. Try to upsert the admin profile
    try {
      const { error: err1 } = await supabase
        .from('profiles')
        .upsert({
          id: ADMIN_UUID,
          full_name: ADMIN_NAME,
          is_admin: true,
        }, { onConflict: 'id' })

      if (err1) {
        results.profile = `Profile upsert failed: ${err1.message}`
      } else {
        results.profile = `Admin profile set (UUID: ${ADMIN_UUID.slice(0, 8)}...)`
      }
    } catch (e: unknown) {
      results.profile = `Profile error: ${e instanceof Error ? e.message : String(e)}`
    }

    // 4. Check if ebook_requests table exists
    try {
      const { error: ebookErr } = await supabase.from('ebook_requests').select('id').limit(1)
      if (ebookErr && (ebookErr.code === 'PGRST205' || ebookErr.code === '42P01')) {
        results.ebook_requests = 'NOT CREATED — Run SQL in Supabase SQL Editor (see below)'
      } else {
        results.ebook_requests = 'Table exists'
      }
    } catch {
      results.ebook_requests = 'Could not check'
    }

    // 5. Insert default site settings
    const defaultSettings = [
      { key: 'whatsapp_number', value: '919382470919' },
      { key: 'delivery_charge', value: '35' },
      { key: 'free_delivery_above', value: '499' },
      { key: 'banner_text', value: '📚 Up to 60% OFF on all books! Free delivery above ₹499' },
      { key: 'maintenance_mode', value: 'false' },
    ]

    try {
      const { error: settingsErr } = await supabase
        .from('site_settings')
        .upsert(defaultSettings, { onConflict: 'key' })

      if (settingsErr) {
        results.settings = `Settings error: ${settingsErr.message}`
      } else {
        results.settings = `Set ${defaultSettings.length} default settings`
      }
    } catch (e: unknown) {
      results.settings = `Settings error: ${e instanceof Error ? e.message : String(e)}`
    }

    return NextResponse.json({
      success: true,
      message: 'Admin setup completed',
      results,
      sql_needed: results.ebook_requests?.includes('NOT CREATED') ? true : false,
      sql: results.ebook_requests?.includes('NOT CREATED') ? `CREATE TABLE IF NOT EXISTS ebook_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT,
  user_email TEXT,
  book_title TEXT NOT NULL,
  author TEXT,
  category TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  admin_reply TEXT,
  ebook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);` : null,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
