import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Helper: try to insert into ebook_requests, fall back to book_requests if table missing
async function insertEbookRequest(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  data: {
    user_name: string | null
    user_email: string
    book_title: string
    author: string | null
    category: string | null
    notes: string | null
  }
): Promise<{ success: boolean; data?: any; error?: string; usedFallback?: boolean }> {
  // Try ebook_requests table first
  const { data: inserted, error } = await supabase
    .from('ebook_requests')
    .insert({
      user_name: data.user_name,
      user_email: data.user_email,
      book_title: data.book_title,
      author: data.author,
      category: data.category,
      notes: data.notes,
      status: 'pending',
    })
    .select()
    .single()

  if (!error) {
    return { success: true, data: inserted, usedFallback: false }
  }

  // If table doesn't exist, fall back to book_requests table
  if (error.code === 'PGRST205' || error.code === '42P01' || error.message?.includes('does not exist')) {
    console.log('[ebook-requests] ebook_requests table not found, falling back to book_requests')

    const { data: fallbackData, error: fallbackError } = await supabase
      .from('book_requests')
      .insert({
        user_id: null,
        user_name: data.user_name,
        user_email: data.user_email,
        user_phone: null,
        book_title: data.book_title,
        author: data.author,
        category: data.category ? `Ebook - ${data.category}` : 'Ebook',
        notes: data.notes ? `[EBOOK REQUEST] ${data.notes}` : '[EBOOK REQUEST]',
      })
      .select()
      .single()

    if (fallbackError) {
      console.error('[ebook-requests] Fallback insert also failed:', fallbackError)
      return { success: false, error: fallbackError.message }
    }

    return { success: true, data: fallbackData, usedFallback: true }
  }

  // Some other error
  console.error('[ebook-requests] Insert error:', error)
  return { success: false, error: error.message }
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
        // Table doesn't exist yet - return empty list instead of error
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

    // Try inserting directly - the helper handles table-missing fallback
    const result = await insertEbookRequest(supabase, {
      user_name: user_name?.trim() || null,
      user_email: user_email.trim(),
      book_title: book_title.trim(),
      author: author?.trim() || null,
      category: category?.trim() || null,
      notes: notes?.trim() || null,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to submit ebook request. Please try again or contact us on WhatsApp at +91 93824 70919.', details: result.error },
        { status: 500 }
      )
    }

    if (result.usedFallback) {
      console.log('[ebook-requests] Request stored in book_requests as fallback. Run ebook_requests SQL to create the dedicated table.')
    }

    return NextResponse.json(
      { data: result.data, message: 'Ebook request submitted successfully! We will send it to you for free.' },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('[ebook-requests] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error. Please WhatsApp us at +91 93824 70919 for help.', details: err.message },
      { status: 500 }
    )
  }
}
