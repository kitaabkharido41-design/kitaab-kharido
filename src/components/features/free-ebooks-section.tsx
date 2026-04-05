'use client'

import { motion } from 'framer-motion'
import { Gift, BookOpen, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStore } from '@/store'

const EBOOK_CATEGORIES = ['JEE', 'NEET', 'UPSC', 'CAT', 'GATE']

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
}

export function FreeEbooksSection() {
  const openRequestEbook = useStore((s) => s.openRequestEbook)

  return (
    <section
      id="ebooks"
      className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8 lg:pb-16"
    >
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        custom={0}
        variants={fadeUp}
        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c1a3a] via-[#0f1730] to-[#060d1f] p-6 sm:p-8 lg:p-10"
      >
        {/* Background decorative elements */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber/5 blur-3xl transition-all duration-500 group-hover:bg-amber/10" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-amber/5 blur-3xl transition-all duration-500 group-hover:bg-amber/8" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
          {/* Left content */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber/10 text-amber transition-transform duration-300 group-hover:scale-110">
                <Gift className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                  Free Ebooks <span className="inline-block">🎁</span>
                </h2>
                <p className="text-sm text-amber/80 font-medium">
                  A gift for every student
                </p>
              </div>
            </div>

            <p className="max-w-lg text-sm leading-relaxed text-white/60 sm:text-base">
              Request any ebook and get it for <span className="text-amber font-semibold">FREE</span> as a
              gift! Whether you&apos;re preparing for competitive exams or need study material, we&apos;ve
              got you covered. Just tell us the book you need, and we&apos;ll deliver the ebook
              straight to your inbox.
            </p>

            {/* Category badges */}
            <div className="flex flex-wrap gap-2">
              {EBOOK_CATEGORIES.map((cat) => (
                <Badge
                  key={cat}
                  variant="outline"
                  className="border-amber/20 bg-amber/5 text-amber/90 text-xs font-medium px-3 py-1 hover:bg-amber/10 hover:border-amber/30 transition-colors"
                >
                  {cat}
                </Badge>
              ))}
              <Badge
                variant="outline"
                className="border-white/10 bg-white/5 text-white/50 text-xs font-medium px-3 py-1"
              >
                + more
              </Badge>
            </div>

            {/* CTA button */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                onClick={openRequestEbook}
                className="bg-amber hover:bg-amber-light text-navy font-semibold shadow-lg shadow-amber/15 transition-all duration-300 hover:shadow-amber/25 w-fit"
                size="lg"
              >
                <Gift className="mr-2 h-4 w-4" />
                Request Free Ebook
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <span className="text-xs text-white/40">
                No signup required • Delivered via email
              </span>
            </div>
          </div>

          {/* Right side: decorative cards */}
          <div className="hidden lg:flex lg:flex-col lg:gap-3 lg:w-64">
            <FeatureCard
              icon={<BookOpen className="h-4 w-4" />}
              text="PDF & EPUB formats available"
            />
            <FeatureCard
              icon={<Sparkles className="h-4 w-4" />}
              text="Delivered within 24 hours"
            />
            <FeatureCard
              icon={<Gift className="h-4 w-4" />}
              text="100% free, no hidden charges"
            />
          </div>
        </div>
      </motion.div>
    </section>
  )
}

function FeatureCard({
  icon,
  text,
}: {
  icon: React.ReactNode
  text: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/5">
      <div className="text-amber/70">{icon}</div>
      <span className="text-sm text-white/60">{text}</span>
    </div>
  )
}
