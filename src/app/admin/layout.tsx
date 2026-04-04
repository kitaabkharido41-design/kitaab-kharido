import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Panel — Kitaab Kharido',
  description: 'Kitaab Kharido administration panel for managing books, orders, and site settings.',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
