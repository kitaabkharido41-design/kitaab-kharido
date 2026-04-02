'use client'

import { BookX } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { BookCard } from '@/components/features/book-card'
import type { Book } from '@/lib/supabase/types'

interface BookGridProps {
  books: Book[]
  loading?: boolean
}

function BookCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-white/5 bg-navy-card">
      {/* Image skeleton */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-navy-light">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
      {/* Info skeleton */}
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/3 rounded" />
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <Skeleton className="h-5 w-16 rounded" />
          <Skeleton className="h-3 w-12 rounded" />
        </div>
      </div>
      {/* Buttons skeleton */}
      <div className="flex gap-2 border-t border-white/5 p-3 pt-2">
        <Skeleton className="h-9 flex-1 rounded-md" />
        <Skeleton className="h-9 flex-1 rounded-md" />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-light">
        <BookX className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-white">No books found</h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your search or filters to find what you&apos;re looking for.
        </p>
      </div>
    </div>
  )
}

export function BookGrid({ books, loading = false }: BookGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <BookCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!books || books.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-6">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  )
}
