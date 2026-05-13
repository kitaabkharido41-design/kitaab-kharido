-- ============================================
-- KITAAB KHARIDO: Ebook Requests Table
-- Run this in Supabase Dashboard -> SQL Editor
-- ============================================

-- Step 1: Create the table
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

-- Step 2: Enable Row Level Security
ALTER TABLE ebook_requests ENABLE ROW LEVEL SECURITY;

-- Step 3: Allow anyone to insert ebook requests
CREATE POLICY "Anyone can insert ebook requests"
ON ebook_requests
FOR INSERT
WITH CHECK (true);

-- Step 4: Allow anyone to read ebook requests
CREATE POLICY "Anyone can read ebook requests"
ON ebook_requests
FOR SELECT
USING (true);

-- Step 5: Allow anyone to update ebook requests
CREATE POLICY "Anyone can update ebook requests"
ON ebook_requests
FOR UPDATE
USING (true)
WITH CHECK (true);
