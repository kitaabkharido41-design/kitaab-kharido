'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  Book, HeroSlide, Order, OrderItem, BookRequest, SellRequest, SiteSetting
} from '@/lib/supabase/types'
import {
  LayoutDashboard, BookOpen, ShoppingBag, ImageIcon, BookOpenText,
  IndianRupee, Settings, ArrowLeft, Menu, Plus, Pencil, Trash2,
  Loader2, Package, DollarSign, Clock, BookX, RefreshCw, Save, Eye, LogOut
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

interface NavItem {
  id: TabId
  label: string
  icon: React.ReactNode
}

// ─── Constants ──────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
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

const CATEGORIES = ['Academic', 'Fiction', 'Self-Help', 'Others']
const CONDITIONS = ['Like New', 'Good', 'Fair']
const DISCOUNT_TAGS = ['None', '50% OFF', '60% OFF']
const ORDER_STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded']
const BOOK_REQUEST_STATUSES = ['pending', 'found', 'not_available', 'fulfilled']
const SELL_REQUEST_STATUSES = ['pending', 'reviewed', 'accepted', 'rejected']

const emptyBookForm = {
  title: '', author: '', category: 'Academic', sub_category: '',
  price: 0, original_price: 0, discount_tag: 'None', condition: 'Like New',
  stock_quantity: 1, image_urls: '', isbn: '', publisher: '', edition: '',
  language: 'English', description: '', active: true, featured: false,
}

const emptySlideForm = {
  title: '', subtitle: '', cta_button_text: '', cta_link: '',
  background_color: '#1a2744', image_url: '', sort_order: 0, active: true,
}

// ─── Component ──────────────────────────────────────────────────────────────

export function AdminDashboard({ userId }: { userId: string }) {
  const supabase = createClient()

  // ── State ───────────────────────────────────────────────────────────
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

  // Book dialog
  const [bookDialogOpen, setBookDialogOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [bookForm, setBookForm] = useState(emptyBookForm)
  const [bookSaving, setBookSaving] = useState(false)

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
  const [slideForm, setSlideForm] = useState(emptySlideForm)
  const [slideSaving, setSlideSaving] = useState(false)

  // Request inline edits
  const [requestEdits, setRequestEdits] = useState<Record<string, { status: string; reply: string; offer_price: string }>>({})
  const [requestSaving, setRequestSaving] = useState<Record<string, boolean>>({})

  // ── Fetch Data ──────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [booksRes, ordersRes, slidesRes, bookRequestsRes, sellRequestsRes, settingsRes] = await Promise.all([
        supabase.from('books').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
        supabase.from('hero_slides').select('*').order('sort_order'),
        supabase.from('book_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('sell_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('site_settings').select('*'),
      ])

      if (booksRes.data) setBooks(booksRes.data as Book[])
      if (ordersRes.data) setOrders(ordersRes.data as Order[])
      if (slidesRes.data) setSlides(slidesRes.data as HeroSlide[])
      if (bookRequestsRes.data) setBookRequests(bookRequestsRes.data as BookRequest[])
      if (sellRequestsRes.data) setSellRequests(sellRequestsRes.data as SellRequest[])
      if (settingsRes.data) {
        const map: Record<string, string> = {}
        ;(settingsRes.data as SiteSetting[]).forEach(s => { if (s.key) map[s.key] = s.value || '' })
        setSettings(map)
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Helpers ─────────────────────────────────────────────────────────
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  const refreshAfterMutation = useCallback(async (table: string) => {
    const res = await supabase.from(table).select('*').order('created_at', { ascending: false })
    if (res.data) {
      if (table === 'books') setBooks(res.data as Book[])
      else if (table === 'orders') setOrders(res.data as Order[])
      else if (table === 'book_requests') setBookRequests(res.data as BookRequest[])
      else if (table === 'sell_requests') setSellRequests(res.data as SellRequest[])
      else if (table === 'hero_slides') {
        const sorted = (res.data as HeroSlide[]).sort((a, b) => a.sort_order - b.sort_order)
        setSlides(sorted)
      }
    }
  }, [supabase])

  // ── Book CRUD ───────────────────────────────────────────────────────
  const openBookDialog = (book?: Book) => {
    if (book) {
      setEditingBook(book)
      setBookForm({
        title: book.title,
        author: book.author,
        category: book.category,
        sub_category: book.sub_category || '',
        price: book.price,
        original_price: book.original_price,
        discount_tag: book.discount_tag || 'None',
        condition: book.condition,
        stock_quantity: book.stock_quantity,
        image_urls: (book.image_urls || []).join('\n'),
        isbn: book.isbn || '',
        publisher: book.publisher || '',
        edition: book.edition || '',
        language: book.language || 'English',
        description: book.description || '',
        active: book.active,
        featured: book.featured,
      })
    } else {
      setEditingBook(null)
      setBookForm(emptyBookForm)
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
        title: bookForm.title.trim(),
        author: bookForm.author.trim(),
        category: bookForm.category,
        sub_category: bookForm.sub_category.trim() || null,
        price: Number(bookForm.price),
        original_price: Number(bookForm.original_price),
        discount_tag: bookForm.discount_tag === 'None' ? null : bookForm.discount_tag,
        condition: bookForm.condition,
        stock_quantity: Number(bookForm.stock_quantity),
        image_urls: bookForm.image_urls.split('\n').map(u => u.trim()).filter(Boolean),
        isbn: bookForm.isbn.trim() || null,
        publisher: bookForm.publisher.trim() || null,
        edition: bookForm.edition.trim() || null,
        language: bookForm.language.trim() || 'English',
        description: bookForm.description.trim() || null,
        active: bookForm.active,
        featured: bookForm.featured,
      }
      if (editingBook) {
        const { error } = await supabase.from('books').update(payload).eq('id', editingBook.id)
        if (error) throw error
        toast.success('Book updated')
      } else {
        const { error } = await supabase.from('books').insert(payload)
        if (error) throw error
        toast.success('Book created')
      }
      setBookDialogOpen(false)
      await refreshAfterMutation('books')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save book'
      toast.error(msg)
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
      const { error } = await supabase.from(deleteTarget.type).delete().eq('id', deleteTarget.id)
      if (error) throw error
      toast.success(`${deleteTarget.label} deleted`)
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
      await refreshAfterMutation(deleteTarget.type)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete'
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  // ── Order Management ────────────────────────────────────────────────
  const openOrderDialog = (order: Order) => {
    setEditingOrder(order)
    setOrderForm({
      order_status: order.order_status,
      payment_status: order.payment_status,
      tracking_url: order.tracking_url || '',
      tracking_number: order.tracking_number || '',
      admin_notes: order.admin_notes || '',
    })
    setOrderDialogOpen(true)
  }

  const saveOrder = async () => {
    if (!editingOrder) return
    setOrderSaving(true)
    try {
      const { error } = await supabase.from('orders').update({
        order_status: orderForm.order_status,
        payment_status: orderForm.payment_status,
        tracking_url: orderForm.tracking_url.trim() || null,
        tracking_number: orderForm.tracking_number.trim() || null,
        admin_notes: orderForm.admin_notes.trim() || null,
      }).eq('id', editingOrder.id)
      if (error) throw error
      toast.success('Order updated')
      setOrderDialogOpen(false)
      await refreshAfterMutation('orders')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update order'
      toast.error(msg)
    } finally {
      setOrderSaving(false)
    }
  }

  // ── Slide CRUD ──────────────────────────────────────────────────────
  const openSlideDialog = (slide?: HeroSlide) => {
    if (slide) {
      setEditingSlide(slide)
      setSlideForm({
        title: slide.title,
        subtitle: slide.subtitle || '',
        cta_button_text: slide.cta_button_text || '',
        cta_link: slide.cta_link || '',
        background_color: slide.background_color,
        image_url: slide.image_url || '',
        sort_order: slide.sort_order,
        active: slide.active,
      })
    } else {
      setEditingSlide(null)
      setSlideForm({ ...emptySlideForm, sort_order: slides.length })
    }
    setSlideDialogOpen(true)
  }

  const saveSlide = async () => {
    if (!slideForm.title.trim()) {
      toast.error('Title is required')
      return
    }
    setSlideSaving(true)
    try {
      const payload = {
        title: slideForm.title.trim(),
        subtitle: slideForm.subtitle.trim() || null,
        cta_button_text: slideForm.cta_button_text.trim() || null,
        cta_link: slideForm.cta_link.trim() || null,
        background_color: slideForm.background_color,
        image_url: slideForm.image_url.trim() || null,
        sort_order: Number(slideForm.sort_order),
        active: slideForm.active,
      }
      if (editingSlide) {
        const { error } = await supabase.from('hero_slides').update(payload).eq('id', editingSlide.id)
        if (error) throw error
        toast.success('Slide updated')
      } else {
        const { error } = await supabase.from('hero_slides').insert(payload)
        if (error) throw error
        toast.success('Slide created')
      }
      setSlideDialogOpen(false)
      await refreshAfterMutation('hero_slides')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save slide'
      toast.error(msg)
    } finally {
      setSlideSaving(false)
    }
  }

  // ── Request Management ──────────────────────────────────────────────
  const saveBookRequest = async (req: BookRequest) => {
    const edit = requestEdits[req.id] || { status: req.status, reply: req.admin_reply || '', offer_price: '' }
    setRequestSaving(prev => ({ ...prev, [req.id]: true }))
    try {
      const { error } = await supabase.from('book_requests').update({
        status: edit.status,
        admin_reply: edit.reply.trim() || null,
      }).eq('id', req.id)
      if (error) throw error
      toast.success('Book request updated')
      await refreshAfterMutation('book_requests')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update'
      toast.error(msg)
    } finally {
      setRequestSaving(prev => ({ ...prev, [req.id]: false }))
    }
  }

  const saveSellRequest = async (req: SellRequest) => {
    const edit = requestEdits[req.id] || { status: req.status, reply: req.admin_reply || '', offer_price: String(req.offer_price || '') }
    setRequestSaving(prev => ({ ...prev, [req.id]: true }))
    try {
      const { error } = await supabase.from('sell_requests').update({
        status: edit.status,
        offer_price: edit.offer_price ? Number(edit.offer_price) : null,
        admin_reply: edit.reply.trim() || null,
      }).eq('id', req.id)
      if (error) throw error
      toast.success('Sell request updated')
      await refreshAfterMutation('sell_requests')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update'
      toast.error(msg)
    } finally {
      setRequestSaving(prev => ({ ...prev, [req.id]: false }))
    }
  }

  // ── Settings ────────────────────────────────────────────────────────
  const updateSetting = async (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key, value }, { onConflict: 'key' })
      if (error) throw error
    } catch (err) {
      console.error('Failed to save setting:', err)
      toast.error(`Failed to save ${key}`)
    }
  }

  // ── Computed ────────────────────────────────────────────────────────
  const totalBooks = books.length
  const totalOrders = orders.length
  const revenue = orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + o.grand_total, 0)
  const pendingOrders = orders.filter(o => o.order_status === 'pending').length
  const pendingBookRequests = bookRequests.filter(r => r.status === 'pending').length
  const pendingSellRequests = sellRequests.filter(r => r.status === 'pending').length

  // ── Render Helpers ──────────────────────────────────────────────────
  const inputClass = "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:border-amber/50 rounded-md"
  const labelClass = "text-xs uppercase tracking-wider text-amber/80 font-semibold"

  const sidebarNav = (onClick?: () => void) => (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map(item => (
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
          {item.id === 'book-requests' && pendingBookRequests > 0 && (
            <Badge variant="secondary" className="ml-auto bg-amber/20 text-amber text-[10px] px-1.5">
              {pendingBookRequests}
            </Badge>
          )}
          {item.id === 'sell-requests' && pendingSellRequests > 0 && (
            <Badge variant="secondary" className="ml-auto bg-amber/20 text-amber text-[10px] px-1.5">
              {pendingSellRequests}
            </Badge>
          )}
        </button>
      ))}
    </nav>
  )

  // ── Loading Skeleton ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#060d1f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="size-8 text-amber animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  // ── Main Render ─────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-[#060d1f] flex overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col bg-[#040a18] border-r border-white/5">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-xl font-bold">
            <span className="text-amber">KK</span>{' '}
            <span className="text-white">Admin</span>
          </h1>
        </div>
        <div className="flex-1 py-4 overflow-y-auto">
          {sidebarNav()}
        </div>
        <div className="p-4 border-t border-white/5">
          <a href="/" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="size-4" />
            Back to Site
          </a>
        </div>
      </aside>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="bg-[#040a18] border-r border-white/5 w-72 p-0">
          <SheetHeader className="p-6 border-b border-white/5">
            <SheetTitle className="text-xl font-bold">
              <span className="text-amber">KK</span>{' '}
              <span className="text-white">Admin</span>
            </SheetTitle>
            <SheetDescription className="text-white/40">Administration Panel</SheetDescription>
          </SheetHeader>
          <div className="py-4">
            {sidebarNav(() => setMobileMenuOpen(false))}
          </div>
          <div className="p-4 border-t border-white/5">
            <a href="/" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
              <ArrowLeft className="size-4" />
              Back to Site
            </a>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content - scrollable */}
      <main className="flex-1 lg:ml-0 min-h-0 overflow-y-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-[#060d1f]/95 backdrop-blur-md border-b border-white/5 px-4 lg:px-8 h-14 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white/60 hover:text-white"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <h2 className="text-lg font-semibold text-white">
            {NAV_ITEMS.find(n => n.id === activeTab)?.label || 'Dashboard'}
          </h2>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchAll} className="text-white/60 hover:text-white">
              <RefreshCw className="size-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut()
                window.location.href = '/admin/login'
              }}
              className="text-red-400/70 hover:text-red-400 hover:bg-red-400/10"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 lg:p-8">
          {activeTab === 'dashboard' && (
            <DashboardTab
              totalBooks={totalBooks} totalOrders={totalOrders} revenue={revenue}
              pendingOrders={pendingOrders} pendingBookRequests={pendingBookRequests}
              pendingSellRequests={pendingSellRequests} orders={orders.slice(0, 10)}
              formatCurrency={formatCurrency} formatDate={formatDate}
              onOrderClick={openOrderDialog}
            />
          )}
          {activeTab === 'books' && (
            <BooksTab
              books={books} formatCurrency={formatCurrency}
              onAdd={() => openBookDialog()}
              onEdit={(b) => openBookDialog(b)}
              onDelete={(b) => confirmDelete('books', b.id, b.title)}
            />
          )}
          {activeTab === 'orders' && (
            <OrdersTab
              orders={orders} formatCurrency={formatCurrency} formatDate={formatDate}
              onOrderClick={openOrderDialog}
            />
          )}
          {activeTab === 'slides' && (
            <SlidesTab
              slides={slides}
              onAdd={() => openSlideDialog()}
              onEdit={(s) => openSlideDialog(s)}
              onDelete={(s) => confirmDelete('hero_slides', s.id, `Slide: ${s.title}`)}
            />
          )}
          {activeTab === 'book-requests' && (
            <BookRequestsTab
              requests={bookRequests} formatDate={formatDate}
              requestEdits={requestEdits} setRequestEdits={setRequestEdits}
              requestSaving={requestSaving}
              onSave={saveBookRequest}
            />
          )}
          {activeTab === 'sell-requests' && (
            <SellRequestsTab
              requests={sellRequests} formatCurrency={formatCurrency} formatDate={formatDate}
              requestEdits={requestEdits} setRequestEdits={setRequestEdits}
              requestSaving={requestSaving}
              onSave={saveSellRequest}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsTab settings={settings} updateSetting={updateSetting} inputClass={inputClass} labelClass={labelClass} />
          )}
        </div>
      </main>

      {/* ── Book Dialog ─────────────────────────────────────────────── */}
      <Dialog open={bookDialogOpen} onOpenChange={setBookDialogOpen}>
        <DialogContent className="bg-[#0f1730] border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">{editingBook ? 'Edit Book' : 'Add New Book'}</DialogTitle>
            <DialogDescription className="text-white/40">
              {editingBook ? 'Update book details below.' : 'Fill in the book details to add it to the catalog.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={labelClass}>Title *</Label>
                <Input className={inputClass} value={bookForm.title} onChange={e => setBookForm(p => ({ ...p, title: e.target.value }))} placeholder="Book Title" />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Author *</Label>
                <Input className={inputClass} value={bookForm.author} onChange={e => setBookForm(p => ({ ...p, author: e.target.value }))} placeholder="Author Name" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className={labelClass}>Category</Label>
                <Select value={bookForm.category} onValueChange={v => setBookForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger className={`${inputClass} w-full`}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0f1730] border-white/10">{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Sub-Category</Label>
                <Input className={inputClass} value={bookForm.sub_category} onChange={e => setBookForm(p => ({ ...p, sub_category: e.target.value }))} placeholder="e.g. JEE Physics" />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Language</Label>
                <Input className={inputClass} value={bookForm.language} onChange={e => setBookForm(p => ({ ...p, language: e.target.value }))} placeholder="English" />
              </div>
            </div>
            <Separator className="bg-white/5" />
            <p className="text-xs uppercase tracking-wider text-amber/60 font-semibold">Pricing</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className={labelClass}>Selling Price (₹)</Label>
                <Input type="number" className={inputClass} value={bookForm.price} onChange={e => setBookForm(p => ({ ...p, price: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Original Price (₹)</Label>
                <Input type="number" className={inputClass} value={bookForm.original_price} onChange={e => setBookForm(p => ({ ...p, original_price: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Discount Tag</Label>
                <Select value={bookForm.discount_tag} onValueChange={v => setBookForm(p => ({ ...p, discount_tag: v }))}>
                  <SelectTrigger className={`${inputClass} w-full`}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0f1730] border-white/10">{DISCOUNT_TAGS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={labelClass}>Condition</Label>
                <Select value={bookForm.condition} onValueChange={v => setBookForm(p => ({ ...p, condition: v }))}>
                  <SelectTrigger className={`${inputClass} w-full`}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0f1730] border-white/10">{CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Stock Quantity</Label>
                <Input type="number" className={inputClass} value={bookForm.stock_quantity} onChange={e => setBookForm(p => ({ ...p, stock_quantity: Number(e.target.value) }))} />
              </div>
            </div>
            <Separator className="bg-white/5" />
            <p className="text-xs uppercase tracking-wider text-amber/60 font-semibold">Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className={labelClass}>ISBN</Label>
                <Input className={inputClass} value={bookForm.isbn} onChange={e => setBookForm(p => ({ ...p, isbn: e.target.value }))} placeholder="ISBN" />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Publisher</Label>
                <Input className={inputClass} value={bookForm.publisher} onChange={e => setBookForm(p => ({ ...p, publisher: e.target.value }))} placeholder="Publisher" />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Edition</Label>
                <Input className={inputClass} value={bookForm.edition} onChange={e => setBookForm(p => ({ ...p, edition: e.target.value }))} placeholder="Edition" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Image URLs (one per line)</Label>
              <Textarea className={inputClass} rows={3} value={bookForm.image_urls} onChange={e => setBookForm(p => ({ ...p, image_urls: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Description</Label>
              <Textarea className={inputClass} rows={3} value={bookForm.description} onChange={e => setBookForm(p => ({ ...p, description: e.target.value }))} placeholder="Book description..." />
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

      {/* ── Delete Dialog ────────────────────────────────────────────── */}
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

      {/* ── Order Dialog ─────────────────────────────────────────────── */}
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
                        <p className="text-xs text-white/40">Qty: {item.quantity} × ₹{item.book_price}</p>
                      </div>
                      <p className="text-sm text-amber font-medium">₹{item.book_price * item.quantity}</p>
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
                  <Label className={labelClass}>Order Status</Label>
                  <Select value={orderForm.order_status} onValueChange={v => setOrderForm(p => ({ ...p, order_status: v }))}>
                    <SelectTrigger className={`${inputClass} w-full`}><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0f1730] border-white/10">{ORDER_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Payment Status</Label>
                  <Select value={orderForm.payment_status} onValueChange={v => setOrderForm(p => ({ ...p, payment_status: v }))}>
                    <SelectTrigger className={`${inputClass} w-full`}><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0f1730] border-white/10">{PAYMENT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={labelClass}>Tracking URL</Label>
                  <Input className={inputClass} value={orderForm.tracking_url} onChange={e => setOrderForm(p => ({ ...p, tracking_url: e.target.value }))} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Tracking Number</Label>
                  <Input className={inputClass} value={orderForm.tracking_number} onChange={e => setOrderForm(p => ({ ...p, tracking_number: e.target.value }))} placeholder="Tracking ID" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Admin Notes</Label>
                <Textarea className={inputClass} rows={3} value={orderForm.admin_notes} onChange={e => setOrderForm(p => ({ ...p, admin_notes: e.target.value }))} placeholder="Internal notes..." />
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

      {/* ── Slide Dialog ─────────────────────────────────────────────── */}
      <Dialog open={slideDialogOpen} onOpenChange={setSlideDialogOpen}>
        <DialogContent className="bg-[#0f1730] border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{editingSlide ? 'Edit Slide' : 'Add New Slide'}</DialogTitle>
            <DialogDescription className="text-white/40">Configure the hero slide.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label className={labelClass}>Title *</Label>
              <Input className={inputClass} value={slideForm.title} onChange={e => setSlideForm(p => ({ ...p, title: e.target.value }))} placeholder="Slide title" />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Subtitle</Label>
              <Input className={inputClass} value={slideForm.subtitle} onChange={e => setSlideForm(p => ({ ...p, subtitle: e.target.value }))} placeholder="Subtitle text" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={labelClass}>CTA Button Text</Label>
                <Input className={inputClass} value={slideForm.cta_button_text} onChange={e => setSlideForm(p => ({ ...p, cta_button_text: e.target.value }))} placeholder="Browse Books" />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>CTA Link</Label>
                <Input className={inputClass} value={slideForm.cta_link} onChange={e => setSlideForm(p => ({ ...p, cta_link: e.target.value }))} placeholder="/books" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={labelClass}>Background Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={slideForm.background_color} onChange={e => setSlideForm(p => ({ ...p, background_color: e.target.value }))} className="size-10 rounded cursor-pointer border border-white/10" />
                  <Input className={inputClass} value={slideForm.background_color} onChange={e => setSlideForm(p => ({ ...p, background_color: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Sort Order</Label>
                <Input type="number" className={inputClass} value={slideForm.sort_order} onChange={e => setSlideForm(p => ({ ...p, sort_order: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Image URL</Label>
              <Input className={inputClass} value={slideForm.image_url} onChange={e => setSlideForm(p => ({ ...p, image_url: e.target.value }))} placeholder="https://..." />
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

// ────────────────────────────────────────────────────────────────────────────
// SECTION COMPONENTS
// ────────────────────────────────────────────────────────────────────────────

// ─── Dashboard Tab ──────────────────────────────────────────────────────────

function DashboardTab({ totalBooks, totalOrders, revenue, pendingOrders, pendingBookRequests, pendingSellRequests, orders, formatCurrency, formatDate, onOrderClick }: {
  totalBooks: number; totalOrders: number; revenue: number; pendingOrders: number
  pendingBookRequests: number; pendingSellRequests: number
  orders: Order[]; formatCurrency: (n: number) => string; formatDate: (d: string) => string
  onOrderClick: (o: Order) => void
}) {
  const stats = [
    { label: 'Total Books', value: totalBooks, icon: <BookOpen className="size-5" />, color: 'text-blue-400' },
    { label: 'Total Orders', value: totalOrders, icon: <ShoppingBag className="size-5" />, color: 'text-purple-400' },
    { label: 'Revenue', value: formatCurrency(revenue), icon: <DollarSign className="size-5" />, color: 'text-green-400' },
    { label: 'Pending Orders', value: pendingOrders, icon: <Clock className="size-5" />, color: 'text-yellow-400' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-[#0f1730] border border-white/5 rounded-xl p-4 lg:p-6">
            <div className="flex items-center justify-between mb-3">
              <span className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>{stat.icon}</span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-white/40 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pending Requests */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#0f1730] border border-white/5 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-amber/10 text-amber"><BookX className="size-5" /></div>
          <div>
            <p className="text-xl font-bold text-white">{pendingBookRequests}</p>
            <p className="text-sm text-white/40">Pending Book Requests</p>
          </div>
        </div>
        <div className="bg-[#0f1730] border border-white/5 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-amber/10 text-amber"><Package className="size-5" /></div>
          <div>
            <p className="text-xl font-bold text-white">{pendingSellRequests}</p>
            <p className="text-sm text-white/40">Pending Sell Requests</p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-[#0f1730] border border-white/5 rounded-xl overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-white/5">
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
                orders.map(order => (
                  <tr
                    key={order.id}
                    onClick={() => onOrderClick(order)}
                    className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-amber font-mono text-xs">{order.order_number}</td>
                    <td className="px-4 py-3 text-white/60">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3 text-white hidden sm:table-cell">{order.shipping_name}</td>
                    <td className="px-4 py-3 text-white font-medium">{formatCurrency(order.grand_total)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${ORDER_STATUS_COLORS[order.order_status] || 'bg-white/10 text-white/40'}`}>
                        {order.order_status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${PAYMENT_STATUS_COLORS[order.payment_status] || 'bg-white/10 text-white/40'}`}>
                        {order.payment_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Books Tab ──────────────────────────────────────────────────────────────

function BooksTab({ books, formatCurrency, onAdd, onEdit, onDelete }: {
  books: Book[]; formatCurrency: (n: number) => string
  onAdd: () => void; onEdit: (b: Book) => void; onDelete: (b: Book) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/40">{books.length} books</p>
        <Button onClick={onAdd} className="bg-amber hover:bg-amber/90 text-black font-semibold">
          <Plus className="size-4" /> Add Book
        </Button>
      </div>
      <div className="bg-[#0f1730] border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
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
                <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap hidden xl:table-cell">Featured</th>
                <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-8 text-center text-white/30">No books found</td></tr>
              ) : (
                books.map(book => (
                  <tr key={book.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
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
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/50 hidden xl:table-cell">{book.condition}</td>
                    <td className="px-4 py-3 text-white/50 hidden lg:table-cell">{book.stock_quantity}</td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className={`inline-block w-2 h-2 rounded-full ${book.active ? 'bg-green-400' : 'bg-red-400'}`} />
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      {book.featured ? (
                        <span className="text-amber text-xs">★</span>
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="size-8 text-white/40 hover:text-amber" onClick={() => onEdit(book)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8 text-white/40 hover:text-red-400" onClick={() => onDelete(book)}>
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
  )
}

// ─── Orders Tab ─────────────────────────────────────────────────────────────

function OrdersTab({ orders, formatCurrency, formatDate, onOrderClick }: {
  orders: Order[]; formatCurrency: (n: number) => string; formatDate: (d: string) => string
  onOrderClick: (o: Order) => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-white/40">{orders.length} orders</p>
      <div className="bg-[#0f1730] border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#0f1730] z-10">
              <tr className="border-b border-white/5 text-left">
                <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap">Order #</th>
                <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap">Date</th>
                <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap hidden md:table-cell">Customer</th>
                <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap hidden lg:table-cell">Items</th>
                <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap">Total</th>
                <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap hidden sm:table-cell">Payment</th>
                <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-white/40 font-medium whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-white/30">No orders yet</td></tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-amber font-mono text-xs">{order.order_number}</td>
                    <td className="px-4 py-3 text-white/60 text-xs">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3 text-white hidden md:table-cell max-w-[150px] truncate">{order.shipping_name}</td>
                    <td className="px-4 py-3 text-white/50 hidden lg:table-cell">{order.order_items?.length || 0} items</td>
                    <td className="px-4 py-3 text-white font-medium">{formatCurrency(order.grand_total)}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${PAYMENT_STATUS_COLORS[order.payment_status]}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${ORDER_STATUS_COLORS[order.order_status]}`}>
                        {order.order_status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" className="text-amber hover:text-amber/80 h-7 text-xs" onClick={() => onOrderClick(order)}>
                        <Eye className="size-3.5" /> Manage
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
  )
}

// ─── Hero Slides Tab ────────────────────────────────────────────────────────

function SlidesTab({ slides, onAdd, onEdit, onDelete }: {
  slides: HeroSlide[]; onAdd: () => void; onEdit: (s: HeroSlide) => void; onDelete: (s: HeroSlide) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/40">{slides.length} slides</p>
        <Button onClick={onAdd} className="bg-amber hover:bg-amber/90 text-black font-semibold">
          <Plus className="size-4" /> Add Slide
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {slides.length === 0 ? (
          <div className="col-span-full text-center py-12 text-white/30">No slides yet</div>
        ) : (
          slides.map(slide => (
            <div key={slide.id} className="bg-[#0f1730] border border-white/5 rounded-xl overflow-hidden">
              <div className="h-32 relative flex items-center justify-center" style={{ backgroundColor: slide.background_color }}>
                {slide.image_url ? (
                  <img src={slide.image_url} alt="" className="size-full object-cover opacity-80" />
                ) : (
                  <ImageIcon className="size-8 text-white/20" />
                )}
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  <Badge variant={slide.active ? 'default' : 'secondary'} className={slide.active ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}>
                    {slide.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="absolute bottom-2 left-2">
                  <Badge variant="outline" className="border-white/20 text-white/60 text-[10px]">Sort: {slide.sort_order}</Badge>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h4 className="text-white font-medium truncate">{slide.title}</h4>
                {slide.subtitle && <p className="text-white/40 text-sm truncate">{slide.subtitle}</p>}
                {slide.cta_button_text && (
                  <p className="text-xs text-amber/70 truncate">
                    CTA: {slide.cta_button_text} → {slide.cta_link || '#'}
                  </p>
                )}
                <div className="flex items-center gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 border-white/10 text-white/60 hover:text-white hover:bg-white/5 h-8" onClick={() => onEdit(slide)}>
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="border-white/10 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 h-8" onClick={() => onDelete(slide)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Book Requests Tab ──────────────────────────────────────────────────────

function BookRequestsTab({ requests, formatDate, requestEdits, setRequestEdits, requestSaving, onSave }: {
  requests: BookRequest[]; formatDate: (d: string) => string
  requestEdits: Record<string, { status: string; reply: string; offer_price: string }>
  setRequestEdits: React.Dispatch<React.SetStateAction<Record<string, { status: string; reply: string; offer_price: string }>>>
  requestSaving: Record<string, boolean>
  onSave: (r: BookRequest) => void
}) {
  const getEdit = (req: BookRequest) =>
    requestEdits[req.id] || { status: req.status, reply: req.admin_reply || '', offer_price: '' }

  const setEdit = (id: string, field: string, value: string) =>
    setRequestEdits(prev => ({
      ...prev,
      [id]: { ...(prev[id] || { status: '', reply: '', offer_price: '' }), [field]: value }
    }))

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      found: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      not_available: 'bg-red-500/20 text-red-400 border-red-500/30',
      fulfilled: 'bg-green-500/20 text-green-400 border-green-500/30',
    }
    return colors[status] || 'bg-white/10 text-white/40'
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/40">{requests.length} requests</p>
      <div className="space-y-3">
        {requests.length === 0 ? (
          <div className="text-center py-12 text-white/30">No book requests</div>
        ) : (
          requests.map(req => {
            const edit = getEdit(req)
            return (
              <div key={req.id} className="bg-[#0f1730] border border-white/5 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="text-white font-medium">{req.book_title}</h4>
                    <p className="text-sm text-white/50">{req.author || 'Unknown author'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`border ${statusColor(edit.status)}`}>
                      {edit.status}
                    </Badge>
                    <span className="text-xs text-white/30">{formatDate(req.created_at)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-white/30">User: </span>
                    <span className="text-white/70">{req.user_name || 'Anonymous'}</span>
                  </div>
                  <div>
                    <span className="text-white/30">Email: </span>
                    <span className="text-white/70">{req.user_email || '—'}</span>
                  </div>
                  {req.category && (
                    <div>
                      <span className="text-white/30">Category: </span>
                      <span className="text-white/70">{req.category}</span>
                    </div>
                  )}
                </div>
                {req.notes && (
                  <p className="text-sm text-white/40 italic">&quot;{req.notes}&quot;</p>
                )}
                <Separator className="bg-white/5" />
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-amber/60 font-semibold">Status</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {BOOK_REQUEST_STATUSES.map(s => (
                        <button
                          key={s}
                          onClick={() => setEdit(req.id, 'status', s)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                            edit.status === s ? 'bg-amber/20 text-amber border-amber/40' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
                          }`}
                        >
                          {s.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-amber/60 font-semibold">Admin Reply</Label>
                    <Textarea
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:border-amber/50 rounded-md text-sm"
                      rows={2}
                      placeholder="Reply to customer..."
                      value={edit.reply}
                      onChange={e => setEdit(req.id, 'reply', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => onSave(req)}
                    disabled={requestSaving[req.id]}
                    className="bg-amber hover:bg-amber/90 text-black font-semibold h-8"
                  >
                    {requestSaving[req.id] ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                    Save
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── Sell Requests Tab ──────────────────────────────────────────────────────

function SellRequestsTab({ requests, formatCurrency, formatDate, requestEdits, setRequestEdits, requestSaving, onSave }: {
  requests: SellRequest[]; formatCurrency: (n: number) => string; formatDate: (d: string) => string
  requestEdits: Record<string, { status: string; reply: string; offer_price: string }>
  setRequestEdits: React.Dispatch<React.SetStateAction<Record<string, { status: string; reply: string; offer_price: string }>>>
  requestSaving: Record<string, boolean>
  onSave: (r: SellRequest) => void
}) {
  const getEdit = (req: SellRequest) =>
    requestEdits[req.id] || { status: req.status, reply: req.admin_reply || '', offer_price: String(req.offer_price || '') }

  const setEdit = (id: string, field: string, value: string) =>
    setRequestEdits(prev => ({
      ...prev,
      [id]: { ...(prev[id] || { status: '', reply: '', offer_price: '' }), [field]: value }
    }))

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      reviewed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      accepted: 'bg-green-500/20 text-green-400 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    }
    return colors[status] || 'bg-white/10 text-white/40'
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/40">{requests.length} requests</p>
      <div className="space-y-3">
        {requests.length === 0 ? (
          <div className="text-center py-12 text-white/30">No sell requests</div>
        ) : (
          requests.map(req => {
            const edit = getEdit(req)
            return (
              <div key={req.id} className="bg-[#0f1730] border border-white/5 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="text-white font-medium">{req.book_title}</h4>
                    <p className="text-sm text-white/50">{req.author || 'Unknown author'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`border ${statusColor(edit.status)}`}>
                      {edit.status}
                    </Badge>
                    <span className="text-xs text-white/30">{formatDate(req.created_at)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-white/30">User: </span>
                    <span className="text-white/70">{req.user_name}</span>
                  </div>
                  <div>
                    <span className="text-white/30">Email: </span>
                    <span className="text-white/70">{req.user_email}</span>
                  </div>
                  <div>
                    <span className="text-white/30">Condition: </span>
                    <span className="text-white/70">{req.book_condition}</span>
                  </div>
                  <div>
                    <span className="text-white/30">Asking: </span>
                    <span className="text-amber">{formatCurrency(req.asking_price || 0)}</span>
                  </div>
                </div>
                {req.description && (
                  <p className="text-sm text-white/40 italic">&quot;{req.description}&quot;</p>
                )}
                <Separator className="bg-white/5" />
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-amber/60 font-semibold">Status</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {SELL_REQUEST_STATUSES.map(s => (
                        <button
                          key={s}
                          onClick={() => setEdit(req.id, 'status', s)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                            edit.status === s ? 'bg-amber/20 text-amber border-amber/40' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="w-full sm:w-32 space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-amber/60 font-semibold">Offer Price (₹)</Label>
                    <Input
                      type="number"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:border-amber/50 rounded-md text-sm h-9"
                      placeholder="₹0"
                      value={edit.offer_price}
                      onChange={e => setEdit(req.id, 'offer_price', e.target.value)}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-amber/60 font-semibold">Admin Reply</Label>
                    <Textarea
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:border-amber/50 rounded-md text-sm"
                      rows={2}
                      placeholder="Reply to seller..."
                      value={edit.reply}
                      onChange={e => setEdit(req.id, 'reply', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => onSave(req)}
                    disabled={requestSaving[req.id]}
                    className="bg-amber hover:bg-amber/90 text-black font-semibold h-8"
                  >
                    {requestSaving[req.id] ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                    Save
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── Settings Tab ───────────────────────────────────────────────────────────

function SettingsTab({ settings, updateSetting, inputClass, labelClass }: {
  settings: Record<string, string>
  updateSetting: (key: string, value: string) => void
  inputClass: string; labelClass: string
}) {
  const get = (key: string) => settings[key] || ''
  const isChecked = (key: string) => get(key) === 'true'

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-[#0f1730] border border-white/5 rounded-xl p-6 space-y-5">
        <h3 className="text-white font-semibold text-lg">General Settings</h3>
        <div className="space-y-2">
          <Label className={labelClass}>Site Name</Label>
          <Input className={inputClass} value={get('site_name')} onChange={e => updateSetting('site_name', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className={labelClass}>Tagline</Label>
          <Input className={inputClass} value={get('tagline')} onChange={e => updateSetting('tagline', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className={labelClass}>WhatsApp Number</Label>
          <Input className={inputClass} value={get('whatsapp_number')} onChange={e => updateSetting('whatsapp_number', e.target.value)} placeholder="+91XXXXXXXXXX" />
        </div>
        <div className="space-y-2">
          <Label className={labelClass}>Delivery Charge (₹)</Label>
          <Input type="number" className={inputClass} value={get('delivery_charge')} onChange={e => updateSetting('delivery_charge', e.target.value)} />
        </div>
      </div>

      <div className="bg-[#0f1730] border border-white/5 rounded-xl p-6 space-y-5">
        <h3 className="text-white font-semibold text-lg">Announcement Banner</h3>
        <div className="space-y-2">
          <Label className={labelClass}>Banner Text</Label>
          <Input className={inputClass} value={get('announcement_banner')} onChange={e => updateSetting('announcement_banner', e.target.value)} placeholder="e.g. Free delivery on orders above ₹499!" />
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={isChecked('show_banner')} onCheckedChange={v => updateSetting('show_banner', String(v))} />
          <Label className="text-sm text-white/70">Show Banner</Label>
        </div>
      </div>

      <div className="bg-[#0f1730] border border-white/5 rounded-xl p-6 space-y-5">
        <h3 className="text-white font-semibold text-lg">System Settings</h3>
        <div className="flex items-center gap-3">
          <Switch checked={isChecked('phonepe_enabled')} onCheckedChange={v => updateSetting('phonepe_enabled', String(v))} />
          <div>
            <Label className="text-sm text-white/70">PhonePe Payments</Label>
            <p className="text-xs text-white/30">Enable PhonePe payment gateway</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={isChecked('maintenance_mode')} onCheckedChange={v => updateSetting('maintenance_mode', String(v))} />
          <div>
            <Label className="text-sm text-white/70">Maintenance Mode</Label>
            <p className="text-xs text-white/30">Disable site for visitors</p>
          </div>
        </div>
      </div>
    </div>
  )
}
