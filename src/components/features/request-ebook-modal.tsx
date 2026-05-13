'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Gift, Loader2 } from 'lucide-react'

import { useStore } from '@/store'
import { useAuth } from '@/components/providers/auth-provider'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

const EBOOK_CATEGORIES = ['Academic', 'JEE', 'NEET', 'UPSC', 'CAT', 'GATE', 'Other']

export function RequestEbookModal() {
  const { ui, closeRequestEbook } = useStore()
  const { user, profile } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [bookTitle, setBookTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [category, setCategory] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const resetForm = () => {
    setName('')
    setEmail('')
    setBookTitle('')
    setAuthor('')
    setCategory('')
    setNotes('')
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeRequestEbook()
      resetForm()
    }
  }

  const prefillFromProfile = () => {
    if (profile?.full_name && !name) setName(profile.full_name)
    if (user?.email && !email) setEmail(user.email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!bookTitle.trim()) {
      toast.error('Please enter the book title')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/ebook-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: name,
          user_email: email,
          book_title: bookTitle,
          author: author || null,
          category: category || null,
          notes: notes || null,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Ebook request submitted! We will send it to you for free.')
        closeRequestEbook()
        resetForm()
      } else if (res.status === 409) {
        toast.error(data.error || 'Duplicate request', { duration: 5000 })
      } else {
        toast.error(data.error || 'Failed to submit request. Please WhatsApp us at +91 93824 70919.')
      }
    } catch {
      toast.error('Something went wrong. Please WhatsApp us at +91 93824 70919 or try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={ui.requestEbookOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md border-white/10 bg-[#060d1f] text-white max-h-[85vh] overflow-y-auto"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          prefillFromProfile()
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-amber-400">
            <Gift className="size-5" />
            Request Free Ebook
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Request any ebook and get it for FREE as a gift! Available for all students.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contact Information */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/80">
              Your Information
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ebook-name" className="text-white/80 text-sm">
                  Name
                </Label>
                <Input
                  id="ebook-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-amber-500/50 focus-visible:ring-amber-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ebook-email" className="text-white/80 text-sm">
                  Email <span className="text-amber-400">*</span>
                </Label>
                <Input
                  id="ebook-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-amber-500/50 focus-visible:ring-amber-500/20"
                />
              </div>
            </div>
          </div>

          {/* Book Details */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/80">
              Ebook Details
            </p>
            <div className="space-y-2">
              <Label htmlFor="ebook-title" className="text-white/80 text-sm">
                Book Title <span className="text-amber-400">*</span>
              </Label>
              <Input
                id="ebook-title"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                placeholder="Enter book title"
                required
                className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-amber-500/50 focus-visible:ring-amber-500/20"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ebook-author" className="text-white/80 text-sm">
                  Author
                </Label>
                <Input
                  id="ebook-author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Author name"
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-amber-500/50 focus-visible:ring-amber-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/80 text-sm">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full border-white/10 bg-white/5 text-white focus:border-amber-500/50 focus:ring-amber-500/20 [&]:text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#0a1628] text-white">
                    {EBOOK_CATEGORIES.map((cat) => (
                      <SelectItem
                        key={cat}
                        value={cat}
                        className="text-white focus:bg-amber-500/10 focus:text-amber-400"
                      >
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ebook-notes" className="text-white/80 text-sm">
                Notes <span className="text-white/40">(optional)</span>
              </Label>
              <Textarea
                id="ebook-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific edition, format preference, or additional details..."
                rows={3}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-amber-500/50 focus-visible:ring-amber-500/20 resize-none"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !bookTitle.trim() || !email.trim()}
            className="w-full bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50 font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Request
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
