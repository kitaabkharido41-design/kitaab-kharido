'use client'

import { useEffect, useState, useCallback } from 'react'
import { useStore } from '@/store'
import { useAuth } from '@/components/providers/auth-provider'
import type { Order, Book } from '@/lib/supabase/types'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  X,
  Package,
  Heart,
  User,
  ShoppingCart,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Mail,
  UserCircle,
  LogOut,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

// ── Order status colors ──────────────────────────────────────────────
const orderStatusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  packed: { label: 'Packed', className: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  shipped: { label: 'Shipped', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  out_for_delivery: { label: 'Out for Delivery', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  delivered: { label: 'Delivered', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

const paymentStatusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Payment Pending', className: 'border-yellow-500/40 text-yellow-500' },
  paid: { label: 'Paid', className: 'border-green-500/40 text-green-500' },
  failed: { label: 'Failed', className: 'border-red-500/40 text-red-500' },
  refunded: { label: 'Refunded', className: 'border-gray-500/40 text-gray-400' },
}

// ── Component ────────────────────────────────────────────────────────
export function UserDashboard() {
  const { ui, closeDashboard, wishlist, toggleWishlist, addToCart, openCart } = useStore()
  const { user, profile, refreshProfile, signOut } = useAuth()

  return (
    <Sheet open={ui.dashboardOpen} onOpenChange={(open) => !open && closeDashboard()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg border-white/10 bg-[#060d1f] p-0 text-white flex flex-col gap-0 [&>button]:hidden"
      >
        {/* Header - fixed */}
        <div className="px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl font-bold text-white">
                Hey, {profile?.full_name || user?.user_metadata?.full_name || 'there'} 👋
              </SheetTitle>
              <SheetDescription className="text-white/50 text-sm mt-1">
                {user?.email || 'Welcome to Kitaab Kharido'}
              </SheetDescription>
            </div>
            <div className="flex items-center gap-1 -mt-1 -mr-2">
              {/* Logout button always visible in header */}
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await signOut()
                    closeDashboard()
                  }}
                  className="text-red-400/80 hover:text-red-400 hover:bg-red-400/10 text-xs h-8 px-2"
                >
                  <LogOut className="size-3.5 mr-1" />
                  Logout
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={closeDashboard}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="size-5" />
              </Button>
            </div>
          </div>
        </div>

        <Separator className="bg-white/10" />

        {/* Tabs - tabs fixed, content scrollable */}
        <Tabs defaultValue="orders" className="flex flex-col flex-1 min-h-0">
          <div className="px-6 py-3 shrink-0">
            <TabsList className="bg-white/5 border border-white/10 w-full h-10">
              <TabsTrigger
                value="orders"
                className="flex-1 text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 text-white/60"
              >
                <Package className="size-3.5 mr-1" />
                Orders
              </TabsTrigger>
              <TabsTrigger
                value="wishlist"
                className="flex-1 text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 text-white/60"
              >
                <Heart className="size-3.5 mr-1" />
                Wishlist
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="flex-1 text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 text-white/60"
              >
                <User className="size-3.5 mr-1" />
                Profile
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-8">
            <TabsContent value="orders" className="mt-0 pb-6">
              <MyOrders userId={user?.id} />
            </TabsContent>
            <TabsContent value="wishlist" className="mt-0 pb-6">
              <MyWishlist />
            </TabsContent>
            <TabsContent value="profile" className="mt-0 pb-6">
              <MyProfile />
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

// ── My Orders Tab ────────────────────────────────────────────────────
function MyOrders({ userId }: { userId?: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())

  const fetchOrders = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/user/orders?userId=' + userId)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch orders')
      setOrders(data.orders || [])
    } catch {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const toggleOrder = (orderId: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.add(orderId)
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            <Skeleton className="h-4 w-32 bg-white/10" />
            <Skeleton className="h-3 w-20 bg-white/10" />
            <Skeleton className="h-5 w-24 bg-white/10" />
          </div>
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Package className="size-8 text-white/30" />
        </div>
        <p className="text-white/60 font-medium mb-1">No orders yet</p>
        <p className="text-white/40 text-sm mb-4">Your orders will appear here</p>
        <Button
          onClick={() => useStore.getState().closeDashboard()}
          className="bg-amber-500 hover:bg-amber-600 text-black font-medium"
        >
          Browse Books
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const statusConf = orderStatusConfig[order.order_status] || orderStatusConfig.pending
        const payConf = paymentStatusConfig[order.payment_status] || paymentStatusConfig.pending
        const isExpanded = expandedOrders.has(order.id)
        const itemCount = order.order_items?.length || 0

        return (
          <div
            key={order.id}
            className="rounded-xl border border-white/10 bg-white/5 overflow-hidden transition-all"
          >
            {/* Order card header */}
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-white text-sm">
                    #{order.order_number}
                  </p>
                  <p className="text-white/40 text-xs mt-0.5">
                    {format(new Date(order.created_at), 'dd MMM yyyy, hh:mm a')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${statusConf.className} border text-[10px] px-2 py-0.5`}>
                    {statusConf.label}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={`${payConf.className} border text-[10px] px-2 py-0.5`}>
                    {payConf.label}
                  </Badge>
                  <span className="text-white/40 text-xs">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <p className="font-bold text-amber-400 text-lg">
                  ₹{order.grand_total.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {order.tracking_url && (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <ExternalLink className="size-3" />
                    Track Order
                  </a>
                )}
                {order.tracking_number && (
                  <span className="text-white/30 text-[11px]">
                    Tracking: {order.tracking_number}
                  </span>
                )}
              </div>

              {order.order_items && order.order_items.length > 0 && (
                <button
                  onClick={() => toggleOrder(order.id)}
                  className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="size-3.5" />
                      Hide items
                    </>
                  ) : (
                    <>
                      <ChevronDown className="size-3.5" />
                      View items
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Expanded order items */}
            {isExpanded && order.order_items && order.order_items.length > 0 && (
              <>
                <Separator className="bg-white/10" />
                <div className="p-4 space-y-3">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-10 h-14 rounded-md bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                        {item.book_image_url ? (
                          <img
                            src={item.book_image_url}
                            alt={item.book_title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="size-4 text-white/20" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/90 truncate">{item.book_title}</p>
                        <p className="text-xs text-white/40 truncate">
                          {item.book_author || 'Unknown Author'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-amber-400">
                          ₹{item.book_price.toLocaleString('en-IN')}
                        </p>
                        {item.book_original_price && (
                          <p className="text-[11px] text-white/30 line-through">
                            ₹{item.book_original_price.toLocaleString('en-IN')}
                          </p>
                        )}
                        <p className="text-[11px] text-white/40">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Wishlist Tab ─────────────────────────────────────────────────────
function MyWishlist() {
  const { wishlist, toggleWishlist, addToCart, openCart, closeDashboard } = useStore()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  const fetchWishlistBooks = useCallback(async () => {
    if (wishlist.length === 0) {
      setBooks([])
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/user/wishlist-books?ids=' + wishlist.join(','))
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch wishlist')
      setBooks(data.books || [])
    } catch {
      toast.error('Failed to load wishlist')
    } finally {
      setLoading(false)
    }
  }, [wishlist])

  useEffect(() => {
    fetchWishlistBooks()
  }, [fetchWishlistBooks])

  const handleAddToCart = (book: Book) => {
    addToCart({
      id: book.id,
      bookId: book.id,
      title: book.title,
      author: book.author,
      price: book.price,
      originalPrice: book.original_price,
      discountTag: book.discount_tag,
      imageUrl: book.image_urls?.[0] || null,
    })
    toast.success('Added to cart!')
    openCart()
  }

  const handleRemove = (bookId: string) => {
    toggleWishlist(bookId)
    toast.success('Removed from wishlist')
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 items-center p-2">
            <Skeleton className="w-14 h-20 rounded-lg bg-white/10 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4 bg-white/10" />
              <Skeleton className="h-3 w-1/2 bg-white/10" />
              <Skeleton className="h-4 w-20 bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Heart className="size-8 text-white/30" />
        </div>
        <p className="text-white/60 font-medium mb-1">Your wishlist is empty</p>
        <p className="text-white/40 text-sm mb-4">Save books you love for later</p>
        <Button
          onClick={closeDashboard}
          className="bg-amber-500 hover:bg-amber-600 text-black font-medium"
        >
          Browse Books
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {books.map((book) => (
        <div
          key={book.id}
          className="flex gap-3 items-center p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/[0.07] transition-colors group"
        >
          {/* Thumbnail */}
          <div className="w-14 h-20 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
            {book.image_urls?.[0] ? (
              <img
                src={book.image_urls[0]}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="size-5 text-white/20" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/90 truncate">{book.title}</p>
            <p className="text-xs text-white/50 truncate">{book.author}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-sm font-bold text-amber-400">
                ₹{book.price.toLocaleString('en-IN')}
              </span>
              {book.discount_tag && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0">
                  {book.discount_tag}
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <Button
              size="sm"
              onClick={() => handleAddToCart(book)}
              className="bg-amber-500 hover:bg-amber-600 text-black text-xs h-7 px-2.5"
            >
              <ShoppingCart className="size-3 mr-1" />
              Add
            </Button>
            <button
              onClick={() => handleRemove(book.id)}
              className="text-white/30 hover:text-red-400 transition-colors self-end"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Profile Tab ──────────────────────────────────────────────────────
function MyProfile() {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const { closeDashboard } = useStore()
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
  })

  // Sync form with profile data or user metadata as fallback
  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        pincode: profile.pincode || '',
      })
    } else if (user) {
      const meta = user.user_metadata || {}
      setForm({
        full_name: meta.full_name || meta.name || '',
        phone: meta.phone || '',
        address: '',
        city: '',
        pincode: '',
      })
    }
  }, [profile, user])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          full_name: form.full_name,
          phone: form.phone,
          address: form.address,
          city: form.city,
          pincode: form.pincode,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update profile')
      }
      await refreshProfile()
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      closeDashboard()
      toast.success('Signed out successfully')
    } catch {
      toast.error('Failed to sign out')
    } finally {
      setSigningOut(false)
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <UserCircle className="size-8 text-white/30" />
        </div>
        <p className="text-white/60 font-medium mb-1">Not signed in</p>
        <p className="text-white/40 text-sm mb-4">Sign in to manage your profile</p>
        <Button
          onClick={() => {
            closeDashboard()
            useStore.getState().openAuthModal('login')
          }}
          className="bg-amber-500 hover:bg-amber-600 text-black font-medium"
        >
          Sign In
        </Button>
      </div>
    )
  }

  if (!profile && !user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <UserCircle className="size-8 text-white/30" />
        </div>
        <p className="text-white/60 font-medium mb-1">Not signed in</p>
        <p className="text-white/40 text-sm mb-4">Sign in to manage your profile</p>
        <Button
          onClick={() => {
            closeDashboard()
            useStore.getState().openAuthModal('login')
          }}
          className="bg-amber-500 hover:bg-amber-600 text-black font-medium"
        >
          Sign In
        </Button>
      </div>
    )
  }

  const inputClass =
    'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:border-amber-500/50 focus-visible:ring-amber-500/20'

  return (
    <div className="space-y-6">
      {/* Avatar area */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-black font-bold text-xl flex-shrink-0">
          {(form.full_name || user.email || '?')[0].toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-white">{form.full_name || 'Set your name'}</p>
          <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
            <Mail className="size-3" />
            {user.email}
          </p>
        </div>
      </div>

      <Separator className="bg-white/10" />

      {/* Form fields */}
      <div className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
            <UserCircle className="size-3.5" />
            Full Name
          </label>
          <Input
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            placeholder="Enter your full name"
            className={inputClass}
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
            <Phone className="size-3.5" />
            Phone
          </label>
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Enter your phone number"
            className={inputClass}
            type="tel"
          />
        </div>

        {/* Email (read-only) */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
            <Mail className="size-3.5" />
            Email
          </label>
          <Input
            value={user.email || ''}
            disabled
            className={`${inputClass} opacity-50 cursor-not-allowed`}
          />
          <p className="text-[11px] text-white/30">Email cannot be changed</p>
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
            <MapPin className="size-3.5" />
            Address
          </label>
          <Textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Enter your full address"
            className={`${inputClass} min-h-[80px] resize-none`}
          />
        </div>

        {/* City + Pincode */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60">City</label>
            <Input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="City"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60">Pincode</label>
            <Input
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              placeholder="Pincode"
              className={inputClass}
              type="text"
              maxLength={6}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 pt-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
        >
          {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
          Save Changes
        </Button>

        <Separator className="bg-white/10" />

        <Button
          variant="destructive"
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-medium"
        >
          {signingOut ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <LogOut className="size-4 mr-2" />
          )}
          Sign Out
        </Button>
      </div>
    </div>
  )
}
