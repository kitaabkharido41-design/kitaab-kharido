'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Minus,
  Plus,
  Trash2,
  X,
  ShoppingBag,
  CreditCard,
  MessageCircle,
  Truck,
  ArrowLeft,
  CheckCircle2,
  Save,
  MapPin,
} from 'lucide-react'

import { useStore, type CartItem } from '@/store'
import { useAuth } from '@/components/providers/auth-provider'
import { DELIVERY_CHARGE } from '@/lib/supabase/types'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

// ---------------------------------------------------------------------------
// Sub-views inside the drawer
// ---------------------------------------------------------------------------
type DrawerView = 'cart' | 'checkout' | 'confirmation'

export function CartDrawer() {
  const {
    cart,
    ui,
    closeCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    openAuthModal,
  } = useStore()
  const { user } = useAuth()

  const [view, setView] = useState<DrawerView>('cart')
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState('')

  // Derived values
  const itemCount = getCartCount()
  const subtotal = getCartTotal()
  const delivery = DELIVERY_CHARGE
  const total = subtotal + delivery

  const handleCheckoutClick = () => {
    if (!user) {
      openAuthModal('login')
      toast('Please login to proceed to checkout')
      return
    }
    setView('checkout')
  }

  const handleCheckoutSuccess = (orderNumber: string) => {
    setConfirmedOrderNumber(orderNumber)
    setView('confirmation')
  }

  return (
    <Sheet
      open={ui.cartOpen}
      onOpenChange={(open) => {
        if (!open) {
          // Reset internal state when drawer closes so it starts fresh next time
          setView('cart')
          setConfirmedOrderNumber('')
          closeCart()
        }
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-[#0a1128] border-l border-white/[0.06] p-0 flex flex-col [&>button]:hidden"
      >
        {/* ── Cart View ──────────────────────────────────────────────── */}
        {view === 'cart' && (
          <>
            <SheetHeader className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <ShoppingBag className="size-4 sm:size-5 text-amber" />
                  <SheetTitle className="text-base sm:text-lg font-semibold text-white">
                    Your Cart
                  </SheetTitle>
                  <Badge className="bg-amber/15 text-amber border-amber/20 text-[10px] sm:text-xs">
                    {itemCount}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeCart}
                  className="text-muted-foreground hover:text-white hover:bg-white/5 -mr-1.5 size-8 sm:size-9"
                >
                  <X className="size-4 sm:size-5" />
                </Button>
              </div>
              <SheetDescription className="sr-only">
                Shopping cart contents
              </SheetDescription>
            </SheetHeader>

            {cart.length === 0 ? (
              <EmptyCartState onClose={closeCart} />
            ) : (
              <CartItemsList
                items={cart}
                onRemove={removeFromCart}
                onUpdateQuantity={updateCartQuantity}
              />
            )}

            {/* Order summary footer – always visible when cart has items */}
            {cart.length > 0 && (
              <div className="shrink-0 border-t border-white/[0.06] bg-[#080e20] px-4 sm:px-5 py-3 sm:py-4 space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-white font-medium text-sm sm:text-base">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Truck className="size-3 sm:size-3.5" />
                    Delivery
                  </span>
                  <span className="text-white font-medium">₹{delivery}</span>
                </div>
                <Separator className="bg-white/[0.06]" />
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold text-sm sm:text-base">Grand Total</span>
                  <span className="text-amber font-bold text-base sm:text-lg">
                    ₹{total.toLocaleString('en-IN')}
                  </span>
                </div>

                <Button
                  className="w-full h-10 sm:h-11 bg-amber hover:bg-amber-dark text-navy font-semibold text-sm mt-1"
                  onClick={handleCheckoutClick}
                >
                  Proceed to Checkout
                </Button>
              </div>
            )}
          </>
        )}

        {/* ── Checkout View ──────────────────────────────────────────── */}
        {view === 'checkout' && (
          <CheckoutView
            cart={cart}
            subtotal={subtotal}
            delivery={delivery}
            total={total}
            onBack={() => setView('cart')}
            onSuccess={handleCheckoutSuccess}
            onClose={closeCart}
            clearCart={clearCart}
          />
        )}

        {/* ── Confirmation View ──────────────────────────────────────── */}
        {view === 'confirmation' && (
          <ConfirmationView
            orderNumber={confirmedOrderNumber}
            onClose={closeCart}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

// =====================================================================
// Empty Cart State
// =====================================================================
function EmptyCartState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/[0.04] flex items-center justify-center">
        <ShoppingBag className="size-8 sm:size-10 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-white font-medium text-base sm:text-lg">Your cart is empty</p>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Looks like you haven&apos;t added any books yet.
        </p>
      </div>
      <Link href="/books" onClick={onClose}>
        <Button
          variant="outline"
          className="mt-2 border-amber/30 text-amber hover:bg-amber/10 hover:text-amber text-sm"
        >
          Browse Books
        </Button>
      </Link>
    </div>
  )
}

// =====================================================================
// Cart Items List
// =====================================================================
function CartItemsList({
  items,
  onRemove,
  onUpdateQuantity,
}: {
  items: CartItem[]
  onRemove: (bookId: string) => void
  onUpdateQuantity: (bookId: string, qty: number) => void
}) {
  return (
    <ScrollArea className="flex-1">
      <div className="px-4 sm:px-5 pb-4">
        {items.map((item, idx) => (
          <div key={item.bookId}>
            <div className="flex gap-2.5 sm:gap-3 py-3 sm:py-3.5">
              {/* Thumbnail */}
              <div className="relative w-10 h-14 sm:w-12 sm:h-16 rounded-md overflow-hidden shrink-0 bg-white/[0.04] flex items-center justify-center">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ShoppingBag className="size-4 sm:size-5 text-muted-foreground/50" />
                )}
                {item.discountTag && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[8px] sm:text-[9px] font-bold px-0.5 sm:px-1 py-px leading-tight rounded-bl">
                    {item.discountTag}
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs sm:text-sm font-medium leading-tight line-clamp-1">
                  {item.title}
                </p>
                <p className="text-muted-foreground text-[11px] sm:text-xs mt-0.5 line-clamp-1">
                  {item.author}
                </p>

                {/* Price row */}
                <div className="flex items-center justify-between mt-1.5 sm:mt-2">
                  <div className="text-xs sm:text-sm">
                    <span className="text-amber font-semibold">
                      ₹{item.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-muted-foreground text-[11px] sm:text-xs ml-1">
                      × {item.quantity}
                    </span>
                    <span className="text-white/80 text-[11px] sm:text-xs ml-1 sm:ml-1.5">
                      = ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Controls row */}
                <div className="flex items-center gap-2 mt-1 sm:mt-1.5">
                  <div className="flex items-center rounded-md border border-white/10 overflow-hidden">
                    <button
                      onClick={() =>
                        onUpdateQuantity(item.bookId, item.quantity - 1)
                      }
                      className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-2.5 sm:size-3" />
                    </button>
                    <span className="w-6 sm:w-7 text-center text-[11px] sm:text-xs font-medium text-white select-none">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        onUpdateQuantity(item.bookId, item.quantity + 1)
                      }
                      className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-2.5 sm:size-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => onRemove(item.bookId)}
                    className="ml-auto w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    aria-label={`Remove ${item.title} from cart`}
                  >
                    <Trash2 className="size-3 sm:size-3.5" />
                  </button>
                </div>
              </div>
            </div>
            {idx < items.length - 1 && (
              <Separator className="bg-white/[0.06]" />
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

// =====================================================================
// Checkout View — uses API route instead of direct Supabase client
// =====================================================================
function CheckoutView({
  cart, subtotal, delivery, total, onBack, onSuccess, onClose, clearCart,
}: {
  cart: CartItem[]; subtotal: number; delivery: number; total: number
  onBack: () => void; onSuccess: (orderNumber: string) => void
  onClose: () => void; clearCart: () => void
}) {
  const { user, profile } = useAuth()
  const [placing, setPlacing] = useState(false)
  const [saveAddress, setSaveAddress] = useState(false)
  const [addressLoaded, setAddressLoaded] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [pincode, setPincode] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const inputClass = 'h-8 sm:h-9 bg-white/[0.04] border-white/10 text-white placeholder:text-muted-foreground/50 text-sm focus-visible:border-amber/50 focus-visible:ring-amber/20'

  const hasSavedAddress = !!(profile?.address && profile?.city && profile?.pincode)

  // Prefill from saved profile
  useEffect(() => {
    if (user && profile && !addressLoaded) {
      if (profile.full_name) setName(profile.full_name)
      if (profile.phone) setPhone(profile.phone)
      if (profile.address) setAddress(profile.address)
      if (profile.city) setCity(profile.city)
      if (profile.pincode) setPincode(profile.pincode)
      if (profile.address) setSaveAddress(true)
      setAddressLoaded(true)
    }
  }, [user, profile, addressLoaded])

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Name is required'
    if (!phone.trim()) errs.phone = 'Phone is required'
    else if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) errs.phone = 'Enter a valid 10-digit phone'
    if (!address.trim()) errs.address = 'Address is required'
    if (!city.trim()) errs.city = 'City is required'
    if (!pincode.trim()) errs.pincode = 'Pincode is required'
    else if (!/^\d{6}$/.test(pincode.trim())) errs.pincode = 'Enter a valid 6-digit pincode'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleWhatsAppPay = async () => {
    if (!user || !validate()) return
    setPlacing(true)

    // Save address in background if toggle is on
    if (saveAddress && name && phone && address && city && pincode) {
      fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, full_name: name.trim(), phone: phone.trim(), address: address.trim(), city: city.trim(), pincode: pincode.trim() }),
      }).catch(() => {})
    }

    try {
      const ordNum = `KK-${Date.now().toString(36).toUpperCase()}`
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id, order_number: ordNum, total_amount: subtotal, delivery_charge: delivery,
          grand_total: total, payment_method: 'whatsapp', payment_status: 'pending', order_status: 'pending',
          shipping_name: name.trim(), shipping_phone: phone.trim(), shipping_address: address.trim(),
          shipping_city: city.trim(), shipping_pincode: pincode.trim(),
          items: cart.map((item) => ({ book_id: item.bookId, book_title: item.title, book_author: item.author, book_price: item.price, book_original_price: item.originalPrice, book_image_url: item.imageUrl, quantity: item.quantity })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to place order')
      clearCart()
      const msg = `📚 *New Order — KitaabKharido*\n\n*Order:* ${ordNum}\n*Date:* ${new Date().toLocaleDateString('en-IN')}\n\n*Items:*\n${cart.map((item) => `• ${item.title} × ${item.quantity} — ₹${(item.price * item.quantity).toLocaleString('en-IN')}`).join('\n')}\n\n*Subtotal:* ₹${subtotal.toLocaleString('en-IN')}\n*Delivery:* ₹${delivery}\n*Total:* ₹${total.toLocaleString('en-IN')}\n\n*Shipping:*\n${name.trim()}\n${phone.trim()}\n${address.trim()}\n${city.trim()} - ${pincode.trim()}`
      window.open(`https://wa.me/919382470919?text=${encodeURIComponent(msg)}`, '_blank')
      toast.success('Order placed successfully!', { description: `Order ${ordNum} sent via WhatsApp for payment.`, duration: 6000 })
      onSuccess(ordNum)
    } catch (err: unknown) {
      toast.error('Failed to place order', { description: err instanceof Error ? err.message : 'Something went wrong', duration: 5000 })
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button variant="ghost" size="icon" onClick={onBack} className="text-muted-foreground hover:text-white hover:bg-white/5 -ml-1.5 size-8 sm:size-9"><ArrowLeft className="size-4" /></Button>
            <SheetTitle className="text-base sm:text-lg font-semibold text-white">Checkout</SheetTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-white hover:bg-white/5 -mr-1.5 size-8 sm:size-9"><X className="size-4 sm:size-5" /></Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 sm:px-5 pb-6 space-y-4 sm:space-y-5">
          {/* Saved address quick-fill */}
          {hasSavedAddress && (
            <button
              onClick={() => { if (profile) { setName(profile.full_name || ''); setPhone(profile.phone || ''); setAddress(profile.address || ''); setCity(profile.city || ''); setPincode(profile.pincode || ''); setSaveAddress(true); } }}
              className="w-full flex items-center gap-2 p-3 rounded-lg bg-amber/10 border border-amber/20 text-amber hover:bg-amber/15 transition-colors"
            >
              <MapPin className="size-4 shrink-0" />
              <span className="text-xs sm:text-sm font-medium truncate">Use saved: {profile.address}, {profile.city} - {profile.pincode}</span>
            </button>
          )}

          <section>
            <h3 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5 sm:gap-2 mb-2.5 sm:mb-3">
              <Truck className="size-3.5 sm:size-4 text-amber" /> Shipping Details
            </h3>
            <div className="space-y-2.5 sm:space-y-3">
              {[
                { id: 'shipping-name', label: 'Full Name', value: name, set: setName, placeholder: 'Your full name', auto: 'name' },
                { id: 'shipping-phone', label: 'Phone Number', value: phone, set: setPhone, placeholder: '10-digit phone number', auto: 'tel' },
                { id: 'shipping-address', label: 'Address', value: address, set: setAddress, placeholder: 'Street address, house no.', auto: 'street-address' },
              ].map((f) => (
                <div key={f.id}>
                  <Label htmlFor={f.id} className="text-[11px] sm:text-xs text-muted-foreground mb-1">{f.label}</Label>
                  <Input id={f.id} value={f.value} onChange={(e) => { f.set(e.target.value); setErrors((p) => ({ ...p, [f.id.split('-')[1]]: '' })) }} placeholder={f.placeholder} className={inputClass} autoComplete={f.auto} />
                  {errors[f.id.split('-')[1]] && <p className="text-red-400 text-[11px] sm:text-xs mt-1">{errors[f.id.split('-')[1]]}</p>}
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {[
                  { id: 'shipping-city', label: 'City', value: city, set: setCity, placeholder: 'City', auto: 'address-level2' },
                  { id: 'shipping-pincode', label: 'Pincode', value: pincode, set: setPincode, placeholder: '6-digit pincode', auto: 'postal-code' },
                ].map((f) => (
                  <div key={f.id}>
                    <Label htmlFor={f.id} className="text-[11px] sm:text-xs text-muted-foreground mb-1">{f.label}</Label>
                    <Input id={f.id} value={f.value} onChange={(e) => { f.set(e.target.value); setErrors((p) => ({ ...p, [f.id.split('-')[1]]: '' })) }} placeholder={f.placeholder} className={inputClass} autoComplete={f.auto} />
                    {errors[f.id.split('-')[1]] && <p className="text-red-400 text-[11px] sm:text-xs mt-1">{errors[f.id.split('-')[1]]}</p>}
                  </div>
                ))}
              </div>

              {/* Save Address Toggle */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Save className="size-3.5 text-amber/70" />
                  <Label className="text-xs text-white/60 cursor-pointer select-none" htmlFor="save-addr">Save address for next time</Label>
                </div>
                <Switch id="save-addr" checked={saveAddress} onCheckedChange={setSaveAddress} className="data-[state=checked]:bg-amber" />
              </div>
            </div>
          </section>

          <Separator className="bg-white/[0.06]" />

          <section>
            <h3 className="text-xs sm:text-sm font-semibold text-white mb-2.5 sm:mb-3">Order Summary</h3>
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.bookId} className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground truncate max-w-[70%]">{item.title} × {item.quantity}</span>
                  <span className="text-white shrink-0">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
              <Separator className="bg-white/[0.06] my-2" />
              <div className="flex items-center justify-between text-xs sm:text-sm"><span className="text-muted-foreground">Subtotal</span><span className="text-white">₹{subtotal.toLocaleString('en-IN')}</span></div>
              <div className="flex items-center justify-between text-xs sm:text-sm"><span className="text-muted-foreground">Delivery</span><span className="text-white">₹{delivery}</span></div>
              <Separator className="bg-white/[0.06]" />
              <div className="flex items-center justify-between"><span className="text-white font-semibold text-sm sm:text-base">Total</span><span className="text-amber font-bold text-base sm:text-lg">₹{total.toLocaleString('en-IN')}</span></div>
            </div>
          </section>

          <Separator className="bg-white/[0.06]" />

          <section>
            <h3 className="text-xs sm:text-sm font-semibold text-white mb-2.5 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
              <CreditCard className="size-3.5 sm:size-4 text-amber" /> Payment Method
            </h3>
            <div className="space-y-2 sm:space-y-2.5">
              <Button className="w-full h-10 sm:h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm" onClick={handleWhatsAppPay} disabled={placing}>
                {placing ? (<span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Placing Order...</span>) : (<><MessageCircle className="size-3.5 sm:size-4" />Pay via WhatsApp</>)}
              </Button>
              <Button className="w-full h-10 sm:h-11 bg-white/[0.04] text-muted-foreground cursor-not-allowed text-sm" disabled>
                <CreditCard className="size-3.5 sm:size-4" />PhonePe<Badge className="ml-auto bg-white/10 text-muted-foreground text-[9px] sm:text-[10px] border-white/10">Coming Soon</Badge>
              </Button>
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  )
}

// =====================================================================
// Confirmation View
// =====================================================================
function ConfirmationView({
  orderNumber,
  onClose,
}: {
  orderNumber: string
  onClose: () => void
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-3 sm:gap-4">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
        <CheckCircle2 className="size-8 sm:size-10 text-emerald-400" />
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        <h2 className="text-lg sm:text-xl font-bold text-white">
          Order Placed Successfully!
        </h2>
        {orderNumber && (
          <p className="text-amber font-mono text-xs sm:text-sm font-medium">
            {orderNumber}
          </p>
        )}
        <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-xs mx-auto">
          Your order has been sent via WhatsApp for payment. You&apos;ll
          receive a confirmation once the payment is verified.
        </p>
      </div>
      <Button
        className="mt-2 h-10 sm:h-11 bg-amber hover:bg-amber-dark text-navy font-semibold text-sm px-6 sm:px-8"
        onClick={onClose}
      >
        Continue Shopping
      </Button>
    </div>
  )
}
