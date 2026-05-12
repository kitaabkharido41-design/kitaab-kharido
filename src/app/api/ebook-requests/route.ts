import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Helper: try to create table via Supabase REST (will fail gracefully if table exists)
async function ensureTableExists(supabase: Awaited<ReturnType<typeof createAdminClient>>): Promise<boolean> {
  try {
    // Try a simple select to check if table exists
    const { error } = await supabase.from('ebook_requests').select('id').limit(1)
    if (!error) return true // Table exists
    
    // If table doesn't exist, return false - user must create it manually
    if (error.code === 'PGRST205' || error.code === '42P01') {
      return false
    }
    return true // Some other error, table might exist
  } catch {
    return false
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

    if (!book_title || !book_title.trim()) {
      return NextResponse.json(
        { error: 'Book title is required' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // Check if table exists first
    const tableExists = await ensureTableExists(supabase)
    if (!tableExists) {
      return NextResponse.json(
        {
          error: 'TABLE_MISSING',
          message: 'Ebook requests feature is being set up. Please try again in a few minutes or contact support.',
        },
        { status: 503 }
      )
    }

    const { data, error } = await supabase
      .from('ebook_requests')
      .insert({
        user_name: user_name?.trim() || null,
        user_email: user_email?.trim() || null,
        book_title: book_title.trim(),
        author: author?.trim() || null,
        category: category?.trim() || null,
        notes: notes?.trim() || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create ebook request', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { data, message: 'Ebook request submitted successfully!' },
      { status: 201 }
    )
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    )
  }
}
