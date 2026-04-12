'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { BookOpen, Loader2, LogIn } from 'lucide-react'

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

const CATEGORIES = ['Academic', 'Fiction', 'Self-Help', 'Others']

export function RequestBookModal() {
  const { ui, closeRequestBook, openAuthModal } = useStore()
  const { user, profile } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [bookTitle, setBookTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [category, setCategory] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const resetForm = () => {
    setName('')
    setEmail('')
    setPhone('')
    setBookTitle('')
    setAuthor('')
    setCategory('')
    setNotes('')
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeRequestBook()
      resetForm()
    }
  }

  const prefillFromProfile = () => {
    if (profile?.full_name) setName(profile.full_name)
    if (user?.email) setEmail(user.email)
    if (profile?.phone) setPhone(profile.phone)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!bookTitle.trim()) {
      toast.error('Please enter the book title')
      return
    }

    if (!user) return

    setLoading(true)
    try {
      const res = await fetch('/api/book-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          user_name: name,
          user_email: email,
          user_phone: phone,
          book_title: bookTitle,
          author: author || null,
          category: category || null,
          notes: notes || null,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success("Book request submitted! We'll find it for you.")
        closeRequestBook()
        resetForm()
      } else {
        toast.error(data.error || 'Failed to submit request')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={ui.requestBookOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md border-white/10 bg-[#060d1f] text-white max-h-[85vh] overflow-y-auto"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          prefillFromProfile()
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-amber-400">
            <BookOpen className="size-5" />
            Request a Book
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Can&apos;t find what you&apos;re looking for? Let us know and we&apos;ll track it down for you.
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="rounded-full bg-amber-500/10 p-4">
              <LogIn className="size-8 text-amber-400" />
            </div>
            <p className="text-center text-white/70">
              Please login to request a book
            </p>
            <Button
              onClick={() => {
                closeRequestBook()
                openAuthModal('login')
              }}
              className="bg-amber-500 text-black hover:bg-amber-400"
            >
              <LogIn className="mr-2 size-4" />
              Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Contact Information */}
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/80">
                Contact Information
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="req-name" className="text-white/80 text-sm">
                    Name
                  </Label>
                  <Input
                    id="req-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-amber-500/50 focus-visible:ring-amber-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="req-email" className="text-white/80 text-sm">
                    Email
                  </Label>
                  <Input
                    id="req-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-amber-500/50 focus-visible:ring-amber-500/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="req-phone" className="text-white/80 text-sm">
                  Phone
                </Label>
                <Input
                  id="req-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Your phone number"
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-amber-500/50 focus-visible:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Book Details */}
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/80">
                Book Details
              </p>
              <div className="space-y-2">
                <Label htmlFor="req-title" className="text-white/80 text-sm">
                  Book Title <span className="text-amber-400">*</span>
                </Label>
                <Input
                  id="req-title"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="Enter book title"
                  required
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-amber-500/50 focus-visible:ring-amber-500/20"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="req-author" className="text-white/80 text-sm">
                    Author
                  </Label>
                  <Input
                    id="req-author"
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
                      {CATEGORIES.map((cat) => (
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
                <Label htmlFor="req-notes" className="text-white/80 text-sm">
                  Notes <span className="text-white/40">(optional)</span>
                </Label>
                <Textarea
                  id="req-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional details or specific edition info..."
                  rows={3}
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-amber-500/50 focus-visible:ring-amber-500/20 resize-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !bookTitle.trim()}
              className="w-full bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
