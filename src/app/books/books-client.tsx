'use client'

import { useState, useEffect, useMemo } from 'react'
import { BookGrid } from '@/components/features/book-grid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, SlidersHorizontal, X, BookOpen, Loader2 } from 'lucide-react'
import type { Book } from '@/lib/supabase/types'

const CATEGORIES = ['All', 'Academic', 'Fiction', 'Self-Help', 'Others']
const CONDITIONS = ['All', 'Like New', 'Good', 'Fair']
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'title', label: 'Title A-Z' },
] as const

export function BooksClient() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [condition, setCondition] = useState('All')
  const [sort, setSort] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetch('/api/books')
      .then((r) => r.json())
      .then((res) => {
        setBooks(res.books || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Count active filters
  const hasActiveFilters = search !== '' || category !== 'All' || condition !== 'All'
  const activeFilterCount = [search !== '' ? 1 : 0, category !== 'All' ? 1 : 0, condition !== 'All' ? 1 : 0].reduce((a, b) => a + b, 0)

  // Filter and sort books (before early return to satisfy rules-of-hooks)
  const filteredBooks = useMemo(() => {
    const filtered = books.filter((book) => {
      if (
        search &&
        !book.title.toLowerCase().includes(search.toLowerCase()) &&
        !book.author.toLowerCase().includes(search.toLowerCase())
      )
        return false
      if (category !== 'All' && book.category !== category) return false
      if (condition !== 'All' && book.condition !== condition) return false
      return true
    })

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'price_asc':
          return Number(a.price) - Number(b.price)
        case 'price_desc':
          return Number(b.price) - Number(a.price)
        case 'title':
          return a.title.localeCompare(b.title)
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
      }
    })
  }, [books, search, category, condition, sort])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="size-8 text-amber animate-spin mx-auto mb-4" />
          <p className="text-white/50">Loading books...</p>
        </div>
      </div>
    )
  }

  const clearAllFilters = () => {
    setSearch('')
    setCategory('All')
    setCondition('All')
    setSort('newest')
  }

  const removeFilter = (type: 'search' | 'category' | 'condition') => {
    switch (type) {
      case 'search':
        setSearch('')
        break
      case 'category':
        setCategory('All')
        break
      case 'condition':
        setCondition('All')
        break
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Browse Books
          </h1>
          <p className="text-sm sm:text-base text-white/50">
            Find your next read from our curated collection
          </p>
        </div>

        {/* Mobile Filter Toggle + Result Count */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-white/40">
            Showing{' '}
            <span className="font-medium text-amber">
              {filteredBooks.length}
            </span>{' '}
            {filteredBooks.length === 1 ? 'book' : 'books'}
          </p>

          {/* Mobile filter button */}
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden border-white/10 text-white/70 hover:text-amber hover:border-amber/30 hover:bg-amber/5"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="size-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge className="ml-2 h-5 min-w-5 px-1.5 bg-amber text-navy text-[10px] font-bold">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-in-out ${
          showFilters
            ? 'max-h-[500px] opacity-100'
            : 'max-h-0 opacity-0 lg:max-h-[500px] lg:opacity-100 overflow-hidden'
        }`}
      >
        <div className="bg-navy-card border border-white/5 rounded-xl p-4 sm:p-5 mb-6">
          {/* Search Row */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
            <Input
              placeholder="Search by title or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-10 h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:border-amber/50 focus-visible:ring-amber/20 rounded-lg"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            {/* Category Select */}
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="flex-1 h-10 bg-white/5 border-white/10 text-white rounded-lg focus-visible:border-amber/50 focus-visible:ring-amber/20 [&_svg]:text-white/40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-navy-card border-white/10 rounded-lg">
                {CATEGORIES.map((cat) => (
                  <SelectItem
                    key={cat}
                    value={cat}
                    className="text-white/80 focus:text-white focus:bg-amber/10 rounded-sm"
                  >
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Condition Select */}
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="flex-1 h-10 bg-white/5 border-white/10 text-white rounded-lg focus-visible:border-amber/50 focus-visible:ring-amber/20 [&_svg]:text-white/40">
                <SelectValue placeholder="Condition" />
              </SelectTrigger>
              <SelectContent className="bg-navy-card border-white/10 rounded-lg">
                {CONDITIONS.map((cond) => (
                  <SelectItem
                    key={cond}
                    value={cond}
                    className="text-white/80 focus:text-white focus:bg-amber/10 rounded-sm"
                  >
                    {cond}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Select */}
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="flex-1 h-10 bg-white/5 border-white/10 text-white rounded-lg focus-visible:border-amber/50 focus-visible:ring-amber/20 [&_svg]:text-white/40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-navy-card border-white/10 rounded-lg">
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-white/80 focus:text-white focus:bg-amber/10 rounded-sm"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            {search && (
              <ActiveFilterBadge
                label={`"${search}"`}
                onRemove={() => removeFilter('search')}
              />
            )}
            {category !== 'All' && (
              <ActiveFilterBadge
                label={category}
                onRemove={() => removeFilter('category')}
              />
            )}
            {condition !== 'All' && (
              <ActiveFilterBadge
                label={condition}
                onRemove={() => removeFilter('condition')}
              />
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs text-white/40 hover:text-amber transition-colors ml-1"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Book Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {filteredBooks.length > 0 ? (
          <BookGrid books={filteredBooks} />
        ) : (
          <EmptyState onClear={clearAllFilters} />
        )}
      </div>
    </div>
  )
}

function ActiveFilterBadge({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <Badge
      variant="secondary"
      className="gap-1.5 bg-amber/10 border-amber/20 text-amber hover:bg-amber/20 transition-colors cursor-default px-2.5 py-1"
    >
      {label}
      <button
        onClick={onRemove}
        className="text-amber/70 hover:text-amber transition-colors"
        aria-label={`Remove filter: ${label}`}
      >
        <X className="size-3" />
      </button>
    </Badge>
  )
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-navy-card border border-white/5">
        <BookOpen className="h-9 w-9 text-white/20" />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-semibold text-white">
          No books match your filters
        </h3>
        <p className="text-sm text-white/40 max-w-md">
          Try adjusting your search terms or removing some filters to discover
          more books.
        </p>
      </div>
      <Button
        onClick={onClear}
        variant="outline"
        className="border-amber/30 text-amber hover:bg-amber/10 hover:text-amber hover:border-amber/50 mt-2"
      >
        <X className="size-4 mr-2" />
        Clear All Filters
      </Button>
    </div>
  )
}
