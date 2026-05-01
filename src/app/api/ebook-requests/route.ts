import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Helper: check if ebook_requests table exists
async function ensureTableExists(supabase: Awaited<ReturnType<typeof createAdminClient>>): Promise<{ exists: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('ebook_requests').select('id').limit(1)
    if (!error) return { exists: true }

    // Table doesn't exist - specific error codes
    if (error.code === 'PGRST205' || error.code === '42P01') {
      return { exists: false, error: error.message }
    }

    // RLS might be blocking, but table could exist
    // If it's an RLS error, the table exists but we can't read it - try insert approach
    if (error.message?.includes('policy') || error.message?.includes('RLS') || error.code === '42501') {
      return { exists: true }
    }

    // For other errors, the table likely exists but there might be permission issues
    // Don't block the request - let the actual insert fail if there's a real problem
    return { exists: true }
  } catch {
    return { exists: false, error: 'Could not verify table existence' }
  }
}

// GET: Return all ebook requests (for admin)
export async function GET() {
  try {
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from('ebook_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return NextResponse.json(
          {
            error: 'TABLE_MISSING',
            message: 'The ebook_requests table needs to be created. Go to Supabase SQL Editor and run the SQL below.',
            sql: [
              'CREATE TABLE IF NOT EXISTS ebook_requests (',
              '  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,',
              '  user_name TEXT,',
              '  user_email TEXT,',
              '  book_title TEXT NOT NULL,',
              '  author TEXT,',
              '  category TEXT,',
              '  notes TEXT,',
              '  status TEXT DEFAULT \'pending\',',
              '  admin_reply TEXT,',
              '  ebook_url TEXT,',
              '  created_at TIMESTAMPTZ DEFAULT now(),',
              '  updated_at TIMESTAMPTZ DEFAULT now()',
              ');',
            ].join('\n'),
          },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to fetch ebook requests', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    )
  }
}

// POST: Create a new ebook request (for users)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_name, user_email, book_title, author, category, notes } = body

    // Validate required fields
    if (!book_title || !book_title.trim()) {
      return NextResponse.json(
        { error: 'Book title is required' },
        { status: 400 }
      )
    }

    if (!user_email || !user_email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(user_email.trim())) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // Check if table exists first before attempting insert
    const tableCheck = await ensureTableExists(supabase)
    if (!tableCheck.exists) {
      return NextResponse.json(
        {
          error: 'TABLE_MISSING',
          message: 'Ebook requests feature is being set up. Please try again in a few minutes or contact us on WhatsApp at +91 93824 70919.',
        },
        { status: 503 }
      )
    }

    // Check for duplicate requests (same email + book title within last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: existing, error: checkError } = await supabase
      .from('ebook_requests')
      .select('id')
      .eq('user_email', user_email.trim())
      .eq('book_title', book_title.trim())
      .gte('created_at', twentyFourHoursAgo)
      .limit(1)

    if (!checkError && existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'You have already requested this ebook recently. We will process your request soon!' },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from('ebook_requests')
      .insert({
        user_name: user_name?.trim() || null,
        user_email: user_email.trim(),
        book_title: book_title.trim(),
        author: author?.trim() || null,
        category: category?.trim() || null,
        notes: notes?.trim() || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Ebook request insert error:', error)

      // Handle specific database errors
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return NextResponse.json(
          {
            error: 'TABLE_MISSING',
            message: 'Ebook requests feature is being set up. Please try again in a few minutes or contact us on WhatsApp at +91 93824 70919.',
          },
          { status: 503 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create ebook request', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { data, message: 'Ebook request submitted successfully! We will send it to you for free.' },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('Ebook request error:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    )
  }
}
