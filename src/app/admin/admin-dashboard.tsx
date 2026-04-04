'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  Book, HeroSlide, Order, OrderItem, BookRequest, SellRequest, SiteSetting
} from '@/lib/supabase/types'
import {
  LayoutDashboard, BookOpen, ShoppingBag, ImageIcon, BookOpenText,
  IndianRupee, Settings, ArrowLeft, Menu, Plus, Pencil, Trash2,
  Loader2, Package, DollarSign, Clock, BookX, RefreshCw, Search, LogOut,
  Upload, X
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@/components/ui/sheet'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────────────────────────────

type TabId = 'dashboard' | 'books' | 'orders' | 'slides' | 'book-requests' | 'sell-requests' | 'settings'

// ─── Constants ──────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="size-4" /> },
  { id: 'books', label: 'Books', icon: <BookOpen className="size-4" /> },
  { id: 'orders', label: 'Orders', icon: <ShoppingBag className="size-4" /> },
  { id: 'slides', label: 'Hero Slides', icon: <ImageIcon className="size-4" /> },
  { id: 'book-requests', label: 'Book Requests', icon: <BookOpenText className="size-4" /> },
  { id: 'sell-requests', label: 'Sell Requests', icon: <IndianRupee className="size-4" /> },
  { id: 'settings', label: 'Site Settings', icon: <Settings className="size-4" /> },
]

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  packed: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  shipped: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  out_for_delivery: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  paid: 'bg-green-500/20 text-green-400 border-green-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  refunded: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

const REQUEST_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  found: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  not_available: 'bg-red-500/20 text-red-400 border-red-500/30',
  fulfilled: 'bg-green-500/20 text-green-400 border-green-500/30',
  reviewed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  accepted: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const CATEGORIES = ['Academic', 'Fiction', 'Self-Help', 'Others']
const CONDITIONS = ['Like New', 'Good', 'Fair']
const DISCOUNT_TAGS = ['None', '50% OFF', '60% OFF']
const ORDER_STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded']
const BOOK_REQUEST_STATUSES = ['pending', 'found', 'not_available', 'fulfilled']
const SELL_REQUEST_STATUSES = ['pending', 'reviewed', 'accepted', 'rejected']

const MAX_IMAGES = 3

const EMPTY_BOOK_FORM = {
  title: '', author: '', category: 'Academic', sub_category: '',
  price: 0, original_price: 0, discount_tag: 'None', condition: 'Like New',
  stock_quantity: 1, image_urls: [] as string[], isbn: '', publisher: '', edition: '',
  language: 'English', description: '', active: true, featured: false,
}

const EMPTY_SLIDE_FORM = {
  title: '', subtitle: '', cta_button_text: '', cta_link: '',
  background_color: '#1a2744', image_url: '', sort_order: 0, active: true,
}

const IC = "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:border-amber/50 rounded-md"
const LC = "text-xs uppercase tracking-wider text-amber/80 font-semibold"

// ─── Component ──────────────────────────────────────────────────────────────

