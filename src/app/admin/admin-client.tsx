'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminDashboard } from './admin-dashboard'
import { Loader2, ShieldAlert, LogIn, ShieldCheck, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminCheckResult {
  authenticated: boolean
  isAdmin: boolean
  profile?: { id: string; full_name: string; is_admin: boolean }
  userEmail?: string
  userId?: string
  error?: string
}

export function AdminDashboardClient() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [granting, setGranting] = useState(false)
  const [grantError, setGrantError] = useState('')

  const attemptGrant = async () => {
    setGranting(true)
    try {
      const res = await fetch('/api/admin/grant', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setIsAdmin(true)
        setChecking(false)
        return
      }
      setGrantError(data.error || 'Failed to grant admin access')
    } catch {
      setGrantError('Network error while granting admin access')
    }
    setGranting(false)
    setChecking(false)
  }

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/admin/check')
        const data: AdminCheckResult = await res.json()

        if (!data.authenticated) {
          router.replace('/admin/login')
          return
        }

        setUserId(data.userId || null)

        if (data.isAdmin) {
          setIsAdmin(true)
          setChecking(false)
          return
        }

        // Not admin — try auto-granting
        console.log('[Admin] Not admin, attempting auto-grant...')
        await attemptGrant()
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
          <p className="text-white/60">
            {granting ? 'Setting up admin access...' : 'Checking admin access...'}
          </p>
        </div>
      </div>
    )
  }

  // Not logged in
  if (!userId) {
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

  // Not admin
  if (!isAdmin) {
    return (
      <div className="h-screen bg-[#060d1f] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="size-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Admin Setup Required</h1>
          <p className="text-white/50 mb-2">Your account needs admin privileges.</p>
          {grantError && (
            <p className="text-white/30 text-xs mb-4 bg-white/5 rounded-lg p-3 text-left font-mono break-all">
              {grantError}
            </p>
          )}
          <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
            <p className="text-amber text-xs font-semibold uppercase tracking-wider mb-2">Quick Fix</p>
            <p className="text-white/60 text-xs mb-3">
              Go to <span className="text-white/80">Supabase Dashboard</span> → <span className="text-white/80">SQL Editor</span> and run:
            </p>
            <div className="bg-black/30 rounded-lg p-3 font-mono text-[11px] text-amber/80 leading-relaxed">
              <pre>{`UPDATE profiles SET is_admin = true
WHERE id = '${userId}';`}</pre>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Button onClick={attemptGrant} disabled={granting} className="bg-amber hover:bg-amber-light text-black font-semibold px-8">
              {granting ? <><Loader2 className="size-4 animate-spin mr-2" />Retrying...</> : <><ShieldCheck className="size-4 mr-2" />Try Auto-Grant</>}
            </Button>
            <Button onClick={() => router.push('/admin/login')} variant="outline" className="border-white/10 text-white/60 hover:text-white hover:bg-white/5">
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
  return <AdminDashboard userId={userId} />
}
