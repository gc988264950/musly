'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  Video,
  BookOpen,
  FolderOpen,
  ListMusic,
  Music,
  CreditCard,
  PhoneCall,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getStudentById } from '@/lib/db/students'
import { getLessonsByStudent } from '@/lib/db/lessons'
import { getStudentFiles } from '@/lib/db/studentFiles'
import { getFinancialByStudent } from '@/lib/db/financial'
import { getPaymentForStudentMonth, computeStatusForMonth, getDueDateForMonth } from '@/lib/db/payments'
import { cn } from '@/lib/utils'
import type { Student, Lesson, StudentFinancial, Payment } from '@/lib/db/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function currentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

interface BillingInfo {
  financial: StudentFinancial
  payment: Payment | null
  status: string
  dueDate: string
  diffDays: number
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentDashboardPage() {
  const { user } = useAuth()
  const linkedStudentId = user?.linkedStudentId

  const [student, setStudent] = useState<Student | null>(null)
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([])
  const [recentHomework, setRecentHomework] = useState<Lesson[]>([])
  const [filesCount, setFilesCount] = useState(0)
  const [billing, setBilling] = useState<BillingInfo | null>(null)

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (!linkedStudentId) return

    getStudentById(linkedStudentId).then((s) => {
      setStudent(s)
    }).catch(() => {})

    getLessonsByStudent(linkedStudentId).then((lessons) => {
      const upcoming = lessons
        .filter((l) => l.status === 'agendada' && l.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      setUpcomingLessons(upcoming)

      const homework = lessons
        .filter((l) => l.status === 'concluída' && l.homework && l.homework.trim())
        .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
        .slice(0, 3)
      setRecentHomework(homework)
    }).catch(() => {})

    getStudentFiles(linkedStudentId).then((files) => setFilesCount(files.length)).catch(() => {})

    const thisMonth = currentYearMonth()
    Promise.all([
      getFinancialByStudent(linkedStudentId),
      getPaymentForStudentMonth(linkedStudentId, thisMonth),
    ]).then(([financial, payment]) => {
      if (!financial) return
      const fin = financial as StudentFinancial
      const status = computeStatusForMonth(fin, payment, thisMonth)
      const dueDate = getDueDateForMonth(fin.dueDayOfMonth, thisMonth)

      const todayDate = new Date()
      todayDate.setHours(0, 0, 0, 0)
      const dueDateObj = new Date(dueDate + 'T00:00:00')
      const diffDays = Math.round((dueDateObj.getTime() - todayDate.getTime()) / 86400000)

      setBilling({ financial: fin, payment, status, dueDate, diffDays })
    }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedStudentId])

  const nextLesson = upcomingLessons[0] ?? null

  if (!student) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
          <Music className="mx-auto mb-3 h-12 w-12 text-gray-200" />
          <p className="text-sm font-medium text-gray-500">Nenhum perfil vinculado</p>
          <p className="mt-1 text-xs text-gray-400">
            Entre em contato com seu professor para vincular sua conta.
          </p>
        </div>
      </div>
    )
  }

  // ── Billing display helpers ────────────────────────────────────────────────
  function getBillingCardStyle() {
    if (!billing) return ''
    if (billing.status === 'pago') return 'border-green-100 bg-green-50'
    if (billing.status === 'atrasado') return 'border-red-200 bg-red-50'
    if (billing.diffDays <= 3) return 'border-yellow-200 bg-yellow-50'
    return 'border-gray-100 bg-white'
  }

  function getBillingStatusBadge() {
    if (!billing) return null
    if (billing.status === 'pago') return { label: 'Em dia', cls: 'bg-green-100 text-green-700' }
    if (billing.status === 'atrasado') return { label: 'Atrasado', cls: 'bg-red-100 text-red-700' }
    if (billing.diffDays === 0) return { label: 'Vence hoje', cls: 'bg-orange-100 text-orange-700' }
    if (billing.diffDays <= 3) return { label: 'Vence em breve', cls: 'bg-yellow-100 text-yellow-700' }
    return { label: 'Em dia', cls: 'bg-green-100 text-green-700' }
  }

  function getBillingDynamicText() {
    if (!billing || billing.status === 'pago') return null
    const { diffDays, status } = billing
    if (status === 'atrasado') {
      const late = Math.abs(diffDays)
      return { text: `Sua mensalidade está atrasada há ${late} dia${late !== 1 ? 's' : ''}.`, cls: 'text-red-600' }
    }
    if (diffDays === 0) return { text: 'Sua mensalidade vence hoje.', cls: 'text-orange-600' }
    if (diffDays <= 3) return { text: `Faltam ${diffDays} dia${diffDays !== 1 ? 's' : ''} para o vencimento.`, cls: 'text-yellow-700' }
    return { text: `Faltam ${diffDays} dias para o vencimento.`, cls: 'text-gray-500' }
  }

  const billingBadge = getBillingStatusBadge()
  const billingText = getBillingDynamicText()

  return (
    <div className="p-6 lg:p-8 animate-in space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {user?.firstName}!
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {student.instrument} · {student.level}
        </p>
      </div>

      {/* Next Lesson card */}
      {nextLesson ? (
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Próxima Aula
            </span>
          </div>
          <p className="text-lg font-bold text-gray-900 capitalize">
            {formatDate(nextLesson.date)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              {nextLesson.time} · {formatDuration(nextLesson.duration)}
            </span>
            {nextLesson.instrument && (
              <span className="flex items-center gap-1.5">
                <Music className="h-3.5 w-3.5 text-gray-400" />
                {nextLesson.instrument}
              </span>
            )}
          </div>
          {nextLesson.topic && (
            <p className="mt-2 text-sm text-gray-500">
              <span className="font-medium text-gray-700">Tópico:</span> {nextLesson.topic}
            </p>
          )}
          {student.meetLink ? (
            <a
              href={student.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
            >
              <Video className="h-4 w-4" />
              Entrar na Aula
            </a>
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center">
          <Calendar className="mx-auto mb-2 h-8 w-8 text-gray-200" />
          <p className="text-sm font-medium text-gray-500">Nenhuma aula agendada</p>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Aulas', href: '/student/lessons', icon: Calendar, count: upcomingLessons.length, color: 'blue' },
          { label: 'Materiais', href: '/student/materials', icon: FolderOpen, count: filesCount, color: 'blue' },
          { label: 'Repertório', href: '/student/repertoire', icon: ListMusic, count: null, color: 'emerald' },
        ].map(({ label, href, icon: Icon, count, color }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 bg-white p-4 text-center transition-shadow hover:shadow-card-hover"
          >
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              color === 'blue' ? 'bg-blue-50' : color === 'purple' ? 'bg-[#eef5ff]' : 'bg-emerald-50'
            )}>
              <Icon size={18} className={cn(
                color === 'blue' ? 'text-blue-600' : color === 'purple' ? 'text-[#1a7cfa]' : 'text-emerald-600'
              )} />
            </div>
            <span className="text-xs font-semibold text-gray-700">{label}</span>
            {count !== null && (
              <span className="text-xs text-gray-400">{count}</span>
            )}
          </Link>
        ))}
      </div>

      {/* Billing card */}
      {billing && (
        <div className={cn('rounded-2xl border p-5', getBillingCardStyle())}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Minha Mensalidade</h2>
            </div>
            {billingBadge && (
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', billingBadge.cls)}>
                {billingBadge.label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-5 mb-3">
            <div>
              <p className="text-xs text-gray-400">Valor mensal</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(billing.financial.monthlyFee)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Vencimento</p>
              <p className="text-sm font-semibold text-gray-700">Dia {billing.financial.dueDayOfMonth}</p>
            </div>
            {billing.status === 'pago' && billing.payment?.paidAt && (
              <div>
                <p className="text-xs text-gray-400">Pago em</p>
                <p className="text-sm font-semibold text-green-700">
                  {new Date(billing.payment.paidAt + 'T00:00:00').toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
          </div>

          {billing.status === 'pago' ? (
            <p className="flex items-center gap-1.5 text-sm font-medium text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              Mensalidade paga — obrigado!
            </p>
          ) : billingText && (
            <p className={cn('text-sm font-medium mb-3', billingText.cls)}>
              {billingText.text}
            </p>
          )}

          {billing.status !== 'pago' && (billing.financial.paymentLink || billing.financial.contactLink) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {billing.financial.paymentLink && (
                <a
                  href={billing.financial.paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  <CreditCard className="h-4 w-4" />
                  Pagar agora
                </a>
              )}
              {billing.financial.contactLink && (
                <a
                  href={billing.financial.contactLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <PhoneCall className="h-4 w-4" />
                  Entrar em contato
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tarefas de casa */}
      {recentHomework.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#1a7cfa]" />
            <span className="text-xs font-semibold uppercase tracking-wide text-[#1a7cfa]">
              Tarefas de Casa
            </span>
          </div>
          <div className="space-y-3">
            {recentHomework.map((lesson) => (
              <div key={lesson.id} className="rounded-xl border border-[#b0d2ff]/40 bg-[#eef5ff] px-4 py-3">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                  Aula de {new Date(lesson.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                </p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{lesson.homework}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
