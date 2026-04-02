-- =============================================================================
-- KITAAB KHARIDO — Supabase Database Schema
-- Premium Second-Hand Book Marketplace for Indian Students
-- =============================================================================
-- This file contains the complete database setup including:
--   1. Tables
--   2. Functions & Triggers
--   3. Row-Level Security (RLS) Policies
--   4. Seed Data (site settings, hero slides, sample books)
--   5. Admin setup & deployment notes
--
-- Run this entire file in the Supabase SQL Editor.
-- =============================================================================


-- =============================================================================
-- SECTION 1: FUNCTIONS & TRIGGERS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Generic updated_at trigger function
-- Automatically sets updated_at = now() on every row update.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- Auto-create profile on new user signup
-- Reads metadata from auth.users.raw_user_meta_data to populate the profile.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, address, city, pincode, avatar_url, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    '',
    '',
    '',
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================================================
-- SECTION 2: TABLES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 2.1  profiles — extends auth.users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  phone       TEXT,
  address     TEXT,
  city        TEXT,
  pincode     TEXT,
  avatar_url  TEXT,
  is_admin    BOOLEAN     DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2.2  books — product catalogue
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.books (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT        NOT NULL,
  author          TEXT        NOT NULL,
  category        TEXT        NOT NULL CHECK (category IN ('Academic', 'Fiction', 'Self-Help', 'Others')),
  sub_category    TEXT,
  price           DECIMAL(10,2) NOT NULL,
  original_price  DECIMAL(10,2) NOT NULL,
  discount_tag    TEXT        DEFAULT NULL CHECK (discount_tag IS NULL OR discount_tag IN ('50% OFF', '60% OFF')),
  condition       TEXT        DEFAULT 'Good' CHECK ("condition" IN ('Like New', 'Good', 'Fair')),
  stock_quantity  INTEGER     DEFAULT 1,
  image_urls      TEXT[]      DEFAULT '{}',
  isbn            TEXT,
  publisher       TEXT,
  edition         TEXT,
  language        TEXT        DEFAULT 'English',
  description     TEXT,
  active          BOOLEAN     DEFAULT true,
  featured        BOOLEAN     DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2.3  hero_slides — homepage carousel
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT        NOT NULL,
  subtitle        TEXT,
  cta_button_text TEXT,
  cta_link        TEXT,
  background_color TEXT       DEFAULT '#060d1f',
  image_url       TEXT,
  sort_order      INTEGER     DEFAULT 0,
  active          BOOLEAN     DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2.4  cart — shopping cart
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cart (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id     UUID        NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  quantity    INTEGER     DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, book_id)
);

-- ---------------------------------------------------------------------------
-- 2.5  wishlist — saved books
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wishlist (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id     UUID        NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, book_id)
);

