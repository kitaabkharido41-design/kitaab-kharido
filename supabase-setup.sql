-- =====================================================
-- KITAAB KHARIDO - ONE-TIME ADMIN SETUP
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- =====================================================

-- =====================================================
-- STEP 1: Set Admin Password for kitaabkharido41@gmail.com
-- =====================================================
-- This works whether the user was created via Google OAuth or email
-- It creates a new user if they don't exist, or updates the password if they do

DO $$
DECLARE
  v_user_id uuid;
  v_existing_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_existing_id FROM auth.users WHERE email = 'kitaabkharido41@gmail.com' LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- Update password for existing user and confirm email
    UPDATE auth.users
    SET
      encrypted_password = crypt('Kitaab@3176', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now())
    WHERE id = v_existing_id;

    v_user_id := v_existing_id;
    RAISE NOTICE '✅ Password updated for existing user: %', v_user_id;
  ELSE
    -- Create brand new user with email/password
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, last_sign_in_at, phone,
      email_change_token_old, email_change_confirm_status,
      banned_until, is_sso_user, deleted_at, reauthentication_token,
      reauthentication_token_sent_at, is_anonymous
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'kitaabkharido41@gmail.com',
      crypt('Kitaab@3176', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Adarsh Gupta"}',
      now(), now(), '', '', '', '', now(), '', 0, NULL, false, NULL, '', NULL, false
    )
    RETURNING id INTO v_user_id;

    RAISE NOTICE '✅ New user created: %', v_user_id;
  END IF;

  -- Ensure admin profile exists with is_admin = true
  INSERT INTO profiles (id, full_name, is_admin)
  VALUES (v_user_id, 'Adarsh Gupta', true)
  ON CONFLICT (id) DO UPDATE SET
    is_admin = true,
    full_name = COALESCE(profiles.full_name, 'Adarsh Gupta');

  RAISE NOTICE '✅ Admin profile ensured for user: %', v_user_id;
END $$;


-- =====================================================
-- STEP 2: Fix RLS Policies on ALL Tables
-- =====================================================
-- Drop all existing policies first to avoid conflicts

DO $$ BEGIN
  -- Profiles
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
  DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

  -- Books
  ALTER TABLE books ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Anyone can view active books" ON books;
  DROP POLICY IF EXISTS "Admins can manage books" ON books;

  -- Hero Slides
  ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Anyone can view active slides" ON hero_slides;
  DROP POLICY IF EXISTS "Admins can manage slides" ON hero_slides;

  -- Orders
  ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Users can view own orders" ON orders;
  DROP POLICY IF EXISTS "Users can create orders" ON orders;
  DROP POLICY IF EXISTS "Admins can manage orders" ON orders;

  -- Order Items
  ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
  DROP POLICY IF EXISTS "Admins can manage order items" ON order_items;

  -- Book Requests
  ALTER TABLE book_requests ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Users can view own book requests" ON book_requests;
  DROP POLICY IF EXISTS "Users can create book requests" ON book_requests;
  DROP POLICY IF EXISTS "Admins can manage book requests" ON book_requests;

  -- Sell Requests
  ALTER TABLE sell_requests ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Users can view own sell requests" ON sell_requests;
  DROP POLICY IF EXISTS "Users can create sell requests" ON sell_requests;
  DROP POLICY IF EXISTS "Admins can manage sell requests" ON sell_requests;

  -- Site Settings
  ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Anyone can view site settings" ON site_settings;
  DROP POLICY IF EXISTS "Admins can manage site settings" ON site_settings;

  -- Cart & Wishlist
  ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Users can manage own cart" ON cart;
  ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Users can manage own wishlist" ON wishlist;

EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Create new policies

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Books (public read, admin write)
CREATE POLICY "Anyone can view active books" ON books
  FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage books" ON books
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Hero Slides (public read, admin write)
CREATE POLICY "Anyone can view active slides" ON hero_slides
  FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage slides" ON hero_slides
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage orders" ON orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Order Items
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND user_id = auth.uid())
  );
CREATE POLICY "Admins can manage order items" ON order_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Book Requests
CREATE POLICY "Users can view own book requests" ON book_requests
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create book requests" ON book_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage book requests" ON book_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Sell Requests
CREATE POLICY "Users can view own sell requests" ON sell_requests
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create sell requests" ON sell_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage sell requests" ON sell_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Site Settings (public read, admin write)
CREATE POLICY "Anyone can view site settings" ON site_settings
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage site settings" ON site_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Cart
CREATE POLICY "Users can manage own cart" ON cart
  FOR ALL USING (auth.uid() = user_id);

-- Wishlist
CREATE POLICY "Users can manage own wishlist" ON wishlist
  FOR ALL USING (auth.uid() = user_id);


-- =====================================================
-- STEP 3: Insert Demo Books
-- =====================================================

