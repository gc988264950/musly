'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserRole = 'professor' | 'aluno'

export interface MockUser {
  id:               string
  email:            string
  firstName:        string
  lastName:         string
  instrument?:      string
  role:             UserRole
  linkedStudentId?: string
  createdAt:        string
}

interface AuthContextValue {
  user:    MockUser | null
  loading: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

// ─── Helper: map Supabase User → MockUser ────────────────────────────────────

export function supabaseUserToMock(u: User): MockUser {
  const meta = u.user_metadata ?? {}
  // Google provides full_name; email/password signup provides firstName/lastName
  const firstName = meta.firstName
    ?? meta.given_name
    ?? meta.full_name?.split(' ')[0]
    ?? ''
  const lastName  = meta.lastName
    ?? meta.family_name
    ?? meta.full_name?.split(' ').slice(1).join(' ')
    ?? ''
  return {
    id:               u.id,
    email:            u.email ?? '',
    firstName,
    lastName,
    instrument:       meta.instrument,
    role:             (meta.role as UserRole) ?? 'professor',
    linkedStudentId:  meta.linkedStudentId,
    createdAt:        u.created_at,
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user:    null,
  loading: true,
  refresh: async () => {},
  signOut: async () => {},
})

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<MockUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const refresh = useCallback(async () => {
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u ? supabaseUserToMock(u) : null)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    // Initial load
    refresh()

    // Stay in sync with Supabase auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? supabaseUserToMock(session.user) : null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [refresh, supabase])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/login')
  }, [supabase, router])

  return (
    <AuthContext.Provider value={{ user, loading, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth() {
  return useContext(AuthContext)
}
