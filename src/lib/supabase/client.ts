import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hqwmobnsxsefkcbsvzon.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhxd21vYm5zeHNlZmtjYnN2em9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NDM1ODYsImV4cCI6MjA5MDQxOTU4Nn0.4dlPT0iwUWzIhXZfh97GMnNM3KouWPAzAlGmTmFsY8s'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