-- ---------------------------------------------------------------------------
-- 2.6  orders — purchase orders
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number      TEXT        NOT NULL UNIQUE,
  total_amount      DECIMAL(10,2) NOT NULL,
  delivery_charge   DECIMAL(10,2) DEFAULT 35.00,
  grand_total       DECIMAL(10,2) NOT NULL,
  payment_method    TEXT        DEFAULT 'whatsapp',
  payment_status    TEXT        DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  order_status      TEXT        DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled')),
  shipping_name     TEXT        NOT NULL,
  shipping_phone    TEXT        NOT NULL,
  shipping_address  TEXT        NOT NULL,
  shipping_city     TEXT        NOT NULL,
  shipping_pincode  TEXT        NOT NULL,
  tracking_url      TEXT,
  tracking_number   TEXT,
  admin_notes       TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2.7  order_items — line items for each order
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  book_id             UUID        NOT NULL REFERENCES books(id),
  book_title          TEXT        NOT NULL,
  book_author         TEXT,
  book_price          DECIMAL(10,2) NOT NULL,
  book_original_price DECIMAL(10,2),
  book_image_url      TEXT,
  quantity            INTEGER     DEFAULT 1,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2.8  book_requests — user book-request form submissions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.book_requests (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name   TEXT,
  user_email  TEXT,
  user_phone  TEXT,
  book_title  TEXT        NOT NULL,
  author      TEXT,
  category    TEXT,
  notes       TEXT,
  status      TEXT        DEFAULT 'pending' CHECK (status IN ('pending', 'found', 'not_available', 'fulfilled')),
  admin_reply TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2.9  sell_requests — user sell-book form submissions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sell_requests (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name       TEXT        NOT NULL,
  user_email      TEXT        NOT NULL,
  user_phone      TEXT,
  book_title      TEXT        NOT NULL,
  author          TEXT,
  category        TEXT,
  book_condition  TEXT        DEFAULT 'Good' CHECK (book_condition IN ('Like New', 'Good', 'Fair')),
  asking_price    DECIMAL(10,2),
  description     TEXT,
  status          TEXT        DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  offer_price     DECIMAL(10,2),
  admin_reply     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2.10 site_settings — key-value configuration store
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT        NOT NULL UNIQUE,
  value       TEXT,
  updated_at  TIMESTAMPTZ DEFAULT now()
);


-- =============================================================================
-- SECTION 3: TRIGGER ATTACHMENTS
-- Apply the update_updated_at() trigger to every table that has updated_at,
-- and attach the auto-profile-creation trigger to auth.users.
-- =============================================================================

-- updated_at triggers
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER hero_slides_updated_at
  BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER book_requests_updated_at
  BEFORE UPDATE ON public.book_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER sell_requests_updated_at
  BEFORE UPDATE ON public.sell_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on new user signup
-- Drop if exists first (safe re-run)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- =============================================================================
-- SECTION 4: ROW-LEVEL SECURITY (RLS)
-- Enable RLS on every table, then define granular policies.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 4.1  profiles
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admins can update any profile
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Service role can insert (for the handle_new_user trigger)
CREATE POLICY "profiles_insert_service_role" ON public.profiles
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 4.2  books
-- ---------------------------------------------------------------------------
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Public can read active books
CREATE POLICY "books_select_active" ON public.books
  FOR SELECT USING (active = true);

-- Admins can do everything
CREATE POLICY "books_admin_all" ON public.books
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ---------------------------------------------------------------------------
-- 4.3  hero_slides
-- ---------------------------------------------------------------------------
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Public can read active slides
CREATE POLICY "hero_slides_select_active" ON public.hero_slides
  FOR SELECT USING (active = true);

-- Admins can do everything
CREATE POLICY "hero_slides_admin_all" ON public.hero_slides
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ---------------------------------------------------------------------------
-- 4.4  cart
-- ---------------------------------------------------------------------------
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

-- Users can read their own cart
CREATE POLICY "cart_select_own" ON public.cart
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert to their own cart
CREATE POLICY "cart_insert_own" ON public.cart
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own cart items
CREATE POLICY "cart_delete_own" ON public.cart
  FOR DELETE USING (auth.uid() = user_id);

-- Users can update their own cart items
CREATE POLICY "cart_update_own" ON public.cart
  FOR UPDATE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4.5  wishlist
-- ---------------------------------------------------------------------------
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Users can read their own wishlist
CREATE POLICY "wishlist_select_own" ON public.wishlist
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert to their own wishlist
CREATE POLICY "wishlist_insert_own" ON public.wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own wishlist items
CREATE POLICY "wishlist_delete_own" ON public.wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4.6  orders
-- ---------------------------------------------------------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users can read their own orders
CREATE POLICY "orders_select_own" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can read all orders
CREATE POLICY "orders_select_admin" ON public.orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admins can update any order
CREATE POLICY "orders_update_admin" ON public.orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Service role can insert orders
CREATE POLICY "orders_insert_service_role" ON public.orders
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 4.7  order_items
-- ---------------------------------------------------------------------------
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Users can read items for their own orders
CREATE POLICY "order_items_select_own" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid())
  );

-- Admins can read all order items
CREATE POLICY "order_items_select_admin" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Service role can insert order items
CREATE POLICY "order_items_insert_service_role" ON public.order_items
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 4.8  book_requests
-- ---------------------------------------------------------------------------
ALTER TABLE public.book_requests ENABLE ROW LEVEL SECURITY;

-- Users can read their own requests
CREATE POLICY "book_requests_select_own" ON public.book_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own requests
CREATE POLICY "book_requests_insert_own" ON public.book_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own requests
CREATE POLICY "book_requests_update_own" ON public.book_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can read all requests
CREATE POLICY "book_requests_select_admin" ON public.book_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admins can update any request
CREATE POLICY "book_requests_update_admin" ON public.book_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ---------------------------------------------------------------------------
-- 4.9  sell_requests
-- ---------------------------------------------------------------------------
ALTER TABLE public.sell_requests ENABLE ROW LEVEL SECURITY;

-- Users can read their own requests
CREATE POLICY "sell_requests_select_own" ON public.sell_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own requests
CREATE POLICY "sell_requests_insert_own" ON public.sell_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own requests
CREATE POLICY "sell_requests_update_own" ON public.sell_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can read all requests
CREATE POLICY "sell_requests_select_admin" ON public.sell_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admins can update any request
CREATE POLICY "sell_requests_update_admin" ON public.sell_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ---------------------------------------------------------------------------
-- 4.10 site_settings
-- ---------------------------------------------------------------------------
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public can read all settings
CREATE POLICY "site_settings_select_public" ON public.site_settings
  FOR SELECT USING (true);

-- Admins can do everything
CREATE POLICY "site_settings_admin_all" ON public.site_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );


