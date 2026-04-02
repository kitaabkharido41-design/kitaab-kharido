import { BooksClient } from './books-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Browse Books — KitaabKharido',
  description: 'Browse our collection of premium second-hand books for JEE, NEET, UPSC, CAT, GATE and more.',
}

export default function BooksPage() {
  return <BooksClient />
}
