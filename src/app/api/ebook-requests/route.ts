import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/ebook-requests
 * Create a new ebook request.
 * Uses admin client (service role key) to bypass RLS.
 * Falls back to book_requests table if ebook_requests doesn't exist.
 */
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

    // Try inserting into ebook_requests table first
    const { data: inserted, error } = await supabase
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

    if (!error) {
      return NextResponse.json(
        { data: inserted, message: 'Ebook request submitted successfully! We will send it to you for free.' },
        { status: 201 }
      )
    }

    // If ebook_requests table doesn't exist, fall back to book_requests
    const isTableMissing =
      error.code === '42P01' ||
      error.message?.includes('does not exist') ||
      error.message?.includes('relation') ||
      error.message?.includes('not found')

    if (isTableMissing) {
      console.log('[ebook-requests] ebook_requests table not found, falling back to book_requests')

      const { data: fallbackData, error: fallbackError } = await supabase
        .from('book_requests')
        .insert({
          user_id: null,
          user_name: user_name?.trim() || null,
          user_email: user_email.trim(),
          user_phone: null,
          book_title: book_title.trim(),
          author: author?.trim() || null,
          category: category ? `Ebook - ${category}` : 'Ebook',
          notes: notes ? `[EBOOK REQUEST] ${notes}` : '[EBOOK REQUEST]',
        })
        .select()
        .single()

      if (fallbackError) {
        console.error('[ebook-requests] Fallback to book_requests also failed:', fallbackError)
        return NextResponse.json(
          {
            error: 'Failed to submit request. Please run the ebook_requests SQL table first, or WhatsApp us at +91 93824 70919.',
            details: fallbackError.message
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { data: fallbackData, message: 'Ebook request submitted successfully! We will send it to you for free.' },
        { status: 201 }
      )
    }

    // Some other error from ebook_requests insert
    console.error('[ebook-requests] Insert error:', error)
    return NextResponse.json(
      {
        error: 'Failed to submit ebook request. Please WhatsApp us at +91 93824 70919 for help.',
        details: error.message
      },
      { status: 500 }
    )
  } catch (err: any) {
    console.error('[ebook-requests] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error. Please WhatsApp us at +91 93824 70919 for help.', details: err.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ebook-requests
 * Return all ebook requests (for admin dashboard).
 */
export async function GET() {
  try {
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from('ebook_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      // If table doesn't exist, return empty list
      const isTableMissing =
        error.code === '42P01' ||
        error.message?.includes('does not exist') ||
        error.message?.includes('relation')

      if (isTableMissing) {
        return NextResponse.json({ data: [] })
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
