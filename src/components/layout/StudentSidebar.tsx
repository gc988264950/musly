'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  FolderOpen,
  ListMusic,
  User,
  LogOut,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { getInitials } from '@/lib/utils'
import { getFinancialByStudent } from '@/lib/db/financial'
import { getPaymentForStudentMonth, computeStatusForMonth, getDueDateForMonth } from '@/lib/db/payments'
import { MuslyMark } from '@/components/ui/MuslyLogo'
import type { StudentFinancial } from '@/lib/db/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function currentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// ─── Nav items ────────────────────────────────────────────────────────────────

const navItems = [
  { label: 'Painel', href: '/student/dashboard', icon: LayoutDashboard },
  { label: 'Próximas Aulas', href: '/student/lessons', icon: Calendar },
  { label: 'Materiais', href: '/student/materials', icon: FolderOpen },
  { label: 'Repertório', href: '/student/repertoire', icon: ListMusic },
  { label: 'Meu Perfil', href: '/student/profile', icon: User },
]

interface StudentSidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function StudentSidebar({
  mobileOpen = false,
  onMobileClose,
}: StudentSidebarProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [billingAlertLevel, setBillingAlertLevel] = useState<'red' | 'yellow' | null>(null)

  const fullName = user ? `${user.firstName} ${user.lastName}` : ''
  const initials = fullName ? getInitials(fullName) : '?'

  // ── Billing alert badge ───────────────────────────────────────────────────
  useEffect(() => {
    const linkedStudentId = user?.linkedStudentId
    if (!linkedStudentId) return

    const thisMonth = currentYearMonth()

    Promise.all([
      getFinancialByStudent(linkedStudentId),
      getPaymentForStudentMonth(linkedStudentId, thisMonth),
    ]).then(([financial, payment]) => {
      if (!financial) { setBillingAlertLevel(null); return }

      const status = computeStatusForMonth(financial as StudentFinancial, payment, thisMonth)
      if (status === 'pago') { setBillingAlertLevel(null); return }
      if (status === 'atrasado') { setBillingAlertLevel('red'); return }

      const dueDate = getDueDateForMonth((financial as StudentFinancial).dueDayOfMonth, thisMonth)
      const todayDate = new Date()
      todayDate.setHours(0, 0, 0, 0)
      const dueDateObj = new Date(dueDate + 'T00:00:00')
      const diffDays = Math.round((dueDateObj.getTime() - todayDate.getTime()) / 86400000)

      setBillingAlertLevel(diffDays <= 3 ? 'yellow' : null)
    }).catch(() => {})
  }, [user?.linkedStudentId])

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'flex flex-shrink-0 flex-col border-r border-gray-100 bg-white transition-all duration-200',
          'w-64',
          'fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <MuslyMark size={30} />
            <div>
              <span className="text-sm font-bold text-gray-900">Musly</span>
              <p className="text-[10px] text-gray-400 leading-none">Portal do Aluno</p>
            </div>
          </div>
          <button
            onClick={onMobileClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              const showBadge = item.href === '/student/dashboard' && billingAlertLevel !== null
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onMobileClose}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-[#eef5ff] text-[#1a7cfa]'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon size={18} className={active ? 'text-[#1a7cfa]' : 'text-gray-400'} />
                  <span className="flex-1">{item.label}</span>
                  {showBadge && (
                    <span className={cn(
                      'h-2 w-2 rounded-full flex-shrink-0',
                      billingAlertLevel === 'red' ? 'bg-red-500' : 'bg-yellow-400'
                    )} />
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User section */}
        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <div className="relative flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a7cfa] text-xs font-semibold text-white">
                {initials}
              </div>
              {billingAlertLevel && (
                <span className={cn(
                  'absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white',
                  billingAlertLevel === 'red' ? 'bg-red-500' : 'bg-yellow-400'
                )} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{fullName || 'Aluno'}</p>
              <p className="truncate text-xs text-gray-400">{user?.email ?? ''}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}
