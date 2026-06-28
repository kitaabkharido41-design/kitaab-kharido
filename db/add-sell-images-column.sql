-- Add image_urls column to public.sell_requests table
ALTER TABLE public.sell_requests ADD COLUMN IF NOT EXISTS image_urls TEXT[];
