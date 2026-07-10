import { HeroCarousel } from '@/components/features/hero-carousel'
import { HomeContent } from '@/components/features/home-content'
import { createAdminClient } from '@/lib/supabase/admin'
import type { HeroSlide, Book } from '@/lib/supabase/types'

// Cache the static page on Vercel's edge network for 10 minutes (ISR)
export const revalidate = 600

export default async function HomePage() {
  let slides: HeroSlide[] = []
  let books: Book[] = []
  let settings: Record<string, string> = {}

  try {
    const supabase = await createAdminClient()

    const [slidesRes, booksRes, settingsRes] = await Promise.all([
      supabase
        .from('hero_slides')
        .select('*')
        .eq('active', true)
        .order('sort_order'),
      supabase
        .from('books')
        .select('*')
        .eq('active', true)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('site_settings')
        .select('*')
    ])

    if (slidesRes.data) slides = slidesRes.data as HeroSlide[]
    if (booksRes.data) books = booksRes.data as Book[]
    
    if (settingsRes.data) {
      settingsRes.data.forEach((s: any) => {
        if (s.key) settings[s.key] = s.value || ''
      })
    }
  } catch (err) {
    console.error('Failed to fetch homepage data on server:', err)
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Kitaab Kharido',
    alternateName: ['KitaabKharido'],
    url: 'https://kitaab-kharidoo.vercel.app',
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroCarousel slides={slides} />
      <HomeContent books={books} settings={settings} />
    </>
  )
}
