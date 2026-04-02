'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store'
import type { HeroSlide } from '@/lib/supabase/types'
import { BookOpen } from 'lucide-react'

interface HeroCarouselProps {
  slides: HeroSlide[]
}

const defaultSlide: HeroSlide = {
  id: 'default',
  title: 'Premium Second-Hand Books',
  subtitle: 'Save up to 60% on JEE, NEET, UPSC & more. Quality-checked, fast delivery across India.',
  cta_button_text: 'Browse Books',
  cta_link: '/books',
  background_color: '#0c1a3a',
  image_url: null,
  sort_order: 0,
  active: true,
  created_at: '',
  updated_at: '',
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(0)
  const allSlides = slides.length > 0 ? slides : [defaultSlide]
  const total = allSlides.length

  const openSellBook = useStore((s) => s.openSellBook)
  const openRequestBook = useStore((s) => s.openRequestBook)

  const handleCTA = useCallback(
    (link: string | null) => {
      if (!link) return
      if (link === '#sell-modal') {
        openSellBook()
      } else if (link === '#request-modal') {
        openRequestBook()
      } else if (link.startsWith('#')) {
        window.location.hash = link
      } else {
        window.location.href = link
      }
    },
    [openSellBook, openRequestBook]
  )

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > current ? 1 : -1)
      setCurrent(index)
    },
    [current]
  )

  const goNext = useCallback(() => {
    setDirection(1)
    setCurrent((prev) => (prev + 1) % total)
  }, [total])

  const goPrev = useCallback(() => {
    setDirection(-1)
    setCurrent((prev) => (prev - 1 + total) % total)
  }, [total])

  // Autoplay every 5 seconds
  useEffect(() => {
    if (total <= 1) return
    const timer = setInterval(goNext, 5000)
    return () => clearInterval(timer)
  }, [total, goNext])

  const slide = allSlides[current]

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
    }),
  }

  return (
    <section className="relative w-full overflow-hidden pt-16" style={{ backgroundColor: slide.background_color || '#0c1a3a' }}>
      {/* Gradient overlays */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#060d1f]/80 via-transparent to-[#060d1f]/60" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#060d1f] to-transparent" />

      {/* Slides */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={slide.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="relative flex min-h-[420px] items-center sm:min-h-[480px] lg:min-h-[520px]"
        >
          <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center gap-8 px-4 py-16 sm:px-6 lg:px-8 lg:gap-16">
            {/* Text content */}
            <div className="flex max-w-xl flex-1 flex-col gap-5">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl"
              >
                {slide.title}
              </motion.h1>

              {slide.subtitle && (
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="max-w-lg text-base leading-relaxed text-white/60 sm:text-lg"
                >
                  {slide.subtitle}
                </motion.p>
              )}

              {slide.cta_button_text && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="mt-2"
                >
                  <Button
                    size="lg"
                    className="bg-amber text-navy font-bold hover:bg-amber-light h-12 rounded-lg px-8 text-base shadow-lg shadow-amber/20 transition-all duration-300 hover:shadow-amber/30"
                    onClick={() => handleCTA(slide.cta_link)}
                  >
                    {slide.cta_button_text}
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Image on right side (desktop only) */}
            {slide.image_url && (
              <motion.div
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="hidden flex-shrink-0 lg:block"
              >
                <div className="relative">
                  <div className="absolute -inset-4 rounded-2xl bg-amber/10 blur-2xl" />
                  <img
                    src={slide.image_url}
                    alt={slide.title}
                    className="relative h-72 w-56 rounded-xl object-cover shadow-2xl lg:h-80 lg:w-64 xl:h-96 xl:w-72"
                  />
                </div>
              </motion.div>
            )}

            {/* Decorative book stack when no image */}
            {!slide.image_url && (
              <motion.div
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="hidden flex-shrink-0 lg:flex lg:items-center lg:justify-center"
              >
                <div className="relative flex h-80 w-72 items-center justify-center xl:h-96 xl:w-80">
                  {/* Floating book shapes */}
                  <div className="absolute right-8 top-8 h-48 w-36 rotate-6 rounded-lg bg-amber/20 shadow-xl backdrop-blur-sm" />
                  <div className="absolute bottom-8 left-4 h-48 w-36 -rotate-3 rounded-lg bg-white/5 shadow-xl backdrop-blur-sm" />
                  <div className="absolute right-16 bottom-16 h-48 w-36 rotate-12 rounded-lg bg-amber/10 shadow-xl backdrop-blur-sm" />
                  <BookOpen className="relative z-10 h-24 w-24 text-amber/40" />
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Arrow buttons */}
      {total > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-navy/60 text-white/70 backdrop-blur-sm transition-all duration-200 hover:bg-navy/80 hover:text-white sm:left-4"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-navy/60 text-white/70 backdrop-blur-sm transition-all duration-200 hover:bg-navy/80 hover:text-white sm:right-4"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {total > 1 && (
        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {allSlides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-8 bg-amber'
                  : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
