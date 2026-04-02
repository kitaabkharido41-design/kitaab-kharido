'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Truck,
  ShieldCheck,
  MessageCircle,
  GraduationCap,
  BookOpenText,
  IndianRupee,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStore } from '@/store'
import { BookGrid } from '@/components/features/book-grid'
import { CATEGORIES } from '@/lib/supabase/types'
import type { Book } from '@/lib/supabase/types'

interface HomeContentProps {
  books: Book[]
  settings: Record<string, string>
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
}

export function HomeContent({ books, settings }: HomeContentProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const openSellBook = useStore((s) => s.openSellBook)
  const openRequestBook = useStore((s) => s.openRequestBook)

  const showBanner = settings['show_banner'] === 'true'
  const announcementText =
    settings['announcement_banner'] ||
    'Standard Delivery ₹35 | Condition Verified | WhatsApp Support | JEE • NEET • UPSC • CAT'

  const filteredBooks = useMemo(() => {
    if (activeCategory === 'All') return books
    return books.filter((b) => b.category === activeCategory)
  }, [books, activeCategory])

  return (
    <div className="space-y-0">
      {/* ── Announcement Strip ── */}
      {showBanner && (
        <div className="relative overflow-hidden border-b border-amber/20 bg-amber/10">
          <div className="flex items-center gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
            {/* Desktop: static */}
            <div className="hidden w-full items-center justify-center gap-6 text-sm sm:flex lg:gap-8">
              <AnnouncementItem icon={<Truck className="h-4 w-4" />} text="Standard Delivery ₹35" />
              <span className="text-amber/30">|</span>
              <AnnouncementItem icon={<ShieldCheck className="h-4 w-4" />} text="Condition Verified" />
              <span className="text-amber/30">|</span>
              <AnnouncementItem icon={<MessageCircle className="h-4 w-4" />} text="WhatsApp Support" />
              <span className="text-amber/30">|</span>
              <AnnouncementItem icon={<GraduationCap className="h-4 w-4" />} text="JEE • NEET • UPSC • CAT" />
            </div>

            {/* Mobile: scrolling marquee */}
            <div className="relative w-full overflow-hidden sm:hidden">
              <div className="flex animate-marquee whitespace-nowrap text-xs text-amber/90">
                <span className="mx-4">🚚 Standard Delivery ₹35</span>
                <span className="mx-4">✅ Condition Verified</span>
                <span className="mx-4">💬 WhatsApp Support</span>
                <span className="mx-4">🎓 JEE • NEET • UPSC • CAT</span>
                <span className="mx-4">🚚 Standard Delivery ₹35</span>
                <span className="mx-4">✅ Condition Verified</span>
                <span className="mx-4">💬 WhatsApp Support</span>
                <span className="mx-4">🎓 JEE • NEET • UPSC • CAT</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Category Tabs + Books ── */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeUp}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Featured <span className="text-amber">Books</span>
            </h2>
            <p className="mt-1 text-sm text-white/40">
              Hand-picked quality second-hand books at unbeatable prices
            </p>
          </div>
          <Button
            variant="outline"
            className="w-fit border-white/10 text-white/60 hover:border-amber/30 hover:text-amber"
            asChild
          >
            <a href="/books">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={1}
          variants={fadeUp}
          className="mb-8 flex flex-wrap gap-2"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-amber text-navy shadow-lg shadow-amber/20'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Book Grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={2}
          variants={fadeUp}
        >
          <BookGrid books={filteredBooks} />
        </motion.div>
      </section>

      {/* ── CTA Cards ── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:gap-6">
          {/* Card 1: Request a Book */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            custom={0}
            variants={fadeUp}
          >
            <CTACard
              icon={<BookOpenText className="h-8 w-8" />}
              title="Can't find what you're looking for?"
              subtitle="Tell us the book you need and we'll source it for you"
              ctaText="Request Now"
              onClick={openRequestBook}
              gradient="from-blue-950/80 via-navy-card to-navy-card"
              borderHover="hover:border-blue-500/20"
              iconBg="bg-blue-500/10"
              iconColor="text-blue-400"
            />
          </motion.div>

          {/* Card 2: Sell Your Books */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            custom={1}
            variants={fadeUp}
          >
            <CTACard
              icon={<IndianRupee className="h-8 w-8" />}
              title="Got old books lying around?"
              subtitle="Sell your pre-owned books and earn cash instantly"
              ctaText="Start Selling"
              onClick={openSellBook}
              gradient="from-amber-950/40 via-navy-card to-navy-card"
              borderHover="hover:border-amber/20"
              iconBg="bg-amber/10"
              iconColor="text-amber"
            />
          </motion.div>
        </div>
      </section>
    </div>
  )
}

/* ── Sub-components ── */

function AnnouncementItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-amber/90">
      {icon}
      <span className="text-sm font-medium">{text}</span>
    </div>
  )
}

function CTACard({
  icon,
  title,
  subtitle,
  ctaText,
  onClick,
  gradient,
  borderHover,
  iconBg,
  iconColor,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  ctaText: string
  onClick: () => void
  gradient: string
  borderHover: string
  iconBg: string
  iconColor: string
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-white/5 bg-gradient-to-br ${gradient} p-6 transition-all duration-300 ${borderHover} hover:shadow-lg sm:p-8 lg:p-10`}
    >
      {/* Subtle glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-amber/5 blur-3xl transition-all duration-500 group-hover:bg-amber/10" />

      <div className="relative flex flex-col gap-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-xl ${iconBg} ${iconColor} transition-transform duration-300 group-hover:scale-110`}
        >
          {icon}
        </div>

        <h3 className="text-lg font-bold leading-snug text-white sm:text-xl">
          {title}
        </h3>

        <p className="max-w-sm text-sm leading-relaxed text-white/50">
          {subtitle}
        </p>

        <div className="mt-2">
          <Button
            className="bg-amber text-navy font-semibold hover:bg-amber-light shadow-md shadow-amber/10 transition-all duration-300 hover:shadow-amber/20"
            onClick={onClick}
          >
            {ctaText}
          </Button>
        </div>
      </div>
    </div>
  )
}
