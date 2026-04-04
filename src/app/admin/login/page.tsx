'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Shield, BookOpen, ArrowLeft, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)

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

      // Step 3: Admin check is purely email-based — no profiles table needed
      const ADMIN_EMAILS = ['kitaabkharido41@gmail.com']
      if (!ADMIN_EMAILS.includes(user.email || '')) {
        toast.error('This account does not have admin privileges')
        await supabase.auth.signOut()
        return
      }

      // Success — redirect to admin dashboard
      toast.success('Welcome back, Admin!')
      router.push('/admin')
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Login failed'
      if (msg.includes('Invalid login credentials') || msg.includes('Email not confirmed')) {
        toast.error('Invalid email or password')
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-[#060d1f] flex items-center justify-center px-4 overflow-y-auto">
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

        {/* Login Form */}
        <div className="bg-[#0f1730] border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/20">
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
              className="w-full h-12 bg-amber hover:bg-amber/90 text-black font-bold rounded-lg text-sm transition-all hover:shadow-lg hover:shadow-amber/20"
              disabled={loading}
            >
              {loading ? (
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

        {/* Footer */}
        <p className="text-center text-white/20 text-xs mt-6">
          <BookOpen className="size-3 inline mr-1" />
          Kitaab Kharido — Admin Access Only
        </p>
      </div>
    </div>
  )
}
