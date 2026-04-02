'use client'

import { useState } from 'react'
import Image from 'next/image'
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
} from 'lucide-react'

import { useStore, type CartItem } from '@/store'
import { useAuth } from '@/components/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'
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
  const { user, profile } = useAuth()

  const [view, setView] = useState<DrawerView>('cart')
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState('')

  // Derived values
  const itemCount = getCartCount()
  const subtotal = getCartTotal()
  const delivery = DELIVERY_CHARGE
  const total = subtotal + delivery

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
            <SheetHeader className="px-5 pt-5 pb-3 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="size-5 text-amber" />
                  <SheetTitle className="text-lg font-semibold text-white">
                    Your Cart
                  </SheetTitle>
                  <Badge className="bg-amber/15 text-amber border-amber/20 text-xs">
                    {itemCount}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeCart}
                  className="text-muted-foreground hover:text-white hover:bg-white/5 -mr-1.5"
                >
                  <X className="size-5" />
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
              <div className="shrink-0 border-t border-white/[0.06] bg-[#080e20] px-5 py-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-white font-medium">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Truck className="size-3.5" />
                    Delivery
                  </span>
                  <span className="text-white font-medium">₹{delivery}</span>
                </div>
                <Separator className="bg-white/[0.06]" />
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">Grand Total</span>
                  <span className="text-amber font-bold text-lg">
                    ₹{total.toLocaleString('en-IN')}
                  </span>
                </div>

                <Button
                  className="w-full h-11 bg-amber hover:bg-amber-dark text-navy font-semibold text-sm mt-1"
                  onClick={() => {
                    if (!user) {
                      openAuthModal('login')
                      return
                    }
                    setView('checkout')
                  }}
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
            profile={profile}
            user={user}
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
      <div className="w-20 h-20 rounded-full bg-white/[0.04] flex items-center justify-center">
        <ShoppingBag className="size-10 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-white font-medium text-lg">Your cart is empty</p>
        <p className="text-muted-foreground text-sm">
          Looks like you haven&apos;t added any books yet.
        </p>
      </div>
      <Link href="/books" onClick={onClose}>
        <Button
          variant="outline"
          className="mt-2 border-amber/30 text-amber hover:bg-amber/10 hover:text-amber"
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
      <div className="px-5 pb-4">
        {items.map((item, idx) => (
          <div key={item.bookId}>
            <div className="flex gap-3 py-3.5">
              {/* Thumbnail */}
              <div className="relative w-12 h-16 rounded-md overflow-hidden shrink-0 bg-white/[0.04] flex items-center justify-center">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <ShoppingBag className="size-5 text-muted-foreground/50" />
                )}
                {item.discountTag && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-1 py-px leading-tight rounded-bl">
                    {item.discountTag}
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium leading-tight line-clamp-1">
                  {item.title}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5 line-clamp-1">
                  {item.author}
                </p>

                {/* Price row */}
                <div className="flex items-center justify-between mt-2">
                  <div className="text-sm">
                    <span className="text-amber font-semibold">
                      ₹{item.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-muted-foreground text-xs ml-1">
                      × {item.quantity}
                    </span>
                    <span className="text-white/80 text-xs ml-1.5">
                      = ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Controls row */}
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex items-center rounded-md border border-white/10 overflow-hidden">
                    <button
                      onClick={() =>
                        onUpdateQuantity(item.bookId, item.quantity - 1)
                      }
                      className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="w-7 text-center text-xs font-medium text-white select-none">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        onUpdateQuantity(item.bookId, item.quantity + 1)
                      }
                      className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => onRemove(item.bookId)}
                    className="ml-auto w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    aria-label={`Remove ${item.title} from cart`}
                  >
                    <Trash2 className="size-3.5" />
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
// Checkout View
// =====================================================================
function CheckoutView({
  cart,
  subtotal,
  delivery,
  total,
  profile,
  user,
  onBack,
  onSuccess,
  onClose,
  clearCart,
}: {
  cart: CartItem[]
  subtotal: number
  delivery: number
  total: number
  profile: {
    full_name: string | null
    phone: string | null
    address: string | null
    city: string | null
    pincode: string | null
  } | null
  user: { id: string } | null
  onBack: () => void
  onSuccess: (orderNumber: string) => void
  onClose: () => void
  clearCart: () => void
}) {
  const [placing, setPlacing] = useState(false)

  // Shipping form state – initialised from profile on mount
  // CheckoutView is remounted each time user enters checkout, so this is fresh
  const [name, setName] = useState(() => profile?.full_name ?? '')
  const [phone, setPhone] = useState(() => profile?.phone ?? '')
  const [address, setAddress] = useState(() => profile?.address ?? '')
  const [city, setCity] = useState(() => profile?.city ?? '')
  const [pincode, setPincode] = useState(() => profile?.pincode ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const inputClass =
    'h-9 bg-white/[0.04] border-white/10 text-white placeholder:text-muted-foreground/50 text-sm focus-visible:border-amber/50 focus-visible:ring-amber/20'

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Name is required'
    if (!phone.trim()) errs.phone = 'Phone is required'
    else if (!/^\d{10}$/.test(phone.replace(/\D/g, '')))
      errs.phone = 'Enter a valid 10-digit phone'
    if (!address.trim()) errs.address = 'Address is required'
    if (!city.trim()) errs.city = 'City is required'
    if (!pincode.trim()) errs.pincode = 'Pincode is required'
    else if (!/^\d{6}$/.test(pincode.trim()))
      errs.pincode = 'Enter a valid 6-digit pincode'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleWhatsAppPay = async () => {
    if (!user || !validate()) return
    setPlacing(true)

    try {
      const supabase = createClient()

      // 1. Generate order number
      const ordNum = `KK-${Date.now().toString(36).toUpperCase()}`

      // 2. Save order
      const { error: orderError } = await supabase.from('orders').insert({
        user_id: user.id,
        order_number: ordNum,
        total_amount: subtotal,
        delivery_charge: delivery,
        grand_total: total,
        payment_method: 'whatsapp',
        payment_status: 'pending',
        order_status: 'pending',
        shipping_name: name.trim(),
        shipping_phone: phone.trim(),
        shipping_address: address.trim(),
        shipping_city: city.trim(),
        shipping_pincode: pincode.trim(),
      })

      if (orderError) throw orderError

      // 3. Fetch the created order to get its ID for order_items
      const { data: createdOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('order_number', ordNum)
        .single()

      if (!createdOrder)
        throw new Error('Failed to retrieve created order')

      // 4. Save order items
      const orderItemsData = cart.map((item) => ({
        order_id: createdOrder.id,
        book_id: item.bookId,
        book_title: item.title,
        book_author: item.author,
        book_price: item.price,
        book_original_price: item.originalPrice,
        book_image_url: item.imageUrl,
        quantity: item.quantity,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData)
      if (itemsError) throw itemsError

      // 5. Update user profile with shipping details
      await supabase
        .from('profiles')
        .update({
          full_name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          pincode: pincode.trim(),
        })
        .eq('id', user.id)

      // 6. Clear cart
      clearCart()

      // 7. Open WhatsApp with pre-filled message
      const message = `📚 *New Order — KitaabKharido*

*Order:* ${ordNum}
*Date:* ${new Date().toLocaleDateString('en-IN')}

*Items:*
${cart.map((item) => `• ${item.title} × ${item.quantity} — ₹${(item.price * item.quantity).toLocaleString('en-IN')}`).join('\n')}

*Subtotal:* ₹${subtotal.toLocaleString('en-IN')}
*Delivery:* ₹${delivery}
*Total:* ₹${total.toLocaleString('en-IN')}

*Shipping:*
${name.trim()}
${phone.trim()}
${address.trim()}
${city.trim()} - ${pincode.trim()}`

      window.open(
        `https://wa.me/919382470919?text=${encodeURIComponent(message)}`,
        '_blank'
      )

      // 8. Show success toast
      toast.success('Order placed successfully!', {
        description: `Order ${ordNum} sent via WhatsApp for payment.`,
        duration: 6000,
      })

      // 9. Switch to confirmation view
      onSuccess(ordNum)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong'
      toast.error('Failed to place order', {
        description: message,
        duration: 5000,
      })
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-muted-foreground hover:text-white hover:bg-white/5 -ml-1.5"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <SheetTitle className="text-lg font-semibold text-white">
              Checkout
            </SheetTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-white hover:bg-white/5 -mr-1.5"
          >
            <X className="size-5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-5 pb-6 space-y-5">
          {/* ── Shipping Details ──────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Truck className="size-4 text-amber" />
                Shipping Details
              </h3>
              <span className="text-xs text-muted-foreground cursor-pointer hover:text-white transition-colors">
                Edit
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <Label
                  htmlFor="shipping-name"
                  className="text-xs text-muted-foreground mb-1"
                >
                  Full Name
                </Label>
                <Input
                  id="shipping-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setErrors((p) => ({ ...p, name: '' }))
                  }}
                  placeholder="Your full name"
                  className={inputClass}
                />
                {errors.name && (
                  <p className="text-red-400 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="shipping-phone"
                  className="text-xs text-muted-foreground mb-1"
                >
                  Phone Number
                </Label>
                <Input
                  id="shipping-phone"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    setErrors((p) => ({ ...p, phone: '' }))
                  }}
                  placeholder="10-digit phone number"
                  className={inputClass}
                />
                {errors.phone && (
                  <p className="text-red-400 text-xs mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="shipping-address"
                  className="text-xs text-muted-foreground mb-1"
                >
                  Address
                </Label>
                <Input
                  id="shipping-address"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value)
                    setErrors((p) => ({ ...p, address: '' }))
                  }}
                  placeholder="Street address, house no."
                  className={inputClass}
                />
                {errors.address && (
                  <p className="text-red-400 text-xs mt-1">{errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label
                    htmlFor="shipping-city"
                    className="text-xs text-muted-foreground mb-1"
                  >
                    City
                  </Label>
                  <Input
                    id="shipping-city"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value)
                      setErrors((p) => ({ ...p, city: '' }))
                    }}
                    placeholder="City"
                    className={inputClass}
                  />
                  {errors.city && (
                    <p className="text-red-400 text-xs mt-1">{errors.city}</p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="shipping-pincode"
                    className="text-xs text-muted-foreground mb-1"
                  >
                    Pincode
                  </Label>
                  <Input
                    id="shipping-pincode"
                    value={pincode}
                    onChange={(e) => {
                      setPincode(e.target.value)
                      setErrors((p) => ({ ...p, pincode: '' }))
                    }}
                    placeholder="6-digit pincode"
                    className={inputClass}
                  />
                  {errors.pincode && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.pincode}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <Separator className="bg-white/[0.06]" />

          {/* ── Compact Order Summary ─────────────────────────────── */}
          <section>
            <h3 className="text-sm font-semibold text-white mb-3">
              Order Summary
            </h3>
            <div className="space-y-2">
              {cart.map((item) => (
                <div
                  key={item.bookId}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground truncate max-w-[70%]">
                    {item.title} × {item.quantity}
                  </span>
                  <span className="text-white shrink-0">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
              <Separator className="bg-white/[0.06] my-2" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-white">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span className="text-white">₹{delivery}</span>
              </div>
              <Separator className="bg-white/[0.06]" />
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold">Total</span>
                <span className="text-amber font-bold text-lg">
                  ₹{total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </section>

          <Separator className="bg-white/[0.06]" />

          {/* ── Payment Options ───────────────────────────────────── */}
          <section>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <CreditCard className="size-4 text-amber" />
              Payment Method
            </h3>
            <div className="space-y-2.5">
              {/* WhatsApp Pay */}
              <Button
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm"
                onClick={handleWhatsAppPay}
                disabled={placing}
              >
                {placing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Placing Order...
                  </span>
                ) : (
                  <>
                    <MessageCircle className="size-4" />
                    Pay via WhatsApp
                  </>
                )}
              </Button>

              {/* PhonePe – coming soon */}
              <Button
                className="w-full h-11 bg-white/[0.04] text-muted-foreground cursor-not-allowed relative overflow-hidden"
                disabled
              >
                <CreditCard className="size-4" />
                PhonePe
                <Badge className="ml-auto bg-white/10 text-muted-foreground text-[10px] border-white/10">
                  Coming Soon
                </Badge>
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
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
        <CheckCircle2 className="size-10 text-emerald-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white">
          Order Placed Successfully!
        </h2>
        {orderNumber && (
          <p className="text-amber font-mono text-sm font-medium">
            {orderNumber}
          </p>
        )}
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
          Your order has been sent via WhatsApp for payment. You&apos;ll
          receive a confirmation once the payment is verified.
        </p>
      </div>
      <Button
        className="mt-2 h-11 bg-amber hover:bg-amber-dark text-navy font-semibold text-sm px-8"
        onClick={onClose}
      >
        Continue Shopping
      </Button>
    </div>
  )
}
