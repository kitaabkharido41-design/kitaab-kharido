import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/admin/cleanup
 * One-time cleanup: delete duplicate books (keep newest by created_at, delete older duplicates with same title).
 * Uses admin client (service role key) to bypass RLS.
 */
export async function GET() {
  try {
    const supabase = await createAdminClient()

    // 1. Fetch all books ordered by title and created_at
    const { data: books, error } = await supabase
      .from('books')
      .select('id, title, created_at')
      .order('title', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch books for cleanup:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!books || books.length === 0) {
      return NextResponse.json({ message: 'No books to clean up', deleted: 0 })
    }

    // 2. Find duplicates: group by title (case-insensitive), keep newest, collect older IDs
    const seen = new Map<string, string>() // lowercase title -> kept id
    const toDelete: string[] = []

    for (const book of books) {
      const key = book.title.toLowerCase().trim()
      if (seen.has(key)) {
        // This is a duplicate — mark for deletion
        toDelete.push(book.id)
      } else {
        // First occurrence — keep it
        seen.set(key, book.id)
      }
    }

    // 3. Delete duplicates
    let deletedCount = 0
    if (toDelete.length > 0) {
      // Delete in batches of 100 to avoid URL length issues
      const batchSize = 100
      for (let i = 0; i < toDelete.length; i += batchSize) {
        const batch = toDelete.slice(i, i + batchSize)
        const { error: deleteError } = await supabase
          .from('books')
          .delete()
          .in('id', batch)

        if (deleteError) {
          console.error(`Failed to delete batch starting at ${i}:`, deleteError.message)
        } else {
          deletedCount += batch.length
        }
      }
    }

    return NextResponse.json({
      message: 'Cleanup complete',
      totalBooks: books.length,
      uniqueBooks: seen.size,
      deleted: deletedCount,
    })
  } catch (err) {
    console.error('Cleanup error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
