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
        results.confirmed = data.user.confirmed_at ? 'Email confirmed' : 'Email NOT confirmed (check inbox or use SQL to confirm)'
      }
    } catch (e: unknown) {
      results.user = `Auth signup error: ${e instanceof Error ? e.message : String(e)}`
    }

    // 2. Get the user ID
    const ADMIN_UUID = '06585517-b6a2-438c-b26d-dbfb1a0cbba5'

    // 3. Try to upsert the admin profile (using admin client — bypasses RLS)
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

    // 4. Insert demo books (using admin client)
    const demoBooks = [
      {
        title: "Concepts of Physics Vol. 1",
        author: "H.C. Verma",
        category: "Academic",
        sub_category: "JEE Physics",
        price: 220,
        original_price: 499,
        discount_tag: "50% OFF",
        condition: "Good",
        stock_quantity: 5,
        image_urls: ["https://m.media-amazon.com/images/I/71c+YFRqIxL._AC_UF1000,1000_QL80_.jpg"],
        isbn: "978-8177091878",
        publisher: "Bharati Bhawan",
        edition: "2023",
        language: "English",
        description: "The most recommended book for JEE Physics preparation.",
        active: true,
        featured: true,
      },
      {
        title: "Organic Chemistry",
        author: "Morrison & Boyd",
        category: "Academic",
        sub_category: "JEE Chemistry",
        price: 350,
        original_price: 799,
        discount_tag: "50% OFF",
        condition: "Like New",
        stock_quantity: 3,
        image_urls: ["https://m.media-amazon.com/images/I/91G7T0DyT9L._AC_UF1000,1000_QL80_.jpg"],
        isbn: "978-0136436690",
        publisher: "Pearson",
        edition: "7th",
        language: "English",
        description: "The gold standard for organic chemistry.",
        active: true,
        featured: true,
      },
      {
        title: "Objective Mathematics",
        author: "R.D. Sharma",
        category: "Academic",
        sub_category: "JEE Maths",
        price: 280,
        original_price: 650,
        discount_tag: "50% OFF",
        condition: "Good",
        stock_quantity: 4,
        image_urls: ["https://m.media-amazon.com/images/I/71+0KS2LhoL._AC_UF1000,1000_QL80_.jpg"],
        isbn: "978-9383182334",
        publisher: "Dhanpat Rai",
        edition: "2024",
        language: "English",
        description: "Comprehensive mathematics book for JEE Mains & Advanced.",
        active: true,
        featured: true,
      },
    ]

    try {
      const { data: bookData, error: bookErr } = await supabase
        .from('books')
        .upsert(demoBooks, { onConflict: 'title,author' })
        .select()

      if (bookErr) {
        const { data: insertData, error: insertErr } = await supabase
          .from('books')
          .insert(demoBooks)
          .select()

        if (insertErr) {
          results.books = `Books error: ${insertErr.message}`
        } else {
          results.books = `Inserted ${insertData?.length || 0} demo books`
        }
      } else {
        results.books = `Upserted ${bookData?.length || 0} demo books`
      }
    } catch (e: unknown) {
      results.books = `Books error: ${e instanceof Error ? e.message : String(e)}`
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
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
