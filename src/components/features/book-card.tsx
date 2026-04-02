'use client'

import { motion } from 'framer-motion'
import { Heart, BookOpen, ShoppingCart, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/store'
import { useAuth } from '@/components/providers/auth-provider'
import type { Book } from '@/lib/supabase/types'

interface BookCardProps {
  book: Book
}

export function BookCard({ book }: BookCardProps) {
  const { addToCart, toggleWishlist, isInWishlist, openAuthModal, openCart } = useStore()
  const { user } = useAuth()
  const wishlisted = isInWishlist(book.id)

  const handleAddToCart = () => {
    if (!user) {
      openAuthModal('login')
      return
    }
    addToCart({
      id: Date.now().toString(),
      bookId: book.id,
      title: book.title,
      author: book.author,
      price: Number(book.price),
      originalPrice: Number(book.original_price),
      discountTag: book.discount_tag,
      imageUrl: book.image_urls?.[0] || null,
    })
    toast.success('Added to cart!')
  }

  const handleBuyNow = () => {
    if (!user) {
      openAuthModal('login')
      return
    }
    addToCart({
      id: Date.now().toString(),
      bookId: book.id,
      title: book.title,
      author: book.author,
      price: Number(book.price),
      originalPrice: Number(book.original_price),
      discountTag: book.discount_tag,
      imageUrl: book.image_urls?.[0] || null,
    })
    toast.success('Added to cart!')
    openCart()
  }

  const handleWishlist = () => {
    if (!user) {
      openAuthModal('login')
      return
    }
    toggleWishlist(book.id)
    if (wishlisted) {
      toast.success('Removed from wishlist')
    } else {
      toast.success('Added to wishlist!')
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-white/5 bg-navy-card transition-all duration-300 hover:border-amber/20 hover:shadow-[0_0_30px_rgba(245,158,11,0.08)]"
    >
      {/* Image Section */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-navy-light">
        {book.image_urls && book.image_urls.length > 0 ? (
          <img
            src={book.image_urls[0]}
            alt={book.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <BookOpen className="h-12 w-12 opacity-30" />
            <span className="text-xs opacity-40">No Image</span>
          </div>
        )}

        {/* Category Badge — top-left */}
        <span className="absolute top-2 left-2 rounded bg-amber px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-navy shadow-sm">
          {book.category}
        </span>

        {/* Discount Badge — top-right */}
        {book.discount_tag && (
          <span className="absolute top-2 right-2 rounded bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            {book.discount_tag}
          </span>
        )}

        {/* Wishlist Button — overlay on image */}
        <button
          onClick={handleWishlist}
          className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-navy/70 backdrop-blur-sm transition-all duration-200 hover:bg-navy/90 hover:scale-110"
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            className={`h-4 w-4 transition-colors duration-200 ${
              wishlisted
                ? 'fill-red-500 text-red-500'
                : 'text-white/70 hover:text-white'
            }`}
          />
        </button>
      </div>

      {/* Info Section */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">
          {book.title}
        </h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {book.author}
        </p>

        {/* Condition Tag */}
        <span className="inline-block w-fit rounded bg-navy-hover px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {book.condition}
        </span>

        {/* Price Row */}
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="text-lg font-bold text-amber">
            ₹{Number(book.price).toLocaleString('en-IN')}
          </span>
          {book.original_price > book.price && (
            <span className="text-xs text-muted-foreground line-through">
              ₹{Number(book.original_price).toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 border-t border-white/5 p-3 pt-2">
        <button
          onClick={handleAddToCart}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-amber/30 bg-transparent px-3 py-2 text-xs font-medium text-amber transition-all duration-200 hover:bg-amber/10 hover:border-amber/50"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Add to Cart
        </button>
        <button
          onClick={handleBuyNow}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-amber px-3 py-2 text-xs font-semibold text-navy transition-all duration-200 hover:bg-amber-light hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]"
        >
          <Zap className="h-3.5 w-3.5" />
          Buy Now
        </button>
      </div>
    </motion.div>
  )
}
