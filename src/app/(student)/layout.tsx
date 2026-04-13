'use client'

import { useState, useEffect } from 'react'
import { Menu, AlertTriangle } from 'lucide-react'
import StudentSidebar from '@/components/layout/StudentSidebar'
import { useAuth } from '@/contexts/AuthContext'
import { getFinancialByStudent } from '@/lib/db/financial'
import { getPaymentForStudentMonth, computeStatusForMonth, getDueDateForMonth } from '@/lib/db/payments'
import { cn } from '@/lib/utils'
import type { StudentFinancial } from '@/lib/db/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function currentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

interface BillingAlert {
  message: string
  variant: 'red' | 'orange' | 'yellow'
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useAuth()
  const [billingAlert, setBillingAlert] = useState<BillingAlert | null>(null)

  useEffect(() => {
    const linkedStudentId = user?.linkedStudentId
    if (!linkedStudentId) return

    const thisMonth = currentYearMonth()

    Promise.all([
      getFinancialByStudent(linkedStudentId),
      getPaymentForStudentMonth(linkedStudentId, thisMonth),
    ]).then(([financial, payment]) => {
      if (!financial) return

      const status = computeStatusForMonth(financial as StudentFinancial, payment, thisMonth)
      if (status === 'pago') { setBillingAlert(null); return }

      const dueDate = getDueDateForMonth((financial as StudentFinancial).dueDayOfMonth, thisMonth)
      const todayDate = new Date()
      todayDate.setHours(0, 0, 0, 0)
      const dueDateObj = new Date(dueDate + 'T00:00:00')
      const diffDays = Math.round((dueDateObj.getTime() - todayDate.getTime()) / 86400000)

      if (status === 'atrasado') {
        const late = Math.abs(diffDays)
        setBillingAlert({
          message: `Sua mensalidade está em atraso há ${late} dia${late !== 1 ? 's' : ''}. Regularize o pagamento.`,
          variant: 'red',
        })
      } else if (diffDays === 0) {
        setBillingAlert({ message: 'Sua mensalidade vence hoje.', variant: 'orange' })
      } else if (diffDays <= 3) {
        setBillingAlert({
          message: `Sua mensalidade está próxima do vencimento — faltam ${diffDays} dia${diffDays !== 1 ? 's' : ''}.`,
          variant: 'yellow',
        })
      } else {
        setBillingAlert(null)
      }
    }).catch(() => {})
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
