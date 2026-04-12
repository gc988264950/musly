'use client'

import { useState, useMemo } from 'react'
import { Menu, AlertTriangle } from 'lucide-react'
import StudentSidebar from '@/components/layout/StudentSidebar'
import { useAuth } from '@/contexts/AuthContext'
import { getFinancialByStudent } from '@/lib/db/financial'
import { getPaymentForStudentMonth, computeStatusForMonth, getDueDateForMonth } from '@/lib/db/payments'
import { cn } from '@/lib/utils'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function currentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useAuth()

  // ── Billing alert ─────────────────────────────────────────────────────────
  const billingAlert = useMemo(() => {
    const linkedStudentId = user?.linkedStudentId
    if (!linkedStudentId) return null

    const financial = getFinancialByStudent(linkedStudentId)
    if (!financial) return null

    const thisMonth = currentYearMonth()
    const payment = getPaymentForStudentMonth(linkedStudentId, thisMonth)
    const status = computeStatusForMonth(financial, payment, thisMonth)

    if (status === 'pago') return null

    const dueDate = getDueDateForMonth(financial.dueDayOfMonth, thisMonth)
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    const dueDateObj = new Date(dueDate + 'T00:00:00')
    const diffDays = Math.round((dueDateObj.getTime() - todayDate.getTime()) / 86400000)

    if (status === 'atrasado') {
      const late = Math.abs(diffDays)
      return {
        message: `Sua mensalidade está em atraso há ${late} dia${late !== 1 ? 's' : ''}. Regularize o pagamento.`,
        variant: 'red' as const,
      }
    }
    if (diffDays === 0) {
      return {
        message: 'Sua mensalidade vence hoje.',
        variant: 'orange' as const,
      }
    }
    if (diffDays <= 3) {
      return {
        message: `Sua mensalidade está próxima do vencimento — faltam ${diffDays} dia${diffDays !== 1 ? 's' : ''}.`,
        variant: 'yellow' as const,
      }
    }
    return null
  }, [user?.linkedStudentId])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <StudentSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-gray-700">Musly</span>
        </header>

        {/* Billing notification bar */}
        {billingAlert && (
          <div className={cn(
            'flex items-center gap-2 px-5 py-2.5 text-sm font-medium',
            billingAlert.variant === 'red'
              ? 'bg-red-600 text-white'
              : billingAlert.variant === 'orange'
              ? 'bg-orange-500 text-white'
              : 'bg-yellow-400 text-yellow-900'
          )}>
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {billingAlert.message}
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
