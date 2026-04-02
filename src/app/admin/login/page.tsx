'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Shield, BookOpen, ArrowLeft, Lock, ShieldCheck, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'login' | 'granting' | 'error'>('login')
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    setStep('login')
    setErrorMsg('')

    try {
      const supabase = createClient()

      // Step 1: Sign in with email/password
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) throw error

      // Step 2: Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Session not established')

      // Step 3: Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (profile?.is_admin) {
        // Already admin - go straight to dashboard
        toast.success('Welcome back, Admin!')
        router.push('/admin')
        return
      }

      // Step 4: Not admin yet - try auto-granting
      setStep('granting')
      console.log('[Admin Login] Not admin, attempting auto-grant...')

      try {
        const grantRes = await fetch('/api/admin/grant', { method: 'POST' })
        const grantData = await grantRes.json()

        if (grantData.success) {
          toast.success(grantData.message || 'Admin access granted!')
          router.push('/admin')
          return
        }

        // Auto-grant failed - show helpful error with SQL instructions
        console.error('[Admin Login] Auto-grant failed:', grantData.error)
        setErrorMsg(grantData.error || 'Failed to grant admin access')
        setStep('error')

        // Sign out since they can't access admin
        await supabase.auth.signOut()
      } catch (grantErr) {
        console.error('[Admin Login] Grant request failed:', grantErr)
        setErrorMsg('Network error while setting up admin access')
        setStep('error')
        await supabase.auth.signOut()
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Login failed'
      if (msg.includes('Invalid login credentials') || msg.includes('Email not confirmed')) {
        toast.error('Invalid email or password. Please check your credentials.')
      } else {
        toast.error(msg)
      }
      setStep('login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-navy flex items-center justify-center px-4 overflow-y-auto">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber/3 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md my-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber/10 border border-amber/20 mb-4">
            <Shield className="size-8 text-amber" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            <span className="text-amber">Admin</span> Panel
          </h1>
          <p className="text-white/40 text-sm">Kitaab Kharido Administration</p>
        </div>

        {/* Error State - Show SQL setup instructions */}
        {step === 'error' && (
          <div className="bg-navy-card border border-red-500/20 rounded-2xl p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="size-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Admin Setup Required</h2>
                <p className="text-white/40 text-xs">One-time setup needed</p>
              </div>
            </div>

            <p className="text-white/60 text-sm mb-4">
              Your account exists but doesn&apos;t have admin privileges yet. This is a one-time setup.
            </p>

            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <p className="text-amber text-xs font-semibold uppercase tracking-wider mb-3">Quick Fix — Run this SQL in Supabase Dashboard</p>
              <ol className="text-white/60 text-xs space-y-2">
                <li className="flex gap-2">
                  <span className="text-amber font-bold">1.</span>
                  <span>Go to <span className="text-white/80 font-mono">supabase.com</span> → Your Project → <span className="text-white/80">SQL Editor</span></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber font-bold">2.</span>
                  <span>Paste this SQL and click <span className="text-white/80">Run</span>:</span>
                </li>
              </ol>
              <div className="mt-3 bg-black/30 rounded-lg p-3 font-mono text-[11px] text-amber/80 leading-relaxed overflow-x-auto">
                <pre>{`UPDATE profiles
SET is_admin = true
WHERE email IN (
  SELECT email FROM auth.users
  WHERE email = 'kitaabkharido41@gmail.com'
);`}</pre>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep('login')}
                variant="outline"
                className="flex-1 border-white/10 text-white/60 hover:text-white hover:bg-white/5 text-sm"
              >
                <ArrowLeft className="size-4 mr-2" />
                Back to Login
              </Button>
              <Button
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                className="flex-1 bg-amber hover:bg-amber-light text-navy font-semibold text-sm"
              >
                Open Supabase
              </Button>
            </div>
          </div>
        )}

        {/* Login Form (default + granting states) */}
        {step !== 'error' && (
          <div className="bg-navy-card border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-2 mb-6">
              <Lock className="size-4 text-amber/60" />
              <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Secure Login</h2>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="admin-email" className="text-white/60 text-sm font-medium">
                  Admin Email
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@kitaabkharido.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-12 px-4 rounded-lg focus-visible:border-amber focus-visible:ring-amber/20 transition-colors"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-white/60 text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-12 px-4 pr-12 rounded-lg focus-visible:border-amber focus-visible:ring-amber/20 transition-colors"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-amber hover:bg-amber-light text-navy font-bold rounded-lg text-sm transition-all hover:shadow-lg hover:shadow-amber/20"
                disabled={loading}
              >
                {step === 'granting' ? (
                  <>
                    <ShieldCheck className="size-4 animate-pulse mr-2" />
                    Setting up admin access...
                  </>
                ) : loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Lock className="size-4 mr-2" />
                    Sign In to Admin
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-white/5">
              <Button
                variant="ghost"
                className="w-full text-white/40 hover:text-white/70 hover:bg-white/5 text-sm h-9"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="size-4 mr-2" />
                Back to Kitaab Kharido
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-white/20 text-xs mt-6">
          <BookOpen className="size-3 inline mr-1" />
          Kitaab Kharido &mdash; Admin Access Only
        </p>
      </div>
    </div>
  )
}
