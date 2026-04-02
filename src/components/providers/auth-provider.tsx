'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/supabase/types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const supabase = createClient()

      // Step 1: Try to read existing profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (data) {
        // Profile exists — use it
        console.log('[Auth] Profile loaded:', data.full_name, 'is_admin:', data.is_admin)
        setProfile(data as Profile)
        return
      }

      // Step 2: Profile not found — try to create it
      console.log('[Auth] Profile not found, creating...', error?.message || 'no data returned')

      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) {
        console.log('[Auth] No user session, skipping profile creation')
        return
      }

      const meta = userData.user.user_metadata || {}

      const { data: newProfile, error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: meta.full_name || meta.name || '',
          phone: meta.phone || '',
          avatar_url: meta.avatar_url || meta.picture || '',
          // DO NOT include is_admin — let DB default handle it
        })
        .select()
        .single()

      if (upsertError) {
        console.error('[Auth] Profile upsert failed:', upsertError.message)
        // Last resort: try a raw insert
        const { data: insertData, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: meta.full_name || meta.name || '',
          })
          .select()
          .single()

        if (insertError) {
          console.error('[Auth] Profile insert also failed:', insertError.message)
        } else if (insertData) {
          console.log('[Auth] Profile created via insert:', insertData)
          setProfile(insertData as Profile)
        }
      } else if (newProfile) {
        console.log('[Auth] Profile created via upsert:', newProfile.full_name, 'is_admin:', newProfile.is_admin)
        setProfile(newProfile as Profile)
      }
    } catch (err) {
      console.error('[Auth] fetchProfile exception:', err)
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[Auth] Initial session:', session?.user?.email || 'no session')
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] State change:', event, session?.user?.email || 'no session')
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }, [user, fetchProfile])

  const signOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