INSERT INTO books (title, author, category, sub_category, price, original_price, discount_tag, condition, stock_quantity, image_urls, isbn, publisher, edition, language, description, active, featured)
VALUES
  (
    'Concepts of Physics Vol. 1',
    'H.C. Verma',
    'Academic',
    'JEE Physics',
    220,
    499,
    '55% OFF',
    'Good',
    5,
    ARRAY['https://m.media-amazon.com/images/I/71c+YFRqIxL._AC_UF1000,1000_QL80_.jpg'],
    '978-8177091878',
    'Bharati Bhawan',
    '2023',
    'English',
    'The most recommended book for JEE Physics preparation. Covers mechanics, thermodynamics, and optics with detailed theory and solved examples.',
    true,
    true
  ),
  (
    'Organic Chemistry',
    'Morrison & Boyd',
    'Academic',
    'JEE Chemistry',
    350,
    799,
    '55% OFF',
    'Like New',
    3,
    ARRAY['https://m.media-amazon.com/images/I/91G7T0DyT9L._AC_UF1000,1000_QL80_.jpg'],
    '978-0136436690',
    'Pearson',
    '7th',
    'English',
    'The gold standard for organic chemistry. Essential for JEE Advanced and NEET preparation with comprehensive reaction mechanisms.',
    true,
    true
  ),
  (
    'Objective Mathematics',
    'R.D. Sharma',
    'Academic',
    'JEE Maths',
    280,
    650,
    '55% OFF',
    'Good',
    4,
    ARRAY['https://m.media-amazon.com/images/I/71+0KS2LhoL._AC_UF1000,1000_QL80_.jpg'],
    '978-9383182334',
    'Dhanpat Rai',
    '2024',
    'English',
    'Comprehensive mathematics book for JEE Mains & Advanced. Covers algebra, calculus, coordinate geometry with 5000+ practice problems.',
    true,
    true
  ),
  (
    'NCERT Biology Class 11 & 12 Combined',
    'NCERT',
    'Academic',
    'NEET Biology',
    180,
    350,
    '50% OFF',
    'Like New',
    8,
    ARRAY['https://m.media-amazon.com/images/I/81VJyXGDwCL._AC_UF1000,1000_QL80_.jpg'],
    '978-8174505316',
    'NCERT',
    '2024',
    'English',
    'The holy grail for NEET Biology. All 32 chapters from Class 11 & 12 NCERT combined. Condition verified, no markings.',
    true,
    true
  ),
  (
    'A Brief History of Time',
    'Stephen Hawking',
    'Fiction',
    'Science',
    199,
    450,
    '55% OFF',
    'Like New',
    6,
    ARRAY['https://m.media-amazon.com/images/I/51j1Y7dFqjL._AC_UF1000,1000_QL80_.jpg'],
    '978-0553380163',
    'Bantam Books',
    '2018',
    'English',
    'Stephen Hawking''s masterpiece on cosmology and theoretical physics. A must-read for science enthusiasts.',
    true,
    false
  ),
  (
    'Atomic Habits',
    'James Clear',
    'Self-Help',
    'Productivity',
    175,
    399,
    '55% OFF',
    'Good',
    10,
    ARRAY['https://m.media-amazon.com/images/I/91bYsX41DVL._AC_UF1000,1000_QL80_.jpg'],
    '978-0735211292',
    'Avery',
    '2018',
    'English',
    'The definitive guide to building good habits and breaking bad ones. #1 New York Times bestseller with over 10 million copies sold.',
    true,
    true
  )
ON CONFLICT DO NOTHING;


-- =====================================================
-- STEP 4: Insert Default Site Settings
-- =====================================================

INSERT INTO site_settings (key, value) VALUES
  ('whatsapp_number', '919382470919'),
  ('delivery_charge', '35'),
  ('free_delivery_above', '499'),
  ('banner_text', '📚 Up to 60% OFF on all books! Free delivery above ₹499'),
  ('maintenance_mode', 'false')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;


-- =====================================================
-- STEP 5: Insert Demo Hero Slides
-- =====================================================

INSERT INTO hero_slides (title, subtitle, cta_button_text, cta_link, background_color, image_url, sort_order, active)
VALUES
  (
    'Premium Books at Unbeatable Prices',
    'Up to 60% off on JEE, NEET, UPSC & more',
    'Browse Collection',
    '/books',
    '#0c1a3a',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&q=80',
    0,
    true
  ),
  (
    'Sell Your Old Books',
    'Get the best price for your pre-owned books',
    'Sell Now',
    '/books',
    '#1a1025',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80',
    1,
    true
  ),
  (
    'Free Delivery Above ₹499',
    'Order now and get books delivered to your doorstep',
    'Order Now',
    '/books',
    '#0d1f2d',
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&q=80',
    2,
    true
  )
ON CONFLICT DO NOTHING;


-- =====================================================
-- DONE! 
-- =====================================================
-- After running this SQL:
-- 1. Go to /admin/login
-- 2. Login with: kitaabkharido41@gmail.com / Kitaab@3176
-- 3. You'll have full admin access
-- =====================================================
