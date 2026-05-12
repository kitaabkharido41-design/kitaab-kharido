'use client'

import { AuthModal } from '@/components/features/auth-modal'
import { CartDrawer } from '@/components/features/cart-drawer'
import { UserDashboard } from '@/components/features/user-dashboard'
import { SellBookModal } from '@/components/features/sell-book-modal'
import { RequestBookModal } from '@/components/features/request-book-modal'
import { RequestEbookModal } from '@/components/features/request-ebook-modal'

export function GlobalModals() {
  return (
    <>
      <AuthModal />
      <CartDrawer />
      <UserDashboard />
      <SellBookModal />
      <RequestBookModal />
      <RequestEbookModal />
    </>
  )
}
