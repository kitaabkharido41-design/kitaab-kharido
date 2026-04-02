import { redirect } from 'next/navigation'
import { AdminDashboardClient } from './admin-client'

export default function AdminPage() {
  // Just render the client component — it handles auth check itself
  return <AdminDashboardClient />
}
