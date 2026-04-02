'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  Search,
  ShoppingCart,
  Menu,
  LogIn,
  LogOut,
  User as UserIcon,
  Package,
  BookPlus,
  BookOpenText,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { useStore } from '@/store'
import { useAuth } from '@/components/providers/auth-provider'

export function Navbar() {
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()
  const {
    getCartCount,
    openCart,
    openAuthModal,
    openDashboard,
    openSellBook,
    openRequestBook,
  } = useStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const cartCount = getCartCount()
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'User'
  const userInitial = displayName.charAt(0).toUpperCase()

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/books', label: 'Books' },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-navy/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <BookOpen className="size-6 text-amber" />
              <span className="text-lg font-bold tracking-tight">
                <span className="text-amber">Kitaab</span>
                <span className="text-white">Kharido</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'text-amber bg-amber/10'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              {/* Admin Link */}
              {profile && profile.is_admin && (
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    pathname === '/admin'
                      ? 'text-amber bg-amber/10'
                      : 'text-amber/70 hover:text-amber hover:bg-amber/5 border border-amber/20'
                  }`}
                >
                  <ShieldCheck className="size-4" />
                  Admin
                </Link>
              )}
              {/* Search */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white/70 hover:text-white hover:bg-white/5"
              >
                <Search className="size-5" />
              </Button>

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                className="relative text-white/70 hover:text-white hover:bg-white/5"
                onClick={openCart}
              >
                <ShoppingCart className="size-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 size-5 p-0 flex items-center justify-center text-[10px] font-bold bg-amber text-navy border-0">
                    {cartCount > 99 ? '99+' : cartCount}
                  </Badge>
                )}
              </Button>

              {/* Separator */}
              <Separator orientation="vertical" className="h-6 bg-white/10 mx-1" />

              {/* User */}
              {user ? (
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-3 text-white/70 hover:text-white hover:bg-white/5"
                  onClick={openDashboard}
                >
                  <Avatar className="size-7 border border-amber/30">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-amber/20 text-amber text-xs font-bold">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium max-w-[100px] truncate">
                    {displayName}
                  </span>
                </Button>
              ) : (
                <Button
                  onClick={() => openAuthModal('login')}
                  className="bg-amber hover:bg-amber-light text-navy font-semibold text-sm"
                >
                  <LogIn className="size-4" />
                  Login
                </Button>
              )}
            </div>

            {/* Mobile: Hamburger + Cart */}
            <div className="flex md:hidden items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-white/70 hover:text-white hover:bg-white/5"
                onClick={openCart}
              >
                <ShoppingCart className="size-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 size-5 p-0 flex items-center justify-center text-[10px] font-bold bg-amber text-navy border-0">
                    {cartCount > 99 ? '99+' : cartCount}
                  </Badge>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white/70 hover:text-white hover:bg-white/5"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="size-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-80 bg-navy border-white/5 p-0">
          <SheetHeader className="p-6 pb-4">
            <SheetTitle className="flex items-center gap-2">
              <BookOpen className="size-5 text-amber" />
              <span className="text-amber">Kitaab</span>
              <span className="text-white">Kharido</span>
            </SheetTitle>
            <SheetDescription className="text-white/50">
              Your premium second-hand book marketplace
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {/* User Section */}
            {user ? (
              <div className="mb-4 p-4 rounded-lg bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 border border-amber/30">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-amber/20 text-amber text-sm font-bold">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-white/50 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 text-xs"
                    onClick={() => {
                      setMobileOpen(false)
                      openDashboard()
                    }}
                  >
                    <UserIcon className="size-3.5" />
                    My Account
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 text-xs"
                    onClick={() => {
                      setMobileOpen(false)
                      openDashboard()
                    }}
                  >
                    <Package className="size-3.5" />
                    My Orders
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-4 rounded-lg bg-amber/5 border border-amber/10">
                <p className="text-sm text-white/70 mb-3">
                  Sign in to manage orders and track deliveries
                </p>
                <Button
                  onClick={() => {
                    setMobileOpen(false)
                    openAuthModal('login')
                  }}
                  className="w-full bg-amber hover:bg-amber-light text-navy font-semibold text-sm"
                >
                  <LogIn className="size-4" />
                  Login / Sign Up
                </Button>
              </div>
            )}

            <Separator className="bg-white/5 my-2" />

            {/* Navigation */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider px-3 mb-2">
                Navigation
              </p>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'text-amber bg-amber/10'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.href === '/' && <HomeIcon className="size-4" />}
                  {link.href === '/books' && <BookOpen className="size-4" />}
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Admin Link */}
            {profile?.is_admin && (
              <>
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-amber/80 hover:text-amber hover:bg-amber/10 transition-colors"
                >
                  <ShieldCheck className="size-4" />
                  Admin Panel
                </Link>
              </>
            )}

            <Separator className="bg-white/5 my-3" />

            {/* Actions */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider px-3 mb-2">
                Quick Actions
              </p>
              <button
                onClick={() => {
                  setMobileOpen(false)
                  openSellBook()
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 w-full transition-colors"
              >
                <BookPlus className="size-4" />
                Sell Your Book
              </button>
              <button
                onClick={() => {
                  setMobileOpen(false)
                  openRequestBook()
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 w-full transition-colors"
              >
                <BookOpenText className="size-4" />
                Request a Book
              </button>
              <button
                onClick={() => {
                  setMobileOpen(false)
                  openCart()
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 w-full transition-colors"
              >
                <ShoppingCart className="size-4" />
                Cart
                {cartCount > 0 && (
                  <Badge className="ml-auto bg-amber text-navy text-[10px] font-bold border-0 px-1.5 py-0">
                    {cartCount}
                  </Badge>
                )}
              </button>
            </div>

            {/* Logout */}
            {user && (
              <>
                <Separator className="bg-white/5 my-3" />
                <button
                  onClick={async () => {
                    setMobileOpen(false)
                    await signOut()
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/5 w-full transition-colors"
                >
                  <LogOut className="size-4" />
                  Logout
                </button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

/* Small inline Home icon for mobile nav */
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  )
}
