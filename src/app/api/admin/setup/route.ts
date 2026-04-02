import { NextRequest, NextResponse } from 'next/server'
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

    const supabase = await createClient()
    const results: Record<string, string> = {}

    // 1. Try to create the admin user via Supabase Auth (email/password)
    // Note: This uses the anon client which may not have admin privileges
    // The user may need to be created via Supabase Dashboard or SQL Editor
    try {
      const { data, error } = await supabase.auth.signUp({
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
    } catch (e: any) {
      results.user = `Auth signup error: ${e.message}`
    }

    // 2. Get the user ID (either from the signup or by querying)
    // We'll use a known admin UUID as fallback
    const ADMIN_UUID = '06585517-b6a2-438c-b26d-dbfb1a0cbba5'

    // 3. Try to upsert the admin profile
    try {
      // Try with the known UUID first
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
    } catch (e: any) {
      results.profile = `Profile error: ${e.message}`
    }

    // 4. Insert demo books
    const demoBooks = [
      {
        title: "Concepts of Physics Vol. 1",
        author: "H.C. Verma",
        category: "Academic",
        sub_category: "JEE Physics",
        price: 220,
        original_price: 499,
        discount_tag: "55% OFF",
        condition: "Good",
        stock_quantity: 5,
        image_urls: ["https://m.media-amazon.com/images/I/71c+YFRqIxL._AC_UF1000,1000_QL80_.jpg"],
        isbn: "978-8177091878",
        publisher: "Bharati Bhawan",
        edition: "2023",
        language: "English",
        description: "The most recommended book for JEE Physics preparation. Covers mechanics, thermodynamics, and optics with detailed theory and solved examples.",
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
        discount_tag: "55% OFF",
        condition: "Like New",
        stock_quantity: 3,
        image_urls: ["https://m.media-amazon.com/images/I/91G7T0DyT9L._AC_UF1000,1000_QL80_.jpg"],
        isbn: "978-0136436690",
        publisher: "Pearson",
        edition: "7th",
        language: "English",
        description: "The gold standard for organic chemistry. Essential for JEE Advanced and NEET preparation with comprehensive reaction mechanisms.",
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
        discount_tag: "55% OFF",
        condition: "Good",
        stock_quantity: 4,
        image_urls: ["https://m.media-amazon.com/images/I/71+0KS2LhoL._AC_UF1000,1000_QL80_.jpg"],
        isbn: "978-9383182334",
        publisher: "Dhanpat Rai",
        edition: "2024",
        language: "English",
        description: "Comprehensive mathematics book for JEE Mains & Advanced. Covers algebra, calculus, coordinate geometry with 5000+ practice problems.",
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
        // Try insert as fallback
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
    } catch (e: any) {
      results.books = `Books error: ${e.message}`
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
    } catch (e: any) {
      results.settings = `Settings error: ${e.message}`
    }

    return NextResponse.json({
      success: true,
      message: 'Admin setup completed',
      results,
      sqlInstructions: {
        note: 'If the password setup failed, run the SQL below in Supabase SQL Editor:',
        sql: `
-- STEP 1: Set admin password (works even if user exists from Google OAuth)
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = '${ADMIN_EMAIL}' LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users SET
      encrypted_password = crypt('${ADMIN_PASSWORD}', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now())
    WHERE id = v_user_id;
    RAISE NOTICE 'Password updated for existing user: %', v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, last_sign_in_at, phone
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(), 'authenticated', 'authenticated',
      '${ADMIN_EMAIL}', crypt('${ADMIN_PASSWORD}', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"${ADMIN_NAME}"}',
      now(), now(), '', '', '', '', now(), ''
    )
    RETURNING id INTO v_user_id;
    RAISE NOTICE 'New user created: %', v_user_id;
  END IF;

  -- Ensure profile with admin rights
  INSERT INTO profiles (id, full_name, is_admin)
  VALUES (v_user_id, '${ADMIN_NAME}', true)
  ON CONFLICT (id) DO UPDATE SET is_admin = true, full_name = '${ADMIN_NAME}';
END $$;

-- STEP 2: Fix RLS policies (run if needed)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
  DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
        `.trim(),
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
