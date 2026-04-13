'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useStudents } from '@/hooks/useStudents'
import { useLessons } from '@/hooks/useLessons'
import { useFinancial, formatCurrency, currentYearMonth, formatMonth } from '@/hooks/useFinancial'
import { useNotifications } from '@/hooks/useNotifications'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import {
  Users, Calendar, CheckCircle2, Clock, Music,
  ArrowUpRight, BookOpen, Plus, Crown, Zap,
  DollarSign, TrendingUp, AlertCircle, Sparkles, Bell,
  AlertTriangle, CreditCard, PhoneCall, PlayCircle, Video,
  CalendarDays, ChevronRight,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { PLANS } from '@/lib/plans'
import type { LessonStatus } from '@/lib/db/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function formatDate() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(time: string): string {
  const [h, m] = time.split(':')
  return `${h}h${m !== '00' ? m : ''}`
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}min`
}

const statusStyle: Record<LessonStatus, { pill: string; dot: string }> = {
  agendada: { pill: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  concluída: { pill: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  cancelada: { pill: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
  falta: { pill: 'bg-red-100 text-red-600', dot: 'bg-red-500' },
}

const avatarGradients = [
  'from-[#1a7cfa] to-[#1468d6]',
  'from-emerald-500 to-teal-600',
  'from-indigo-500 to-blue-600',
  'from-orange-500 to-amber-600',
  'from-[#1057b0] to-[#0d2d5e]',
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { students, loading: studentsLoading } = useStudents()
  const { lessons, todayLessons, thisWeekLessons, create: createLesson, loading: lessonsLoading } = useLessons()
  const { summary, rows: financialRows, loading: financialLoading } = useFinancial()
  const { unreadCount } = useNotifications()
  const { planId, plan, studentsCount, aiPlansThisMonth } = useSubscription()

  const loading = authLoading || studentsLoading || lessonsLoading || financialLoading

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  const completedLessons = lessons.filter((l) => l.status === 'concluída')

  // Stats
  const stats = [
    {
      label: 'Total de Alunos',
      value: String(students.length),
      sub: students.length === 0 ? 'Nenhum aluno cadastrado' : `${students.length} ativo${students.length !== 1 ? 's' : ''}`,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: '/students',
    },
    {
      label: 'Aulas Esta Semana',
      value: String(thisWeekLessons.length),
      sub: thisWeekLessons.length === 0 ? 'Nenhuma aula esta semana' : `${todayLessons.length} hoje`,
      icon: Calendar,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      href: '/lessons',
    },
    {
      label: 'Aulas Hoje',
      value: String(todayLessons.length),
      sub: todayLessons.length === 0 ? 'Dia livre' : `${todayLessons.filter(l => l.status === 'concluída').length} concluída${todayLessons.filter(l => l.status === 'concluída').length !== 1 ? 's' : ''}`,
      icon: Clock,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      href: '/lessons',
    },
    {
      label: 'Aulas Concluídas',
      value: String(completedLessons.length),
      sub: lessons.length === 0 ? 'Sem histórico ainda' : `de ${lessons.length} total`,
      icon: CheckCircle2,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      href: '/lessons',
    },
  ]

  // Recent students (last 5 added)
  const recentStudents = [...students]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  const isDataEmpty = students.length === 0 && lessons.length === 0

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-in">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm capitalize text-gray-400">{formatDate()}</p>
          <h1 className="mt-0.5 text-2xl font-bold text-gray-900">
            {getGreeting()}, {user?.firstName ?? 'Professor'}
          </h1>
          {todayLessons.length > 0 ? (
            <p className="mt-1 text-gray-500">
              Você tem{' '}
              <span className="font-semibold text-blue-600">
                {todayLessons.length} aula{todayLessons.length !== 1 ? 's' : ''}
              </span>{' '}
              agendada{todayLessons.length !== 1 ? 's' : ''} para hoje.
            </p>
          ) : (
            <p className="mt-1 text-gray-500">Sem aulas agendadas para hoje.</p>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <Link href="/students">
            <Button variant="outline" size="sm">
              <Users className="h-3.5 w-3.5" /> Novo Aluno
            </Button>
          </Link>
          <Link href="/lessons">
            <Button variant="primary" size="sm">
              <Plus className="h-3.5 w-3.5" /> Nova Aula
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="cursor-pointer p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                    <p className="mt-1 text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{stat.sub}</p>
                  </div>
                  <div className={cn('rounded-xl p-3', stat.bg)}>
                    <Icon className={cn('h-5 w-5', stat.color)} />
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-gray-900">Ações rápidas</h2>
            {unreadCount > 0 && (
              <Link href="/notifications" className="flex items-center gap-1.5 text-sm text-amber-600 font-medium hover:text-amber-700">
                <Bell className="h-3.5 w-3.5" />
                {unreadCount} alerta{unreadCount !== 1 ? 's' : ''}
              </Link>
            )}
          </div>
          <div className="flex flex-wrap gap-3 px-6 py-4">
            <Link href="/lessons">
              <Button variant="primary" size="sm">
                <Plus className="h-3.5 w-3.5" /> Nova Aula
              </Button>
            </Link>
            <Link href="/students">
              <Button variant="outline" size="sm">
                <Users className="h-3.5 w-3.5" /> Novo Aluno
              </Button>
            </Link>
            {students.length > 0 && (
              <Link href={`/students/${students[0].id}?tab=ai-planner`}>
                <Button variant="outline" size="sm">
                  <Sparkles className="h-3.5 w-3.5" /> Gerar Plano de Aula
                </Button>
              </Link>
            )}
          </div>
        </Card>
      </div>

      {/* Financial summary */}
      {summary.totalWithSettings > 0 && (
        <div className="mb-8">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Financeiro — {formatMonth(currentYearMonth())}</h2>
              <Link
                href="/billing"
                className="flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-[#1468d6]"
              >
                Ver detalhes <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0 px-0 py-0">
              {/* Expected */}
              <div className="flex items-center gap-3 px-6 py-4">
                <div className="rounded-xl bg-blue-50 p-2.5">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Previsão</p>
                  <p className="font-bold text-gray-900">{formatCurrency(summary.forecast)}</p>
                </div>
              </div>
              {/* Received */}
              <div className="flex items-center gap-3 px-6 py-4">
                <div className="rounded-xl bg-green-50 p-2.5">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Recebido</p>
                  <p className="font-bold text-green-700">{formatCurrency(summary.revenue)}</p>
                </div>
              </div>
              {/* Pending */}
              <div className="flex items-center gap-3 px-6 py-4">
                <div className={cn('rounded-xl p-2.5', summary.overdueCount > 0 ? 'bg-red-50' : 'bg-yellow-50')}>
                  <AlertCircle className={cn('h-4 w-4', summary.overdueCount > 0 ? 'text-red-500' : 'text-yellow-600')} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pendente</p>
                  <p className={cn('font-bold', summary.overdueCount > 0 ? 'text-red-600' : 'text-yellow-700')}>
                    {formatCurrency(summary.forecast - summary.revenue)}
                  </p>
                  {summary.overdueCount > 0 && (
                    <p className="text-[11px] text-red-400">{summary.overdueCount} atrasado{summary.overdueCount !== 1 ? 's' : ''}</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Payment alerts */}
      {(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const overdue = financialRows.filter((r) => r.status === 'atrasado')
        const dueSoon = financialRows.filter((r) => {
          if (r.status !== 'pendente' || !r.dueDate) return false
          const due = new Date(r.dueDate + 'T00:00:00')
          const diff = Math.round((due.getTime() - today.getTime()) / 86400000)
          return diff >= 0 && diff <= 3
        })

        if (overdue.length === 0 && dueSoon.length === 0) return null

        return (
          <div className="mb-8">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h2 className="font-semibold text-gray-900">Pagamentos</h2>
                <Link
                  href="/billing"
                  className="flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-[#1468d6]"
                >
                  Ver todos <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {overdue.map((r) => {
                  const due = new Date(r.dueDate! + 'T00:00:00')
                  const daysLate = Math.round((today.getTime() - due.getTime()) / 86400000)
                  return (
                    <Link
                      key={r.student.id}
                      href={`/students/${r.student.id}?tab=financeiro`}
                      className="flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-red-50"
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{r.student.name}</p>
                        <p className="text-xs text-red-600">Atrasado há {daysLate} dia{daysLate !== 1 ? 's' : ''}</p>
                      </div>
                      <span className="text-sm font-bold text-red-600">{r.financial ? r.financial.monthlyFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''}</span>
                      <span className="hidden rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold text-red-600 sm:inline">Atrasado</span>
                    </Link>
                  )
                })}
                {dueSoon.map((r) => {
                  const due = new Date(r.dueDate! + 'T00:00:00')
                  const daysLeft = Math.round((due.getTime() - today.getTime()) / 86400000)
                  return (
                    <Link
                      key={r.student.id}
                      href={`/students/${r.student.id}?tab=financeiro`}
                      className="flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-yellow-50"
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100">
                        <CreditCard className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{r.student.name}</p>
                        <p className="text-xs text-yellow-700">
                          {daysLeft === 0 ? 'Vence hoje' : `Vence em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-yellow-700">{r.financial ? r.financial.monthlyFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''}</span>
                      <span className="hidden rounded-full bg-yellow-100 px-2.5 py-0.5 text-[11px] font-semibold text-yellow-700 sm:inline">Vence em breve</span>
                    </Link>
                  )
                })}
              </div>
            </Card>
          </div>
        )
      })()}

      {/* Plan usage widget */}
      <div className="mb-8">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg',
                planId === 'pro' ? 'bg-[#eef5ff]' : planId === 'studio' ? 'bg-[#d6eaff]' : 'bg-gray-100'
              )}>
                {planId === 'free' ? (
                  <Crown size={14} className="text-gray-500" />
                ) : (
                  <Zap size={14} className="text-[#1a7cfa]" />
                )}
              </div>
              <h2 className="font-semibold text-gray-900">
                Plano {plan.name}
              </h2>
            </div>
            <Link
              href="/plans"
              className="text-sm font-medium text-blue-600 transition-colors hover:text-[#1468d6]"
            >
              {planId === 'free' ? 'Fazer upgrade' : 'Ver planos'}
            </Link>
          </div>
          <div className="px-6 py-4">
            {planId === 'free' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Students usage */}
                <div>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-gray-500">Alunos cadastrados</span>
                    <span className="font-semibold text-gray-700">
                      {studentsCount} / {PLANS.free.limits.students}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        studentsCount >= (PLANS.free.limits.students ?? 0) ? 'bg-red-500' : 'bg-blue-500'
                      )}
                      style={{ width: `${Math.min(100, (studentsCount / (PLANS.free.limits.students ?? 1)) * 100)}%` }}
                    />
                  </div>
                </div>
                {/* AI plans usage */}
                <div>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-gray-500">Planos IA este mês</span>
                    <span className="font-semibold text-gray-700">
                      {aiPlansThisMonth} / {PLANS.free.limits.aiPlansPerMonth}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        aiPlansThisMonth >= (PLANS.free.limits.aiPlansPerMonth ?? 0) ? 'bg-red-500' : 'bg-[#1a7cfa]'
                      )}
                      style={{ width: `${Math.min(100, (aiPlansThisMonth / (PLANS.free.limits.aiPlansPerMonth ?? 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {planId === 'studio' ? 'Studio' : 'Pro'} — alunos ilimitados e planos IA ilimitados.
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Empty onboarding state */}
      {isDataEmpty && (
        <div className="mb-8 overflow-hidden rounded-2xl border border-[#b0d2ff]/40 bg-[#eef5ff] p-6">
          <h2 className="text-base font-semibold text-gray-900">Bem-vindo ao Musly!</h2>
          <p className="mt-1 text-sm text-gray-500">
            Comece cadastrando seus alunos e agendando as primeiras aulas.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/students">
              <Button variant="primary" size="sm">
                <Users className="h-3.5 w-3.5" /> Cadastrar aluno
              </Button>
            </Link>
            <Link href="/lessons">
              <Button variant="outline" size="sm">
                <Calendar className="h-3.5 w-3.5" /> Agendar aula
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Agenda de hoje */}
      {students.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Agenda de hoje</h2>
            <Link
              href="/agenda"
              className="flex items-center gap-1 text-sm font-medium text-[#1a7cfa] transition-colors hover:text-[#1468d6]"
            >
              Ver agenda completa <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {todayLessons.length === 0 ? (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-6">
              <CalendarDays className="h-5 w-5 flex-shrink-0 text-gray-300" />
              <div>
                <p className="text-sm font-medium text-gray-500">Nenhuma aula agendada para hoje</p>
                <Link href="/agenda" className="mt-0.5 text-xs font-medium text-[#1a7cfa] hover:text-[#1468d6]">
                  Agendar uma aula →
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {todayLessons.map((lesson) => {
                const student = students.find((s) => s.id === lesson.studentId)
                if (!student) return null
                const style = statusStyle[lesson.status]
                return (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-3.5 shadow-card"
                  >
                    {/* Color bar */}
                    <div
                      className="h-9 w-1 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: student.color || '#1a7cfa' }}
                    />
                    {/* Time */}
                    <div className="flex-shrink-0 text-center">
                      <p className="text-sm font-bold text-gray-900">{formatTime(lesson.time)}</p>
                      <p className="text-[10px] text-gray-400">{formatDuration(lesson.duration)}</p>
                    </div>
                    {/* Divider */}
                    <div className="h-8 w-px flex-shrink-0 bg-gray-100" />
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{student.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Music className="h-3 w-3" /> {lesson.instrument}
                        </span>
                        {lesson.topic && (
                          <span className="flex items-center gap-1 text-xs text-gray-400 italic">
                            <BookOpen className="h-3 w-3" /> {lesson.topic}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Status + actions */}
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold', style.pill)}>
                        {style.dot && lesson.status === 'agendada' ? 'Agendada' :
                         lesson.status === 'concluída' ? 'Concluída' :
                         lesson.status === 'cancelada' ? 'Cancelada' : 'Falta'}
                      </span>
                      {lesson.status === 'agendada' && (
                        <Link href={`/lesson-mode/${lesson.id}`}>
                          <button className="flex items-center gap-1.5 rounded-lg bg-[#1a7cfa] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#1468d6]">
                            <PlayCircle className="h-3.5 w-3.5" />
                            Iniciar
                          </button>
                        </Link>
                      )}
                      {student.meetLink && (
                        <a
                          href={student.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100"
                        >
                          <Video className="h-3.5 w-3.5" />
                          Entrar
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent students */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-gray-900">Alunos recentes</h2>
            <Link
              href="/students"
              className="flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-[#1468d6]"
            >
              Ver todos <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentStudents.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-gray-400">Nenhum aluno cadastrado ainda.</p>
              <Link href="/students" className="mt-3 inline-block">
                <Button variant="outline" size="sm">
                  <Plus className="h-3.5 w-3.5" /> Cadastrar aluno
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentStudents.map((student, i) => (
                <div
                  key={student.id}
                  className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-gray-50"
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white',
                      avatarGradients[i % avatarGradients.length]
                    )}
                  >
                    {getInitials(student.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{student.name}</p>
                    <p className="text-xs text-gray-400">{student.level}</p>
                  </div>
                  <span className="hidden rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 sm:inline">
                    {student.instrument}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Today's lessons */}
        <Card>
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-gray-900">Aulas de hoje</h2>
            {todayLessons.length > 0 && (
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                {todayLessons.length}
              </span>
            )}
          </div>

          {todayLessons.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-gray-400">Nenhuma aula hoje.</p>
              <Link href="/lessons" className="mt-3 inline-block">
                <Button variant="outline" size="sm">
                  <Plus className="h-3.5 w-3.5" /> Agendar aula
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-50">
                {todayLessons.map((lesson) => {
                  const studentMap = Object.fromEntries(students.map((s) => [s.id, s]))
                  const student = studentMap[lesson.studentId]
                  const style = statusStyle[lesson.status]
                  return (
                    <div key={lesson.id} className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={cn('h-2 w-2 flex-shrink-0 rounded-full', style.dot)} />
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {student?.name ?? 'Aluno desconhecido'}
                          </p>
                          <p className="text-xs text-gray-400">{lesson.instrument}</p>
                        </div>
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', style.pill)}>
                          {lesson.status}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-3 pl-5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {formatTime(lesson.time)}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span>{formatDuration(lesson.duration)}</span>
                        {lesson.topic && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="flex items-center gap-1 italic">
                              <BookOpen className="h-3 w-3" />
                              <span className="truncate max-w-[80px]">{lesson.topic}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="border-t border-gray-100 px-6 py-3">
                <Link
                  href="/lessons"
                  className="flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
                >
                  Ver todas as aulas <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
