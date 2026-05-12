'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useStore } from '@/store'
import { useAuth } from '@/components/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'

export function AuthModal() {
  const { ui, closeAuthModal, setUI } = useStore()

  const switchTab = useCallback(
    (tab: 'login' | 'signup') => {
      setUI({ authModalTab: tab })
    },
    [setUI]
  )

  // Key forces form remount on modal open to reset fields/password visibility
  const formKey = ui.authModalOpen ? 'open' : 'closed'

  return (
    <Dialog open={ui.authModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <DialogContent className="bg-navy-card border-white/10 sm:max-w-md backdrop-blur-xl">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            <BookOpen className="size-5 text-amber" />
            <span>
              <span className="text-amber">Kitaab</span>
              <span className="text-white">Kharido</span>
            </span>
          </DialogTitle>
          <DialogDescription className="text-white/50">
            Access your account to manage orders and track deliveries
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={ui.authModalTab}
          onValueChange={(val) => switchTab(val as 'login' | 'signup')}
          className="mt-2"
        >
          <TabsList className="w-full bg-white/5 h-11 rounded-lg p-1">
            <TabsTrigger
              value="login"
              className="flex-1 rounded-md text-sm font-medium data-[state=active]:bg-amber data-[state=active]:text-navy data-[state=active]:shadow-sm text-white/50 transition-all"
            >
              Login
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className="flex-1 rounded-md text-sm font-medium data-[state=active]:bg-amber data-[state=active]:text-navy data-[state=active]:shadow-sm text-white/50 transition-all"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login" key={`login-${formKey}`}>
            <LoginForm
              switchToSignup={() => switchTab('signup')}
              onSuccess={() => closeAuthModal()}
            />
          </TabsContent>

          {/* Signup Tab */}
          <TabsContent value="signup" key={`signup-${formKey}`}>
            <SignupForm
              switchToLogin={() => switchTab('login')}
              onSuccess={() => closeAuthModal()}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

/* ===================== Login Form ===================== */
function LoginForm({
  switchToSignup,
  onSuccess,
}: {
  switchToSignup: () => void
  onSuccess: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { refreshProfile } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) throw error
      toast.success('Welcome back!')
      await refreshProfile()
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const supabase = createClient()
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kitaab-kharido-omega.vercel.app'
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      toast.error(error.message || 'Google login failed. Please try again.')
    }
  }

  return (
    <div className="space-y-4">
      {/* Google OAuth */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white font-medium"
        onClick={handleGoogleLogin}
      >
        <GoogleIcon />
        Continue with Google
      </Button>

      <div className="relative">
        <Separator className="bg-white/10" />
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-navy-card px-3 text-xs text-white/30">
          or continue with email
        </span>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email" className="text-white/70 text-sm">
            Email
          </Label>
          <Input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-11 focus-visible:border-amber focus-visible:ring-amber/20"
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-password" className="text-white/70 text-sm">
            Password
          </Label>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-11 pr-10 focus-visible:border-amber focus-visible:ring-amber/20"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-amber hover:bg-amber-light text-navy font-semibold"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Logging in...
            </>
          ) : (
            'Login'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-white/40">
        Don&apos;t have an account?{' '}
        <button
          onClick={switchToSignup}
          className="text-amber hover:text-amber-light font-medium transition-colors"
        >
          Sign Up
        </button>
      </p>
    </div>
  )
}

/* ===================== Signup Form ===================== */
function SignupForm({
  switchToLogin,
  onSuccess,
}: {
  switchToLogin: () => void
  onSuccess: () => void
}) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { refreshProfile } = useAuth()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      toast.error('Please fill in all fields')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      })
      if (error) throw error
      toast.success('Account created! Please check your email to verify.')
      await refreshProfile()
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    try {
      const supabase = createClient()
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kitaab-kharido-omega.vercel.app'
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      toast.error(error.message || 'Google signup failed. Please try again.')
    }
  }

  return (
    <div className="space-y-4">
      {/* Google OAuth */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white font-medium"
        onClick={handleGoogleSignup}
      >
        <GoogleIcon />
        Continue with Google
      </Button>

      <div className="relative">
        <Separator className="bg-white/10" />
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-navy-card px-3 text-xs text-white/30">
          or continue with email
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signup-name" className="text-white/70 text-sm">
            Full Name
          </Label>
          <Input
            id="signup-name"
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-11 focus-visible:border-amber focus-visible:ring-amber/20"
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-email" className="text-white/70 text-sm">
            Email
          </Label>
          <Input
            id="signup-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-11 focus-visible:border-amber focus-visible:ring-amber/20"
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password" className="text-white/70 text-sm">
            Password
          </Label>
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-11 pr-10 focus-visible:border-amber focus-visible:ring-amber/20"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-amber hover:bg-amber-light text-navy font-semibold"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-white/40">
        Already have an account?{' '}
        <button
          onClick={switchToLogin}
          className="text-amber hover:text-amber-light font-medium transition-colors"
        >
          Login
        </button>
      </p>
    </div>
  )
}

/* ===================== Google SVG Icon ===================== */
function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}
