import { BooksClient } from './books-client'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import type { Book } from '@/lib/supabase/types'

// Cache the static page on Vercel's edge network for 10 minutes (ISR)
export const revalidate = 600

export const metadata: Metadata = {
  title: 'Browse Books — KitaabKharido',
  description: 'Browse our collection of affordable second-hand books for JEE, NEET, UPSC, CAT, GATE and more.',
}

export default async function BooksPage() {
  let books: Book[] = []
  try {
    const supabase = await createAdminClient()
    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('active', true)
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
    if (data) books = data as Book[]
  } catch (err) {
    console.error('Failed to fetch books on server:', err)
  }

  return <BooksClient initialBooks={books} />
}
