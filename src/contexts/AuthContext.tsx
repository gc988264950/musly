'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, logOut as mockLogOut, type MockUser } from '@/lib/mock-auth'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: MockUser | null
  /** True while the session is being read from localStorage on first load. */
  loading: boolean
  /** Re-reads the session from localStorage (call after login/signup). */
  refresh: () => void
  /** Clears session, cookie, and redirects to /login. */
  signOut: () => void
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refresh: () => {},
  signOut: () => {},
})

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refresh = useCallback(() => {
    const session = getSession()
    setUser(session?.user ?? null)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const signOut = useCallback(() => {
    mockLogOut()
    setUser(null)
    router.push('/login')
  }, [router])

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