-- =============================================================================
-- SECTION 5: SEED DATA
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 5.1  Default site settings
-- ---------------------------------------------------------------------------
INSERT INTO public.site_settings (key, value) VALUES
  ('site_name',             'Kitaab Kharido'),
  ('tagline',               'Premium Second-Hand Books for Indian Students'),
  ('whatsapp_number',       '919382470919'),
  ('delivery_charge',       '35'),
  ('announcement_banner',   'Standard Delivery ₹35 | Condition Verified | WhatsApp Support | JEE • NEET • UPSC • CAT'),
  ('show_banner',           'true'),
  ('phonepe_enabled',       'false'),
  ('maintenance_mode',      'false')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5.2  Default hero slides
-- ---------------------------------------------------------------------------
INSERT INTO public.hero_slides (title, subtitle, cta_button_text, cta_link, background_color, sort_order, active) VALUES
  (
    'Your Exam Prep Starts Here',
    'Premium second-hand books for JEE, NEET, UPSC & more — up to 60% off',
    'Browse Books',
    '/books',
    '#0f172a',
    1,
    true
  ),
  (
    'Sell Your Old Books',
    'Clear your shelf, fill your wallet. List your books in minutes.',
    'Sell Now',
    '#sell-modal',
    '#1e1b4b',
    2,
    true
  ),
  (
    'Can''t Find a Book?',
    'Tell us what you need and we''ll source it for you',
    'Request a Book',
    '#request-modal',
    '#14532d',
    3,
    true
  );

-- ---------------------------------------------------------------------------
-- 5.3  Sample books (8 entries across multiple categories)
-- ---------------------------------------------------------------------------
INSERT INTO public.books (
  title,
  author,
  category,
  sub_category,
  price,
  original_price,
  discount_tag,
  "condition",
  stock_quantity,
  image_urls,
  isbn,
  publisher,
  edition,
  language,
  description,
  active,
  featured
) VALUES
  (
    'Organic Chemistry by Morrison & Boyd',
    'Morrison & Boyd',
    'Academic',
    'Chemistry/JEE',
    250.00,
    650.00,
    '60% OFF',
    'Like New',
    5,
    ARRAY['https://placehold.co/300x400/1e293b/f59e0b?text=Organic+Chemistry'],
    '978-0136436690',
    'Pearson Education',
    '7th Edition',
    'English',
    'The gold standard textbook for organic chemistry, widely used for JEE preparation. Covers reaction mechanisms, stereochemistry, spectroscopy, and more with exceptional clarity.',
    true,
    true
  ),
  (
    'HC Verma - Concepts of Physics Vol 1',
    'HC Verma',
    'Academic',
    'Physics/JEE',
    180.00,
    450.00,
    '60% OFF',
    'Good',
    8,
    ARRAY['https://placehold.co/300x400/1e293b/f59e0b?text=HC+Verma+Vol+1'],
    '978-8177091878',
    'Bharati Bhawan Publishers',
    '2022 Edition',
    'English',
    'Comprehensive physics textbook covering mechanics, thermodynamics, optics, and waves. Essential for JEE Main & Advanced preparation with solved examples and practice problems.',
    true,
    true
  ),
  (
    'NCERT Biology Class 11 & 12 Set',
    'NCERT',
    'Academic',
    'Biology/NEET',
    150.00,
    400.00,
    '60% OFF',
    'Good',
    10,
    ARRAY['https://placehold.co/300x400/1e293b/f59e0b?text=NCERT+Biology+Set'],
    NULL,
    'NCERT',
    'Latest Edition',
    'English',
    'Complete set of NCERT Biology textbooks for Class 11 and 12. The most important books for NEET preparation covering botany and zoology in detail.',
    true,
    true
  ),
  (
    'Objective Mathematics by RD Sharma',
    'RD Sharma',
    'Academic',
    'Mathematics/JEE',
    280.00,
    600.00,
    '50% OFF',
    'Like New',
    4,
    ARRAY['https://placehold.co/300x400/1e293b/f59e0b?text=RD+Sharma+Maths'],
    NULL,
    'Dhanpat Rai Publications',
    'Latest Edition',
    'English',
    'One of the most popular books for JEE Mathematics preparation. Features a vast collection of objective-type questions with detailed solutions.',
    true,
    false
  ),
  (
    'The Psychology of Money',
    'Morgan Housel',
    'Self-Help',
    NULL,
    120.00,
    350.00,
    '60% OFF',
    'Like New',
    6,
    ARRAY['https://placehold.co/300x400/1e293b/f59e0b?text=Psychology+of+Money'],
    '978-9390166268',
    'Jaico Publishing House',
    '1st Edition',
    'English',
    'Timeless lessons on wealth, greed, and happiness. An international bestseller that explores the strange ways people think about money and teaches you to make better financial decisions.',
    true,
    true
  ),
  (
    'Atomic Habits',
    'James Clear',
    'Self-Help',
    NULL,
    140.00,
    399.00,
    '60% OFF',
    'Good',
    7,
    ARRAY['https://placehold.co/300x400/1e293b/f59e0b?text=Atomic+Habits'],
    '978-1847941834',
    'Avery',
    '1st Edition',
    'English',
    'A revolutionary system to get 1 percent better every day. Learn how tiny changes in behaviour can lead to remarkable results over time. A must-read for personal development.',
    true,
    true
  ),
  (
    '11th Hour CFA Level 1',
    'Various Authors',
    'Academic',
    'Finance/CFA',
    200.00,
    500.00,
    '60% OFF',
    'Good',
    3,
    ARRAY['https://placehold.co/300x400/1e293b/f59e0b?text=11th+Hour+CFA'],
    NULL,
    'Wiley',
    '2023 Edition',
    'English',
    'Last-minute revision guide for CFA Level 1 exam. Condensed summaries of all Learning Outcome Statements with practice questions and exam tips.',
    true,
    false
  ),
  (
    'Wren & Martin - High School English Grammar',
    'P.C. Wren & H. Martin',
    'Academic',
    'English',
    100.00,
    295.00,
    '60% OFF',
    'Fair',
    12,
    ARRAY['https://placehold.co/300x400/1e293b/f59e0b?text=Wren+Martin'],
    NULL,
    'S. Chand & Co.',
    'Revised Edition',
    'English',
    'The most popular English grammar reference book used across Indian schools and competitive exams. Covers grammar, composition, and usage with plenty of exercises.',
    true,
    false
  );


