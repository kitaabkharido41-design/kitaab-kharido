import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET: Return all ebook requests (for admin)
export async function GET() {
  try {
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from('ebook_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      // If the table doesn't exist, provide a helpful error
      if (error.code === '42P01') {
        return NextResponse.json(
          {
            error:
              'The ebook_requests table does not exist. Please create it in Supabase SQL Editor with the following schema:\n\n' +
              'CREATE TABLE ebook_requests (\n' +
              '  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n' +
              '  user_name TEXT,\n' +
              '  user_email TEXT,\n' +
              '  book_title TEXT NOT NULL,\n' +
              '  author TEXT,\n' +
              '  category TEXT,\n' +
              '  notes TEXT,\n' +
              '  status TEXT DEFAULT \'pending\',\n' +
              '  admin_reply TEXT,\n' +
              '  ebook_url TEXT,\n' +
              '  created_at TIMESTAMPTZ DEFAULT now(),\n' +
              '  updated_at TIMESTAMPTZ DEFAULT now()\n' +
              ');',
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
      // If the table doesn't exist, provide a helpful error
      if (error.code === '42P01') {
        return NextResponse.json(
          {
            error:
              'The ebook_requests table does not exist yet. It needs to be created in Supabase. Please contact the administrator.',
          },
          { status: 400 }
        )
      }
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
