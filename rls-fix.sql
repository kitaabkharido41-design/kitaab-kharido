-- =============================================================================
-- KITAAB KHARIDO — RLS FIX (Run this ENTIRE block in Supabase SQL Editor)
-- =============================================================================

-- STEP 1: Create a helper function that bypasses RLS for admin checks
-- SECURITY DEFINER runs as table owner, so it bypasses RLS → no recursion
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- STEP 2: Drop ALL existing policies on ALL tables to start clean
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT DISTINCT policyname FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t, 
      (SELECT tablename FROM pg_policies WHERE policyname = t AND schemaname = 'public' LIMIT 1));
  END LOOP;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Also drop from auth schema if any
DO $$ BEGIN
  DROP POLICY IF EXISTS "service_role can do everything" ON auth.users;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- STEP 3: Profiles — clean non-recursive policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can read all profiles (uses helper function, no recursion)
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (public.is_admin_user());

-- Admins can update any profile
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (public.is_admin_user());

-- Service role can insert (for triggers)
CREATE POLICY "profiles_insert_service" ON public.profiles
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- STEP 4: Books
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "books_select_public" ON public.books
  FOR SELECT USING (active = true);

CREATE POLICY "books_admin_all" ON public.books
  FOR ALL USING (public.is_admin_user());

-- STEP 5: Hero slides
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hero_slides_select_public" ON public.hero_slides
  FOR SELECT USING (active = true);

CREATE POLICY "hero_slides_admin_all" ON public.hero_slides
  FOR ALL USING (public.is_admin_user());

-- STEP 6: Cart
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cart_select_own" ON public.cart
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cart_insert_own" ON public.cart
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cart_update_own" ON public.cart
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cart_delete_own" ON public.cart
  FOR DELETE USING (auth.uid() = user_id);

-- STEP 7: Wishlist
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wishlist_select_own" ON public.wishlist
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wishlist_insert_own" ON public.wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wishlist_delete_own" ON public.wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- STEP 8: Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_own" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "orders_insert_own" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_select_admin" ON public.orders
  FOR SELECT USING (public.is_admin_user());
CREATE POLICY "orders_update_admin" ON public.orders
  FOR UPDATE USING (public.is_admin_user());
CREATE POLICY "orders_insert_service" ON public.orders
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- STEP 9: Order items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_select_own" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid())
  );
CREATE POLICY "order_items_select_admin" ON public.order_items
  FOR SELECT USING (public.is_admin_user());
CREATE POLICY "order_items_insert_own" ON public.order_items
  FOR INSERT WITH CHECK (true);
CREATE POLICY "order_items_insert_service" ON public.order_items
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- STEP 10: Book requests
ALTER TABLE public.book_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "book_requests_select_own" ON public.book_requests
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "book_requests_insert_own" ON public.book_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "book_requests_update_own" ON public.book_requests
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "book_requests_select_admin" ON public.book_requests
  FOR SELECT USING (public.is_admin_user());
CREATE POLICY "book_requests_update_admin" ON public.book_requests
  FOR UPDATE USING (public.is_admin_user());

-- STEP 11: Sell requests
ALTER TABLE public.sell_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sell_requests_select_own" ON public.sell_requests
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sell_requests_insert_own" ON public.sell_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sell_requests_update_own" ON public.sell_requests
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sell_requests_select_admin" ON public.sell_requests
  FOR SELECT USING (public.is_admin_user());
CREATE POLICY "sell_requests_update_admin" ON public.sell_requests
  FOR UPDATE USING (public.is_admin_user());

-- STEP 12: Site settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings_select_public" ON public.site_settings
  FOR SELECT USING (true);
CREATE POLICY "site_settings_admin_all" ON public.site_settings
  FOR ALL USING (public.is_admin_user());

-- STEP 13: Ensure admin profile is correct
INSERT INTO public.profiles (id, full_name, is_admin)
VALUES ('06585517-b6a2-438c-b26d-dbfb1a0cbba5', 'Adarsh Gupta', true)
ON CONFLICT (id) DO UPDATE SET is_admin = true, full_name = 'Adarsh Gupta';

-- STEP 14: Insert demo books if they don't exist
INSERT INTO public.books (title, author, category, sub_category, price, original_price, discount_tag, "condition", stock_quantity, image_urls, isbn, publisher, edition, language, description, active, featured) VALUES
  ('Concepts of Physics Vol. 1', 'H.C. Verma', 'Academic', 'JEE Physics', 220, 499, '55% OFF', 'Good', 5, ARRAY['https://placehold.co/300x400/1e293b/f59e0b?text=HC+Verma+Vol1'], '978-8177091878', 'Bharati Bhawan', '2023', 'English', 'The most recommended book for JEE Physics preparation. Covers mechanics, thermodynamics, and optics.', true, true),
  ('Organic Chemistry', 'Morrison & Boyd', 'Academic', 'JEE Chemistry', 350, 799, '55% OFF', 'Like New', 3, ARRAY['https://placehold.co/300x400/1e293b/f59e0b?text=Organic+Chem'], '978-0136436690', 'Pearson', '7th', 'English', 'The gold standard for organic chemistry. Essential for JEE Advanced and NEET.', true, true),
  ('Objective Mathematics', 'R.D. Sharma', 'Academic', 'JEE Maths', 280, 650, '55% OFF', 'Good', 4, ARRAY['https://placehold.co/300x400/1e293b/f59e0b?text=RD+Sharma'], '978-9383182334', 'Dhanpat Rai', '2024', 'English', 'Comprehensive mathematics book for JEE with 5000+ practice problems.', true, true)
ON CONFLICT DO NOTHING;

-- STEP 15: Verify
SELECT 'Admin profile:' as info, id, full_name, is_admin FROM public.profiles WHERE id = '06585517-b6a2-438c-b26d-dbfb1a0cbba5'
UNION ALL
SELECT 'Book count: ' || count(*)::text, '', '', false FROM public.books WHERE active = true;
