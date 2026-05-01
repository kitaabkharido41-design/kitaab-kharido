'use client'

import Link from 'next/link'
import {
  BookOpen,
  Instagram,
  Twitter,
  Phone,
  Mail,
  Heart,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#040a18] border-t border-white/5 mt-auto">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Kitaab Kharido" className="size-8 object-contain rounded-full" />
              <span className="text-lg font-bold tracking-tight">
                <span className="text-amber">Kitaab</span>
                <span className="text-white">Kharido</span>
              </span>
            </Link>
            <p className="text-sm text-white/50 leading-relaxed mb-6 max-w-xs">
              Premium Second-Hand Books for Indian Students. Save up to 60% on
              your favourite academic books.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3">
              <SocialButton icon={<Instagram className="size-4" />} label="Instagram" />
              <SocialButton icon={<Twitter className="size-4" />} label="Twitter" />
              <a
                href="https://wa.me/919382470919"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex items-center justify-center size-9 rounded-lg bg-white/5 text-white/40 hover:text-green-400 hover:bg-green-400/10 transition-colors"
              >
                <Phone className="size-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <FooterLink href="/">Home</FooterLink>
              <FooterLink href="/books">Books</FooterLink>
              <li>
                <span className="text-sm text-white/40 hover:text-amber transition-colors cursor-default">
                  Sell Your Book
                </span>
              </li>
              <li>
                <span className="text-sm text-white/40 hover:text-amber transition-colors cursor-default">
                  Request a Book
                </span>
              </li>
            </ul>
          </div>

          {/* Exam Categories */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
              Exam Categories
            </h3>
            <ul className="space-y-3">
              {['JEE', 'NEET', 'UPSC', 'CAT', 'GATE'].map((exam) => (
                <li key={exam}>
                  <span className="text-sm text-white/40 hover:text-amber transition-colors cursor-default">
                    {exam} Books
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact / Info */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
              Contact
            </h3>
            <ul className="space-y-3 text-sm text-white/40">
              <li className="flex items-start gap-2">
                <Phone className="size-4 mt-0.5 shrink-0 text-white/30" />
                <a
                  href="https://wa.me/919382470919"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-green-400 transition-colors"
                >
                  +91 93824 70919
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="size-4 mt-0.5 shrink-0 text-white/30" />
                <a
                  href="mailto:kitaabkharido41@gmail.com"
                  className="hover:text-amber transition-colors"
                >
                  kitaabkharido41@gmail.com
                </a>
              </li>
              <li>
                <span className="leading-relaxed">
                  West Bengal, India
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <Separator className="bg-white/5" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/30">
            &copy; {currentYear} KitaabKharido. All rights reserved.
          </p>
          <p className="text-xs text-white/30 flex items-center gap-1">
            Made with <Heart className="size-3 text-red-400 fill-red-400" /> for Indian students
          </p>
        </div>
      </div>
    </footer>
  )
}

/* Reusable footer link */
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-white/40 hover:text-amber transition-colors"
      >
        {children}
      </Link>
    </li>
  )
}

/* Social icon button */
function SocialButton({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      aria-label={label}
      className="flex items-center justify-center size-9 rounded-lg bg-white/5 text-white/40 hover:text-amber hover:bg-amber/10 transition-colors"
    >
      {icon}
    </button>
  )
}
