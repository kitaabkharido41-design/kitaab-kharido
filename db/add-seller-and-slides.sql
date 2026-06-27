-- =============================================================================
-- KITAAB KHARIDO — Database Schema Upgrade
-- 1. Add Seller Details to Books Table
-- 2. Insert Promotional Hero Slides
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Alter Books Table (Add Seller Columns)
-- ---------------------------------------------------------------------------
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS seller_name TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS seller_email TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS seller_phone TEXT;

-- ---------------------------------------------------------------------------
-- 2. Insert New Promotional Hero Slides
-- ---------------------------------------------------------------------------

-- Slide promoting old books as "gems"
INSERT INTO public.hero_slides (title, subtitle, cta_button_text, cta_link, background_color, sort_order, active) VALUES
  (
    'Old Books are Hidden Gems!',
    'Save up to 60% on premium condition academic and exam prep books. Quality verified by us.',
    'Browse Gems',
    '/books',
    '#0b1329',
    4,
    true
  )
ON CONFLICT DO NOTHING;

-- Slide promoting book selling
INSERT INTO public.hero_slides (title, subtitle, cta_button_text, cta_link, background_color, sort_order, active) VALUES
  (
    'Sell & Clear Your Shelf',
    'Finished with your exams? Help another student and make some cash by listing your books in minutes.',
    'Sell a Book',
    '#sell-modal',
    '#001a1c',
    5,
    true
  )
ON CONFLICT DO NOTHING;

-- Slide promoting academic books
INSERT INTO public.hero_slides (title, subtitle, cta_button_text, cta_link, background_color, sort_order, active) VALUES
  (
    'New Arrivals Added Daily',
    'Explore the latest collections of JEE, NEET, UPSC, and GATE books at the lowest prices.',
    'Explore Categories',
    '/books',
    '#220901',
    6,
    true
  )
ON CONFLICT DO NOTHING;
