'use client'

import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import { MuslyMark } from '@/components/ui/MuslyLogo'
import { useAuth } from '@/contexts/AuthContext'
import OnboardingQuiz from '@/components/onboarding/OnboardingQuiz'
import { getTeacherProfile, type TeacherProfile } from '@/lib/db/teacherProfile'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed,    setCollapsed]    = useState(false)
  const [mobileOpen,   setMobileOpen]   = useState(false)

  // ── Onboarding gate ───────────────────────────────────────────────────────
  const { user } = useAuth()
  const [profileChecked, setProfileChecked] = useState(false)
  const [showQuiz,       setShowQuiz]       = useState(false)

  useEffect(() => {
    if (!user) return
    // Only teachers go through onboarding
    if (user.role !== 'professor') { setProfileChecked(true); return }

    getTeacherProfile(user.id).then((profile) => {
      setShowQuiz(!profile)
      setProfileChecked(true)
    }).catch(() => {
      // On error, don't block — let them in
      setProfileChecked(true)
    })
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sidebar collapse persistence ──────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('harmoniq_sidebar_collapsed')
      if (saved === 'true') setCollapsed(true)
    } catch {}
  }, [])

  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v
      try { localStorage.setItem('harmoniq_sidebar_collapsed', String(next)) } catch {}
      return next
    })
  }

  // ── Quiz completion ────────────────────────────────────────────────────────
  function handleQuizComplete(_profile: TeacherProfile) {
    setShowQuiz(false)
  }

  // ── Loading state (brief) ─────────────────────────────────────────────────
  if (!profileChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Full-screen onboarding quiz — rendered on top of everything */}
      {showQuiz && user && (
        <OnboardingQuiz
          userId={user.id}
          userName={user.firstName}
          onComplete={handleQuizComplete}
        />
      )}

      {/* Normal dashboard shell */}
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Mobile backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          onToggleCollapsed={toggleCollapsed}
        />

        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          {/* Mobile top bar */}
          <div className="flex h-14 flex-shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-4 lg:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <MuslyMark size={28} />
              <span className="text-base font-bold text-gray-900">Musly</span>
            </div>
          </div>

          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </>
  )
}