-- =============================================================================
-- SECTION 6: INDEXES (performance optimisation)
-- =============================================================================

-- Books: frequent lookups by category, condition, and active status
CREATE INDEX IF NOT EXISTS idx_books_category ON public.books (category);
CREATE INDEX IF NOT EXISTS idx_books_condition ON public.books ("condition");
CREATE INDEX IF NOT EXISTS idx_books_active ON public.books (active);
CREATE INDEX IF NOT EXISTS idx_books_featured ON public.books (featured);
CREATE INDEX IF NOT EXISTS idx_books_title_trgm ON public.books USING gin (title gin_trgm_ops);

-- Cart & Wishlist: user lookups
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON public.cart (user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist (user_id);

-- Orders: user and status lookups
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (order_status);

-- Order items: order lookups
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);

-- Book requests & Sell requests: user and status lookups
CREATE INDEX IF NOT EXISTS idx_book_requests_user_id ON public.book_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_book_requests_status ON public.book_requests (status);
CREATE INDEX IF NOT EXISTS idx_sell_requests_user_id ON public.sell_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_sell_requests_status ON public.sell_requests (status);

-- Hero slides: sort order
CREATE INDEX IF NOT EXISTS idx_hero_slides_sort_order ON public.hero_slides (sort_order);


-- =============================================================================
-- SECTION 7: ADMIN SETUP
-- =============================================================================

-- To make a user an admin, run:
-- UPDATE profiles SET is_admin = true WHERE id = '<USER_UUID>';


-- =============================================================================
-- DEPLOYMENT NOTES
-- =============================================================================
--
-- 1. STORAGE BUCKET — book-images
--    --------------------------------
--    In the Supabase Dashboard, go to Storage and create a new bucket called
--    `book-images`.  Set it to **Public** so that uploaded book cover images
--    can be read without authentication.  Then add a policy:
--
--      - Allow SELECT for all (public read)
--      - Allow INSERT for authenticated users (or admins only, as preferred)
--      - Allow UPDATE and DELETE for admins
--
-- 2. GOOGLE OAUTH SETUP
--    --------------------
--    Go to Authentication → Providers → Google in the Supabase Dashboard.
--    Enable Google and enter your OAuth 2.0 Client ID and Secret from the
--    Google Cloud Console.  Set the redirect URL in Google Cloud Console to:
--
--      https://hqwmobnsxsefkcbsvzon.supabase.co/auth/v1/callback
--
-- 3. REQUIRED ENVIRONMENT VARIABLES
--    -------------------------------
--    Add the following to your .env.local (or equivalent environment):
--
--      NEXT_PUBLIC_SUPABASE_URL=https://hqwmobnsxsefkcbsvzon.supabase.co
--      NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
--      SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
--
--    The anon key and service-role key can be found in the Supabase Dashboard
--    under Settings → API.
--
-- 4. OPTIONAL — Enable pg_trgm for search
--    ---------------------------------------
--    The full-text search index on books.title uses pg_trgm. If it is not
--    already enabled, run:
--
--      CREATE EXTENSION IF NOT EXISTS pg_trgm;
--
--    This should be run before the index creation above. If the extension is
--    not available on your Supabase plan, you can safely remove that single
--    index line — the rest of the schema will work without it.
--
-- =============================================================================
