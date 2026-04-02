'use client'

import { useEffect, useState } from 'react'
import { HeroCarousel } from '@/components/features/hero-carousel'
import { HomeContent } from '@/components/features/home-content'
import { Loader2 } from 'lucide-react'
import type { HeroSlide, Book } from '@/lib/supabase/types'

export default function HomePage() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [slidesRes, booksRes, settingsRes] = await Promise.all([
          fetch('/api/hero-slides').then((r) => r.json()),
          fetch('/api/books').then((r) => r.json()),
          fetch('/api/settings').then((r) => r.json()),
        ])
        setSlides(slidesRes.slides || [])
        setBooks(booksRes.books || [])
        setSettings(settingsRes.settings || {})
      } catch (err) {
        console.error('Failed to fetch homepage data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="size-8 text-amber animate-spin mx-auto mb-4" />
          <p className="text-white/50">Loading Kitaab Kharido...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <HeroCarousel slides={slides} />
      <HomeContent books={books} settings={settings} />
    </>
  )
}
