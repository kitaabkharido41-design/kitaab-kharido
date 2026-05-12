'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminDashboard } from './admin-dashboard'
import { Loader2, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminCheckResult {
  authenticated: boolean
  isAdmin: boolean
  userId?: string
  userEmail?: string
  userName?: string
  error?: string
}

export function AdminDashboardClient() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [result, setResult] = useState<AdminCheckResult | null>(null)

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/admin/check')
        const data: AdminCheckResult = await res.json()

        setResult(data)
        setChecking(false)

        if (!data.authenticated) {
          router.replace('/admin/login')
        }
      } catch (err) {
        console.error('Admin check failed:', err)
        setChecking(false)
      }
    }

    checkAdmin()
  }, [router])

  // Loading
  if (checking) {
    return (
      <div className="h-screen bg-[#060d1f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="size-8 text-amber animate-spin mx-auto mb-4" />
          <p className="text-white/60">Checking admin access...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!result || !result.authenticated) {
    return (
      <div className="h-screen bg-[#060d1f] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-amber/10 flex items-center justify-center mx-auto mb-6">
            <LogIn className="size-10 text-amber" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Login Required</h1>
          <p className="text-white/50 mb-6">Please log in with an admin account to access this page.</p>
          <Button
            onClick={() => router.push('/admin/login')}
            className="bg-amber hover:bg-amber-light text-black font-semibold px-8"
          >
            Go to Admin Login
          </Button>
        </div>
      </div>
    )
  }

  // Not admin (wrong email)
  if (!result.isAdmin) {
    return (
      <div className="h-screen bg-[#060d1f] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <LogIn className="size-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Access Denied</h1>
          <p className="text-white/50 mb-2">
            Logged in as <span className="text-white/80 font-mono text-sm">{result.userEmail}</span>
          </p>
          <p className="text-white/30 text-sm mb-6">This account does not have admin privileges. Only authorized admin emails can access this panel.</p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => router.push('/admin/login')} className="bg-amber hover:bg-amber-light text-black font-semibold px-8">
              Try Different Account
            </Button>
            <Button onClick={() => router.push('/')} variant="ghost" className="text-white/30 hover:text-white/50">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Admin — show dashboard
  return <AdminDashboard userId={result.userId!} userName={result.userName} />
}
