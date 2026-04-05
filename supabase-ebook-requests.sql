-- Kitaab Kharido: Ebook Requests Table
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

CREATE TABLE IF NOT EXISTS ebook_requests (
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
);

-- Enable Row Level Security
ALTER TABLE ebook_requests ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
CREATE POLICY "Service role can do everything on ebook_requests"
  ON ebook_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anon to insert (for user requests)
CREATE POLICY "Anyone can insert ebook requests"
  ON ebook_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anon to read (optional, if you want public listing)
CREATE POLICY "Anyone can read ebook requests"
  ON ebook_requests
  FOR SELECT
  TO anon
  USING (true);