export function AdminDashboard({ userId, userName }: { userId: string; userName?: string }) {
  const supabase = createClient()

  // Navigation
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Data
  const [books, setBooks] = useState<Book[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [bookRequests, setBookRequests] = useState<BookRequest[]>([])
  const [sellRequests, setSellRequests] = useState<SellRequest[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})

  // Book search & filter
  const [bookSearch, setBookSearch] = useState('')
  const [bookCategoryFilter, setBookCategoryFilter] = useState('all')

  // Book dialog
  const [bookDialogOpen, setBookDialogOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [bookForm, setBookForm] = useState(EMPTY_BOOK_FORM)
  const [bookSaving, setBookSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; label: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Order dialog
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [orderForm, setOrderForm] = useState({
    order_status: '', payment_status: '', tracking_url: '', tracking_number: '', admin_notes: '',
  })
  const [orderSaving, setOrderSaving] = useState(false)

  // Slide dialog
  const [slideDialogOpen, setSlideDialogOpen] = useState(false)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [slideForm, setSlideForm] = useState(EMPTY_SLIDE_FORM)
  const [slideSaving, setSlideSaving] = useState(false)

  // Request inline edits
  const [requestEdits, setRequestEdits] = useState<Record<string, { status: string; reply: string; offer_price: string }>>({})
  const [requestSaving, setRequestSaving] = useState<Record<string, boolean>>({})

  // ── Fetch Data (via API) ────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/data')
      if (!res.ok) throw new Error('Failed to fetch admin data')
      const data = await res.json()

      setBooks(data.books || [])
      setOrders(data.orders || [])
      setSlides(data.slides || [])
      setBookRequests(data.bookRequests || [])
      setSellRequests(data.sellRequests || [])

      if (data.settings && Array.isArray(data.settings)) {
        const map: Record<string, string> = {}
        data.settings.forEach((s: SiteSetting) => { if (s.key) map[s.key] = s.value || '' })
        setSettings(map)
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err)
      // Don't show toast for fetch errors - dashboard should still render
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Helpers ─────────────────────────────────────────────────────────
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  // ── Logout ──────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  // ── Computed ────────────────────────────────────────────────────────
  const totalBooks = books.length
  const totalOrders = orders.length
  const revenue = orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + o.grand_total, 0)
  const pendingOrders = orders.filter(o => o.order_status === 'pending').length
  const pendingBookRequests = bookRequests.filter(r => r.status === 'pending').length
  const pendingSellRequests = sellRequests.filter(r => r.status === 'pending').length

  const filteredBooks = useMemo(() => {
    let result = books
    if (bookSearch.trim()) {
      const q = bookSearch.toLowerCase()
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.isbn && b.isbn.toLowerCase().includes(q))
      )
    }
    if (bookCategoryFilter !== 'all') {
      result = result.filter(b => b.category === bookCategoryFilter)
    }
    return result
  }, [books, bookSearch, bookCategoryFilter])

  // ── Image Upload Helpers ────────────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const remaining = MAX_IMAGES - bookForm.image_urls.length
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`)
      return
    }

    const filesToProcess = Array.from(files).slice(0, remaining)

    filesToProcess.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`)
        return
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 2MB)`)
        return
      }

      const reader = new FileReader()
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string
        if (base64) {
          setBookForm(prev => ({
            ...prev,
            image_urls: [...prev.image_urls, base64]
          }))
        }
      }
      reader.readAsDataURL(file)
    })

    // Reset file input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeImage = (index: number) => {
    setBookForm(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index)
    }))
  }

  // ── Book CRUD ───────────────────────────────────────────────────────
  const openBookDialog = (book?: Book) => {
    if (book) {
      setEditingBook(book)
      setBookForm({
        title: book.title, author: book.author, category: book.category,
        sub_category: book.sub_category || '', price: book.price,
        original_price: book.original_price, discount_tag: book.discount_tag || 'None',
        condition: book.condition, stock_quantity: book.stock_quantity,
        image_urls: book.image_urls || [],
        isbn: book.isbn || '',
        publisher: book.publisher || '', edition: book.edition || '',
        language: book.language || 'English', description: book.description || '',
        active: book.active, featured: book.featured,
      })
    } else {
      setEditingBook(null)
      setBookForm({ ...EMPTY_BOOK_FORM, image_urls: [] })
    }
    setBookDialogOpen(true)
  }

  const saveBook = async () => {
    if (!bookForm.title.trim() || !bookForm.author.trim()) {
      toast.error('Title and Author are required')
      return
    }
    setBookSaving(true)
    try {
      const payload = {
        title: bookForm.title.trim(), author: bookForm.author.trim(),
        category: bookForm.category, sub_category: bookForm.sub_category.trim() || null,
        price: Number(bookForm.price), original_price: Number(bookForm.original_price),
        discount_tag: bookForm.discount_tag === 'None' ? null : bookForm.discount_tag,
        condition: bookForm.condition, stock_quantity: Number(bookForm.stock_quantity),
        image_urls: bookForm.image_urls,
        isbn: bookForm.isbn.trim() || null, publisher: bookForm.publisher.trim() || null,
        edition: bookForm.edition.trim() || null, language: bookForm.language.trim() || 'English',
        description: bookForm.description.trim() || null,
        active: bookForm.active, featured: bookForm.featured,
      }

      const res = editingBook
        ? await fetch('/api/admin/books', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editingBook.id, ...payload }),
          })
        : await fetch('/api/admin/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save book')

      toast.success(editingBook ? 'Book updated' : 'Book created')
      setBookDialogOpen(false)
      await fetchAll()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save book')
    } finally {
      setBookSaving(false)
    }
  }

  const confirmDelete = (type: string, id: string, label: string) => {
    setDeleteTarget({ type, id, label })
    setDeleteDialogOpen(true)
  }

  const executeDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const tableType = deleteTarget.type === 'hero_slides' ? 'slides' : deleteTarget.type
      const res = await fetch(`/api/admin/${tableType}?id=${deleteTarget.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete')

      toast.success(`${deleteTarget.label} deleted`)
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
      await fetchAll()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  // ── Order Management ────────────────────────────────────────────────
  const openOrderDialog = (order: Order) => {
    setEditingOrder(order)
    setOrderForm({
      order_status: order.order_status, payment_status: order.payment_status,
      tracking_url: order.tracking_url || '', tracking_number: order.tracking_number || '',
      admin_notes: order.admin_notes || '',
    })
    setOrderDialogOpen(true)
  }

  const saveOrder = async () => {
    if (!editingOrder) return
    setOrderSaving(true)
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingOrder.id,
          order_status: orderForm.order_status,
          payment_status: orderForm.payment_status,
          tracking_url: orderForm.tracking_url.trim() || null,
          tracking_number: orderForm.tracking_number.trim() || null,
          admin_notes: orderForm.admin_notes.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update order')

      toast.success('Order updated')
      setOrderDialogOpen(false)
      await fetchAll()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update order')
    } finally {
      setOrderSaving(false)
    }
  }

  // ── Slide CRUD ──────────────────────────────────────────────────────
  const openSlideDialog = (slide?: HeroSlide) => {
    if (slide) {
      setEditingSlide(slide)
      setSlideForm({
        title: slide.title, subtitle: slide.subtitle || '',
        cta_button_text: slide.cta_button_text || '', cta_link: slide.cta_link || '',
        background_color: slide.background_color, image_url: slide.image_url || '',
        sort_order: slide.sort_order, active: slide.active,
      })
    } else {
      setEditingSlide(null)
      setSlideForm({ ...EMPTY_SLIDE_FORM, sort_order: slides.length })
    }
    setSlideDialogOpen(true)
  }

  const saveSlide = async () => {
    if (!slideForm.title.trim()) { toast.error('Title is required'); return }
    setSlideSaving(true)
    try {
      const payload = {
        title: slideForm.title.trim(), subtitle: slideForm.subtitle.trim() || null,
        cta_button_text: slideForm.cta_button_text.trim() || null,
        cta_link: slideForm.cta_link.trim() || null,
        background_color: slideForm.background_color,
        image_url: slideForm.image_url.trim() || null,
        sort_order: Number(slideForm.sort_order), active: slideForm.active,
      }

      const res = editingSlide
        ? await fetch('/api/admin/slides', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editingSlide.id, ...payload }),
          })
        : await fetch('/api/admin/slides', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save slide')

      toast.success(editingSlide ? 'Slide updated' : 'Slide created')
      setSlideDialogOpen(false)
      await fetchAll()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save slide')
    } finally {
      setSlideSaving(false)
    }
  }

  // ── Request Management ──────────────────────────────────────────────
  const saveBookRequest = async (req: BookRequest) => {
    const edit = requestEdits[req.id] || { status: req.status, reply: req.admin_reply || '', offer_price: '' }
    setRequestSaving(prev => ({ ...prev, [req.id]: true }))
    try {
      const res = await fetch('/api/admin/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'book_requests', id: req.id,
          status: edit.status, admin_reply: edit.reply.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update')

      toast.success('Book request updated')
      await fetchAll()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setRequestSaving(prev => ({ ...prev, [req.id]: false }))
    }
  }

  const saveSellRequest = async (req: SellRequest) => {
    const edit = requestEdits[req.id] || { status: req.status, reply: req.admin_reply || '', offer_price: String(req.offer_price || '') }
    setRequestSaving(prev => ({ ...prev, [req.id]: true }))
    try {
      const res = await fetch('/api/admin/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sell_requests', id: req.id,
          status: edit.status,
          offer_price: edit.offer_price ? Number(edit.offer_price) : null,
          admin_reply: edit.reply.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update')

      toast.success('Sell request updated')
      await fetchAll()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setRequestSaving(prev => ({ ...prev, [req.id]: false }))
    }
  }

  // ── Settings ────────────────────────────────────────────────────────
  const updateSetting = async (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
    } catch {
      toast.error(`Failed to save ${key}`)
    }
  }

  // ── Sidebar Nav ─────────────────────────────────────────────────────
  const sidebarNav = (onClick?: () => void) => (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map(item => {
        const badge = item.id === 'book-requests' ? pendingBookRequests
          : item.id === 'sell-requests' ? pendingSellRequests
          : item.id === 'orders' ? pendingOrders : 0
        return (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); onClick?.() }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === item.id
                ? 'bg-amber/10 text-amber border-l-2 border-amber'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            {item.icon}
            {item.label}
            {badge > 0 && (
              <Badge variant="secondary" className="ml-auto bg-amber/20 text-amber text-[10px] px-1.5">
                {badge}
              </Badge>
            )}
          </button>
        )
      })}
    </nav>
  )

  // ── Loading ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen bg-[#060d1f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="size-8 text-amber animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  // ── Status Badge Helper ─────────────────────────────────────────────
  const StatusBadge = ({ status, colorMap }: { status: string; colorMap: Record<string, string> }) => (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${colorMap[status] || 'bg-white/10 text-white/40 border-white/10'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )

  // ═══════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="h-screen flex bg-[#060d1f] overflow-hidden">

      {/* ─── Desktop Sidebar ────────────────────────────────────────── */}
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col bg-[#040a18] border-r border-white/5">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-xl font-bold">
            <span className="text-amber">KK</span>{' '}
            <span className="text-white">Admin</span>
          </h1>
          <p className="text-xs text-white/30 mt-1">{userName ? `Hi, ${userName}` : 'Kitaab Kharido'}</p>
        </div>
        <div className="flex-1 py-4 overflow-y-auto">
          {sidebarNav()}
        </div>
        <div className="p-4 border-t border-white/5 space-y-2">
          <a href="/" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors px-2 py-1.5 rounded-md hover:bg-white/5">
            <ArrowLeft className="size-4" /> Back to Site
          </a>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-400/70 hover:text-red-400 transition-colors px-2 py-1.5 rounded-md hover:bg-red-400/10 w-full">
            <LogOut className="size-4" /> Logout
          </button>
        </div>
      </aside>

      {/* ─── Mobile Sidebar Sheet ───────────────────────────────────── */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="bg-[#040a18] border-r border-white/5 w-72 p-0">
          <SheetHeader className="p-6 border-b border-white/5">
            <SheetTitle className="text-xl font-bold">
              <span className="text-amber">KK</span>{' '}
              <span className="text-white">Admin</span>
            </SheetTitle>
            <SheetDescription className="text-white/40">Administration Panel</SheetDescription>
          </SheetHeader>
          <div className="flex-1 py-4">
            {sidebarNav(() => setMobileMenuOpen(false))}
          </div>
          <div className="p-4 border-t border-white/5 space-y-2">
            <a href="/" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors px-2 py-1.5 rounded-md hover:bg-white/5">
              <ArrowLeft className="size-4" /> Back to Site
            </a>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-400/70 hover:text-red-400 transition-colors px-2 py-1.5 rounded-md hover:bg-red-400/10 w-full">
              <LogOut className="size-4" /> Logout
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ─── Main Content Area ──────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-[#060d1f]/95 backdrop-blur-md border-b border-white/5 px-4 md:px-8 h-14 flex items-center gap-4 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white/60 hover:text-white"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <h2 className="text-lg font-semibold text-white">
            {NAV_ITEMS.find(n => n.id === activeTab)?.label || 'Dashboard'}
          </h2>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchAll} disabled={loading} className="text-white/60 hover:text-white">
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="md:hidden text-red-400/70 hover:text-red-400 hover:bg-red-400/10">
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">

          {/* ═══════════════════════════════════════════════════════════
              TAB: DASHBOARD
              ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Books', value: totalBooks, icon: <BookOpen className="size-5" />, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                  { label: 'Total Orders', value: totalOrders, icon: <ShoppingBag className="size-5" />, color: 'text-purple-400', bg: 'bg-purple-400/10' },
                  { label: 'Revenue', value: formatCurrency(revenue), icon: <DollarSign className="size-5" />, color: 'text-green-400', bg: 'bg-green-400/10' },
                  { label: 'Pending Orders', value: pendingOrders, icon: <Clock className="size-5" />, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
                ].map(stat => (
                  <div key={stat.label} className="bg-[#0f1730] border border-white/5 rounded-xl p-4 md:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`p-2.5 rounded-lg ${stat.bg} ${stat.color}`}>{stat.icon}</span>
                    </div>
                    <p className="text-2xl lg:text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm text-white/40 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Pending Requests Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  className="bg-[#0f1730] border border-white/5 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-amber/20 transition-colors"
                  onClick={() => setActiveTab('book-requests')}
                >
                  <div className="p-3 rounded-lg bg-amber/10 text-amber"><BookX className="size-5" /></div>
                  <div>
                    <p className="text-xl font-bold text-white">{pendingBookRequests}</p>
                    <p className="text-sm text-white/40">Pending Book Requests</p>
                  </div>
                </div>
                <div
                  className="bg-[#0f1730] border border-white/5 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-amber/20 transition-colors"
                  onClick={() => setActiveTab('sell-requests')}
                >
                  <div className="p-3 rounded-lg bg-amber/10 text-amber"><Package className="size-5" /></div>
                  <div>
                    <p className="text-xl font-bold text-white">{pendingSellRequests}</p>
                    <p className="text-sm text-white/40">Pending Sell Requests</p>
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-[#0f1730] border border-white/5 rounded-xl overflow-hidden">
                <div className="p-4 md:p-6 border-b border-white/5">
                  <h3 className="text-lg font-semibold text-white">Recent Orders</h3>
                  <p className="text-sm text-white/40">Latest 10 orders</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-left">
                        <th className="px-4 py-3 text-white/40 font-medium">Order #</th>
                        <th className="px-4 py-3 text-white/40 font-medium">Date</th>
                        <th className="px-4 py-3 text-white/40 font-medium hidden sm:table-cell">Customer</th>
                        <th className="px-4 py-3 text-white/40 font-medium">Total</th>
                        <th className="px-4 py-3 text-white/40 font-medium">Status</th>
                        <th className="px-4 py-3 text-white/40 font-medium">Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-white/30">No orders yet</td></tr>
                      ) : (
                        orders.slice(0, 10).map(order => (
                          <tr key={order.id} onClick={() => openOrderDialog(order)} className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                            <td className="px-4 py-3 text-amber font-mono text-xs">{order.order_number}</td>
                            <td className="px-4 py-3 text-white/60">{formatDate(order.created_at)}</td>
                            <td className="px-4 py-3 text-white hidden sm:table-cell">{order.shipping_name}</td>
                            <td className="px-4 py-3 text-white font-medium">{formatCurrency(order.grand_total)}</td>
                            <td className="px-4 py-3"><StatusBadge status={order.order_status} colorMap={ORDER_STATUS_COLORS} /></td>
                            <td className="px-4 py-3"><StatusBadge status={order.payment_status} colorMap={PAYMENT_STATUS_COLORS} /></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              TAB: BOOKS
              ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'books' && (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 w-full sm:w-auto">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                    <Input
                      className={`${IC} pl-9`}
                      placeholder="Search by title, author, ISBN..."
                      value={bookSearch}
                      onChange={e => setBookSearch(e.target.value)}
                    />
                  </div>
                  <Select value={bookCategoryFilter} onValueChange={setBookCategoryFilter}>
                    <SelectTrigger className={`${IC} w-full sm:w-40`}>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f1730] border-white/10">
                      <SelectItem value="all">All Categories</SelectItem>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => openBookDialog()} className="bg-amber hover:bg-amber/90 text-black font-semibold">
                  <Plus className="size-4" /> Add Book
                </Button>
              </div>

              <p className="text-sm text-white/40">
                {filteredBooks.length} of {totalBooks} books
              </p>

              {/* Books Table */}
              <div className="bg-[#0f1730] border border-white/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-[#0f1730] z-10">
                      <tr className="border-b border-white/5 text-left">
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap">Title</th>
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap">Author</th>
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap hidden md:table-cell">Category</th>
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap">Price</th>
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap hidden lg:table-cell">Orig.</th>
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap hidden lg:table-cell">Discount</th>
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap hidden xl:table-cell">Condition</th>
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap hidden lg:table-cell">Stock</th>
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap hidden xl:table-cell">Active</th>
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBooks.length === 0 ? (
                        <tr><td colSpan={10} className="px-4 py-8 text-center text-white/30">No books found</td></tr>
                      ) : (
                        filteredBooks.map(book => (
                          <tr key={book.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 text-white font-medium max-w-[200px] truncate">{book.title}</td>
                            <td className="px-4 py-3 text-white/60 max-w-[150px] truncate">{book.author}</td>
                            <td className="px-4 py-3 text-white/50 hidden md:table-cell">
                              <Badge variant="outline" className="border-white/10 text-white/50 text-xs">{book.category}</Badge>
                            </td>
                            <td className="px-4 py-3 text-amber font-medium">{formatCurrency(book.price)}</td>
                            <td className="px-4 py-3 text-white/30 line-through hidden lg:table-cell">{formatCurrency(book.original_price)}</td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              {book.discount_tag ? (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">{book.discount_tag}</Badge>
                              ) : <span className="text-white/20">&mdash;</span>}
                            </td>
                            <td className="px-4 py-3 text-white/50 hidden xl:table-cell">{book.condition}</td>
                            <td className="px-4 py-3 text-white/50 hidden lg:table-cell">{book.stock_quantity}</td>
                            <td className="px-4 py-3 hidden xl:table-cell">
                              <span className={`inline-block w-2 h-2 rounded-full ${book.active ? 'bg-green-400' : 'bg-red-400'}`} />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="size-8 text-white/40 hover:text-amber" onClick={() => openBookDialog(book)}>
                                  <Pencil className="size-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="size-8 text-white/40 hover:text-red-400" onClick={() => confirmDelete('books', book.id, book.title)}>
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              TAB: ORDERS
              ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <p className="text-sm text-white/40">{orders.length} orders</p>
              <div className="bg-[#0f1730] border border-white/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-[calc(100vh-220px)] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-[#0f1730] z-10">
                      <tr className="border-b border-white/5 text-left">
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap">Order #</th>
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap">Date</th>
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap hidden md:table-cell">Customer</th>
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap hidden lg:table-cell">Items</th>
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap">Total</th>
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap">Order</th>
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap">Payment</th>
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr><td colSpan={8} className="px-4 py-8 text-center text-white/30">No orders yet</td></tr>
                      ) : (
                        orders.map(order => (
                          <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 text-amber font-mono text-xs">{order.order_number}</td>
                            <td className="px-4 py-3 text-white/60">{formatDate(order.created_at)}</td>
                            <td className="px-4 py-3 text-white hidden md:table-cell">{order.shipping_name}</td>
                            <td className="px-4 py-3 text-white/50 hidden lg:table-cell">{order.order_items?.length || 0}</td>
                            <td className="px-4 py-3 text-white font-medium">{formatCurrency(order.grand_total)}</td>
                            <td className="px-4 py-3"><StatusBadge status={order.order_status} colorMap={ORDER_STATUS_COLORS} /></td>
                            <td className="px-4 py-3"><StatusBadge status={order.payment_status} colorMap={PAYMENT_STATUS_COLORS} /></td>
                            <td className="px-4 py-3">
                              <Button variant="ghost" size="icon" className="size-8 text-white/40 hover:text-amber" onClick={() => openOrderDialog(order)}>
                                <Pencil className="size-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              TAB: HERO SLIDES
              ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'slides' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/40">{slides.length} slides</p>
                <Button onClick={() => openSlideDialog()} className="bg-amber hover:bg-amber/90 text-black font-semibold">
                  <Plus className="size-4" /> Add Slide
                </Button>
              </div>

              <div className="grid gap-4">
                {slides.length === 0 ? (
                  <div className="bg-[#0f1730] border border-white/5 rounded-xl p-8 text-center text-white/30">No slides yet</div>
                ) : (
                  slides.map(slide => (
                    <div key={slide.id} className="bg-[#0f1730] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      {slide.image_url ? (
                        <img src={slide.image_url} alt="" className="w-24 h-16 object-cover rounded-lg flex-shrink-0" />
                      ) : (
                        <div className="w-24 h-16 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: slide.background_color }}>
                          <ImageIcon className="size-6 text-white/40" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium truncate">{slide.title}</p>
                          <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${slide.active ? 'bg-green-400' : 'bg-red-400'}`} />
                        </div>
                        {slide.subtitle && <p className="text-sm text-white/40 truncate">{slide.subtitle}</p>}
                        <p className="text-xs text-white/30 mt-1">Sort: {slide.sort_order}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="size-8 text-white/40 hover:text-amber" onClick={() => openSlideDialog(slide)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8 text-white/40 hover:text-red-400" onClick={() => confirmDelete('hero_slides', slide.id, `Slide: ${slide.title}`)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              TAB: BOOK REQUESTS
              ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'book-requests' && (
            <div className="space-y-4">
              <p className="text-sm text-white/40">{bookRequests.length} requests</p>
              <div className="bg-[#0f1730] border border-white/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-[calc(100vh-220px)] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-[#0f1730] z-10">
                      <tr className="border-b border-white/5 text-left">
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap">Book</th>
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap hidden md:table-cell">Requested By</th>
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap">Date</th>
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap">Status</th>
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap">Reply</th>
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookRequests.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-white/30">No book requests</td></tr>
                      ) : (
                        bookRequests.map(req => {
                          const edit = requestEdits[req.id] || {
                            status: req.status, reply: req.admin_reply || '', offer_price: '',
                          }
                          return (
                            <tr key={req.id} className="border-b border-white/5 hover:bg-white/5 transition-colors align-top">
                              <td className="px-4 py-3">
                                <p className="text-white font-medium">{req.book_title}</p>
                                {req.author && <p className="text-xs text-white/40">{req.author}</p>}
                                {req.notes && <p className="text-xs text-white/30 mt-1">{req.notes}</p>}
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell">
                                <p className="text-white/70">{req.user_name || 'User'}</p>
                                {req.user_email && <p className="text-xs text-white/40">{req.user_email}</p>}
                                {req.user_phone && <p className="text-xs text-white/40">{req.user_phone}</p>}
                              </td>
                              <td className="px-4 py-3 text-white/50">{formatDate(req.created_at)}</td>
                              <td className="px-4 py-3">
                                <Select
                                  value={edit.status}
                                  onValueChange={v => setRequestEdits(prev => ({ ...prev, [req.id]: { ...edit, status: v } }))}
                                >
                                  <SelectTrigger className={`${IC} w-36 text-xs h-8`}><SelectValue /></SelectTrigger>
                                  <SelectContent className="bg-[#0f1730] border-white/10">
                                    {BOOK_REQUEST_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="px-4 py-3">
                                <Input
                                  className={`${IC} text-xs h-8`}
                                  placeholder="Reply..."
                                  value={edit.reply}
                                  onChange={e => setRequestEdits(prev => ({ ...prev, [req.id]: { ...edit, reply: e.target.value } }))}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  size="sm"
                                  className="bg-amber hover:bg-amber/90 text-black text-xs h-8"
                                  disabled={requestSaving[req.id]}
                                  onClick={() => saveBookRequest(req)}
                                >
                                  {requestSaving[req.id] ? <Loader2 className="size-3 animate-spin" /> : 'Save'}
                                </Button>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              TAB: SELL REQUESTS
              ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'sell-requests' && (
            <div className="space-y-4">
              <p className="text-sm text-white/40">{sellRequests.length} requests</p>
              <div className="bg-[#0f1730] border border-white/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-[calc(100vh-220px)] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-[#0f1730] z-10">
                      <tr className="border-b border-white/5 text-left">
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap">Book</th>
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap hidden md:table-cell">Seller</th>
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap">Asking</th>
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap">Status</th>
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap">Offer</th>
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap">Reply</th>
                        <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellRequests.length === 0 ? (
                        <tr><td colSpan={7} className="px-4 py-8 text-center text-white/30">No sell requests</td></tr>
                      ) : (
                        sellRequests.map(req => {
                          const edit = requestEdits[req.id] || {
                            status: req.status,
                            reply: req.admin_reply || '',
                            offer_price: String(req.offer_price || ''),
                          }
                          return (
                            <tr key={req.id} className="border-b border-white/5 hover:bg-white/5 transition-colors align-top">
                              <td className="px-4 py-3">
                                <p className="text-white font-medium">{req.book_title}</p>
                                {req.author && <p className="text-xs text-white/40">{req.author}</p>}
                                <p className="text-xs text-white/30">{req.book_condition}</p>
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell">
                                <p className="text-white/70">{req.user_name}</p>
                                {req.user_email && <p className="text-xs text-white/40">{req.user_email}</p>}
                                {req.user_phone && <p className="text-xs text-white/40">{req.user_phone}</p>}
                              </td>
                              <td className="px-4 py-3 text-amber font-medium">
                                {req.asking_price ? formatCurrency(req.asking_price) : 'N/A'}
                              </td>
                              <td className="px-4 py-3">
                                <Select
                                  value={edit.status}
                                  onValueChange={v => setRequestEdits(prev => ({ ...prev, [req.id]: { ...edit, status: v } }))}
                                >
                                  <SelectTrigger className={`${IC} w-32 text-xs h-8`}><SelectValue /></SelectTrigger>
                                  <SelectContent className="bg-[#0f1730] border-white/10">
                                    {SELL_REQUEST_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="px-4 py-3">
                                <Input
                                  type="number"
                                  className={`${IC} text-xs h-8 w-24`}
                                  placeholder="₹ 0"
                                  value={edit.offer_price}
                                  onChange={e => setRequestEdits(prev => ({ ...prev, [req.id]: { ...edit, offer_price: e.target.value } }))}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Input
                                  className={`${IC} text-xs h-8`}
                                  placeholder="Reply..."
                                  value={edit.reply}
                                  onChange={e => setRequestEdits(prev => ({ ...prev, [req.id]: { ...edit, reply: e.target.value } }))}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  size="sm"
                                  className="bg-amber hover:bg-amber/90 text-black text-xs h-8"
                                  disabled={requestSaving[req.id]}
                                  onClick={() => saveSellRequest(req)}
                                >
                                  {requestSaving[req.id] ? <Loader2 className="size-3 animate-spin" /> : 'Save'}
                                </Button>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              TAB: SITE SETTINGS
              ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <p className="text-sm text-white/40">{Object.keys(settings).length} settings</p>
              <div className="bg-[#0f1730] border border-white/5 rounded-xl overflow-hidden">
                <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
                  {Object.keys(settings).length === 0 ? (
                    <div className="p-8 text-center text-white/30">No settings found</div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {Object.entries(settings).map(([key, value]) => (
                        <div key={key} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4">
                          <div className="flex-1 min-w-0 w-full sm:w-auto">
                            <Label className={LC}>{key}</Label>
                            <p className="text-xs text-white/30 mt-0.5 truncate">{value}</p>
                          </div>
                          <div className="w-full sm:w-96 flex-shrink-0">
                            <Input
                              className={IC}
                              value={value}
                              onChange={e => updateSetting(key, e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          DIALOGS
          ═══════════════════════════════════════════════════════════════ */}

      {/* ─── Book Dialog ────────────────────────────────────────────── */}
      <Dialog open={bookDialogOpen} onOpenChange={setBookDialogOpen}>
        <DialogContent className="bg-[#0f1730] border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">{editingBook ? 'Edit Book' : 'Add New Book'}</DialogTitle>
            <DialogDescription className="text-white/40">
              {editingBook ? 'Update book details below.' : 'Fill in the book details to add it to the catalog.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={LC}>Title *</Label>
                <Input className={IC} value={bookForm.title} onChange={e => setBookForm(p => ({ ...p, title: e.target.value }))} placeholder="Book Title" />
              </div>
              <div className="space-y-2">
                <Label className={LC}>Author *</Label>
                <Input className={IC} value={bookForm.author} onChange={e => setBookForm(p => ({ ...p, author: e.target.value }))} placeholder="Author Name" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className={LC}>Category</Label>
                <Select value={bookForm.category} onValueChange={v => setBookForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger className={`${IC} w-full`}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0f1730] border-white/10">{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={LC}>Sub-Category</Label>
                <Input className={IC} value={bookForm.sub_category} onChange={e => setBookForm(p => ({ ...p, sub_category: e.target.value }))} placeholder="e.g. JEE Physics" />
              </div>
              <div className="space-y-2">
                <Label className={LC}>Language</Label>
                <Input className={IC} value={bookForm.language} onChange={e => setBookForm(p => ({ ...p, language: e.target.value }))} placeholder="English" />
              </div>
            </div>

            <Separator className="bg-white/5" />
            <p className="text-xs uppercase tracking-wider text-amber/60 font-semibold">Pricing</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className={LC}>Selling Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">₹</span>
                  <Input type="number" className={`${IC} pl-7`} value={bookForm.price} onChange={e => setBookForm(p => ({ ...p, price: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className={LC}>Original Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">₹</span>
                  <Input type="number" className={`${IC} pl-7`} value={bookForm.original_price} onChange={e => setBookForm(p => ({ ...p, original_price: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className={LC}>Discount Tag</Label>
                <Select value={bookForm.discount_tag} onValueChange={v => setBookForm(p => ({ ...p, discount_tag: v }))}>
                  <SelectTrigger className={`${IC} w-full`}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0f1730] border-white/10">{DISCOUNT_TAGS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={LC}>Condition</Label>
                <Select value={bookForm.condition} onValueChange={v => setBookForm(p => ({ ...p, condition: v }))}>
                  <SelectTrigger className={`${IC} w-full`}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0f1730] border-white/10">{CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={LC}>Stock Quantity</Label>
                <Input type="number" className={IC} value={bookForm.stock_quantity} onChange={e => setBookForm(p => ({ ...p, stock_quantity: Number(e.target.value) }))} />
              </div>
            </div>

            <Separator className="bg-white/5" />
            <p className="text-xs uppercase tracking-wider text-amber/60 font-semibold">Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className={LC}>ISBN</Label>
                <Input className={IC} value={bookForm.isbn} onChange={e => setBookForm(p => ({ ...p, isbn: e.target.value }))} placeholder="ISBN" />
              </div>
              <div className="space-y-2">
                <Label className={LC}>Publisher</Label>
                <Input className={IC} value={bookForm.publisher} onChange={e => setBookForm(p => ({ ...p, publisher: e.target.value }))} placeholder="Publisher" />
              </div>
              <div className="space-y-2">
                <Label className={LC}>Edition</Label>
                <Input className={IC} value={bookForm.edition} onChange={e => setBookForm(p => ({ ...p, edition: e.target.value }))} placeholder="Edition" />
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label className={LC}>
                Images ({bookForm.image_urls.length}/{MAX_IMAGES})
              </Label>
              <div className="space-y-3">
                {/* Preview Thumbnails */}
                {bookForm.image_urls.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {bookForm.image_urls.map((url, idx) => (
                      <div key={idx} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-white/10">
                        <img src={url} alt={`Book image ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="size-3 text-white" />
                        </button>
                        <span className="absolute bottom-1 left-1 text-[10px] text-white/60 bg-black/50 rounded px-1">
                          {idx === 0 ? 'Cover' : `#${idx + 1}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                {bookForm.image_urls.length < MAX_IMAGES && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-white/10 text-white/40 hover:text-white/60 hover:border-white/20 transition-colors w-full justify-center"
                    >
                      <Upload className="size-4" />
                      <span className="text-sm">
                        {bookForm.image_urls.length === 0
                          ? 'Click to upload images (JPG, PNG, WebP)'
                          : 'Add more images'}
                      </span>
                    </button>
                    <p className="text-xs text-white/20 mt-1">
                      Max {MAX_IMAGES} images, 2MB each. First image will be the cover.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className={LC}>Description</Label>
              <Textarea className={IC} rows={3} value={bookForm.description} onChange={e => setBookForm(p => ({ ...p, description: e.target.value }))} placeholder="Book description..." />
            </div>

            <Separator className="bg-white/5" />
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={bookForm.active} onCheckedChange={v => setBookForm(p => ({ ...p, active: v }))} />
                <Label className="text-sm text-white/70">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={bookForm.featured} onCheckedChange={v => setBookForm(p => ({ ...p, featured: v }))} />
                <Label className="text-sm text-white/70">Featured</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookDialogOpen(false)} className="border-white/10 text-white/60 hover:text-white hover:bg-white/5">Cancel</Button>
            <Button onClick={saveBook} disabled={bookSaving} className="bg-amber hover:bg-amber/90 text-black font-semibold">
              {bookSaving && <Loader2 className="size-4 animate-spin" />}
              {editingBook ? 'Update Book' : 'Create Book'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Dialog ──────────────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#0f1730] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription className="text-white/40">
              Are you sure you want to delete &ldquo;{deleteTarget?.label}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white/60 hover:text-white hover:bg-white/5">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
              {deleting && <Loader2 className="size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Order Dialog ───────────────────────────────────────────── */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="bg-[#0f1730] border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Manage Order</DialogTitle>
            <DialogDescription className="text-white/40">Update order status, tracking, and notes.</DialogDescription>
          </DialogHeader>
          {editingOrder && (
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-white/40 mb-1">Order Number</p>
                  <p className="text-amber font-mono text-sm">{editingOrder.order_number}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1">Date</p>
                  <p className="text-white text-sm">{formatDate(editingOrder.created_at)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-white/40 mb-1">Customer</p>
                  <p className="text-white text-sm">{editingOrder.shipping_name}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1">Phone</p>
                  <p className="text-white text-sm">{editingOrder.shipping_phone}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Shipping Address</p>
                <p className="text-white text-sm">{editingOrder.shipping_address}, {editingOrder.shipping_city} - {editingOrder.shipping_pincode}</p>
              </div>
              <Separator className="bg-white/5" />
              <div>
                <p className="text-xs text-white/40 mb-2">Items ({editingOrder.order_items?.length || 0})</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(editingOrder.order_items || []).map((item: OrderItem) => (
                    <div key={item.id} className="flex items-center gap-3 bg-white/5 rounded-lg p-2">
                      {item.book_image_url ? (
                        <img src={item.book_image_url} alt="" className="size-10 object-cover rounded" />
                      ) : (
                        <div className="size-10 bg-white/10 rounded flex items-center justify-center"><BookOpen className="size-4 text-white/30" /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{item.book_title}</p>
                        <p className="text-xs text-white/40">Qty: {item.quantity} &times; {formatCurrency(item.book_price)}</p>
                      </div>
                      <p className="text-sm text-amber font-medium">{formatCurrency(item.book_price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-white/40">Subtotal</p>
                  <p className="text-white">{formatCurrency(editingOrder.total_amount)}</p>
                </div>
                <div>
                  <p className="text-white/40">Delivery</p>
                  <p className="text-white">{formatCurrency(editingOrder.delivery_charge)}</p>
                </div>
                <div>
                  <p className="text-white/40">Grand Total</p>
                  <p className="text-amber font-semibold">{formatCurrency(editingOrder.grand_total)}</p>
                </div>
              </div>

              <Separator className="bg-white/5" />
              <p className="text-xs uppercase tracking-wider text-amber/60 font-semibold">Update Order</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={LC}>Order Status</Label>
                  <Select value={orderForm.order_status} onValueChange={v => setOrderForm(p => ({ ...p, order_status: v }))}>
                    <SelectTrigger className={`${IC} w-full`}><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0f1730] border-white/10">{ORDER_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className={LC}>Payment Status</Label>
                  <Select value={orderForm.payment_status} onValueChange={v => setOrderForm(p => ({ ...p, payment_status: v }))}>
                    <SelectTrigger className={`${IC} w-full`}><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0f1730] border-white/10">{PAYMENT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={LC}>Tracking URL</Label>
                  <Input className={IC} value={orderForm.tracking_url} onChange={e => setOrderForm(p => ({ ...p, tracking_url: e.target.value }))} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label className={LC}>Tracking Number</Label>
                  <Input className={IC} value={orderForm.tracking_number} onChange={e => setOrderForm(p => ({ ...p, tracking_number: e.target.value }))} placeholder="Tracking ID" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className={LC}>Admin Notes</Label>
                <Textarea className={IC} rows={3} value={orderForm.admin_notes} onChange={e => setOrderForm(p => ({ ...p, admin_notes: e.target.value }))} placeholder="Internal notes..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderDialogOpen(false)} className="border-white/10 text-white/60 hover:text-white hover:bg-white/5">Cancel</Button>
            <Button onClick={saveOrder} disabled={orderSaving} className="bg-amber hover:bg-amber/90 text-black font-semibold">
              {orderSaving && <Loader2 className="size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Slide Dialog ───────────────────────────────────────────── */}
      <Dialog open={slideDialogOpen} onOpenChange={setSlideDialogOpen}>
        <DialogContent className="bg-[#0f1730] border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{editingSlide ? 'Edit Slide' : 'Add New Slide'}</DialogTitle>
            <DialogDescription className="text-white/40">Configure the hero slide.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label className={LC}>Title *</Label>
              <Input className={IC} value={slideForm.title} onChange={e => setSlideForm(p => ({ ...p, title: e.target.value }))} placeholder="Slide title" />
            </div>
            <div className="space-y-2">
              <Label className={LC}>Subtitle</Label>
              <Input className={IC} value={slideForm.subtitle} onChange={e => setSlideForm(p => ({ ...p, subtitle: e.target.value }))} placeholder="Subtitle text" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={LC}>CTA Button Text</Label>
                <Input className={IC} value={slideForm.cta_button_text} onChange={e => setSlideForm(p => ({ ...p, cta_button_text: e.target.value }))} placeholder="Browse Books" />
              </div>
              <div className="space-y-2">
                <Label className={LC}>CTA Link</Label>
                <Input className={IC} value={slideForm.cta_link} onChange={e => setSlideForm(p => ({ ...p, cta_link: e.target.value }))} placeholder="/books" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={LC}>Background Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={slideForm.background_color} onChange={e => setSlideForm(p => ({ ...p, background_color: e.target.value }))} className="size-10 rounded cursor-pointer border border-white/10" />
                  <Input className={IC} value={slideForm.background_color} onChange={e => setSlideForm(p => ({ ...p, background_color: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className={LC}>Sort Order</Label>
                <Input type="number" className={IC} value={slideForm.sort_order} onChange={e => setSlideForm(p => ({ ...p, sort_order: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className={LC}>Image URL</Label>
              <Input className={IC} value={slideForm.image_url} onChange={e => setSlideForm(p => ({ ...p, image_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={slideForm.active} onCheckedChange={v => setSlideForm(p => ({ ...p, active: v }))} />
              <Label className="text-sm text-white/70">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSlideDialogOpen(false)} className="border-white/10 text-white/60 hover:text-white hover:bg-white/5">Cancel</Button>
            <Button onClick={saveSlide} disabled={slideSaving} className="bg-amber hover:bg-amber/90 text-black font-semibold">
              {slideSaving && <Loader2 className="size-4 animate-spin" />}
              {editingSlide ? 'Update Slide' : 'Create Slide'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
