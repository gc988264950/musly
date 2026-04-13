'use client'

import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import { MuslyMark } from '@/components/ui/MuslyLogo'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Restore collapsed state from localStorage
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

  return (
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
  )
}
