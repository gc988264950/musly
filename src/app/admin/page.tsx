'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Users, UserCheck, GraduationCap, DollarSign, Zap,
  Search, ChevronRight, X, RefreshCw, Plus, Ban, CheckCircle2,
  AlertTriangle, BarChart2, Crown, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OverviewData {
  teachers:  { total: number; active7d: number; byPlan: Record<string,number> }
  students:  { total: number; avgPerTeacher: number }
  revenue:   { total: number; thisMonth: number; monthlyChart: { month: string; amount: number }[] }
  ai:        { total: number; thisMonth: number; creditsChart: { month: string; used: number }[] }
}

interface TeacherRow {
  id:           string
  email:        string
  firstName:    string
  lastName:     string
  plan:         string
  planStatus:   string
  creditsUsed:  number
  extraCredits: number
  totalCredits: number
  studentsCount: number
  lessonsCount:  number
  createdAt:    string
  lastSignIn:   string | null
  banned:       boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR').format(n)
}
function fmtBRL(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}
function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: '2-digit' })
}
function timeAgo(iso: string | null) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'Agora'
  if (h < 24) return `${h}h atrás`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d atrás`
  return fmtDate(iso)
}
function initials(t: TeacherRow) {
  return ((t.firstName?.[0] ?? '') + (t.lastName?.[0] ?? '')).toUpperCase() || t.email[0].toUpperCase()
}
function fullName(t: TeacherRow) {
  const n = [t.firstName, t.lastName].filter(Boolean).join(' ')
  return n || t.email
}
function fmtMonth(ym: string) {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('pt-BR', { month: 'short' })
}

const PLAN_LABELS: Record<string, { label: string; cls: string }> = {
  free:   { label: 'Grátis', cls: 'bg-gray-100 text-gray-600' },
  pro:    { label: 'Pro',    cls: 'bg-blue-100 text-blue-700' },
  studio: { label: 'Studio', cls: 'bg-indigo-100 text-indigo-700' },
}
const PLAN_ORDER = ['free', 'pro', 'studio']

// ─── Mini bar chart ───────────────────────────────────────────────────────────

function MiniBarChart({
  data, valueKey, color = '#1a7cfa',
}: { data: {month:string; [k:string]:number|string}[]; valueKey: string; color?: string }) {
  const values = data.map((d) => Number(d[valueKey]))
  const max = Math.max(...values, 1)
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d) => {
        const h = Math.max(2, (Number(d[valueKey]) / max) * 64)
        return (
          <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-sm transition-all"
              style={{ height: h, backgroundColor: color, opacity: 0.85 }}
              title={`${fmtMonth(d.month as string)}: ${Number(d[valueKey])}`}
            />
            <span className="text-[9px] text-gray-400">{fmtMonth(d.month as string)}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, iconCls = 'bg-blue-50 text-brand-500',
}: { label: string; value: string; sub?: string; icon: React.ElementType; iconCls?: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-xl', iconCls)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-black text-[#0f172a]">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

// ─── Teacher detail panel ─────────────────────────────────────────────────────

function TeacherPanel({
  teacher,
  onClose,
  onAction,
}: {
  teacher: TeacherRow
  onClose: () => void
  onAction: () => void
}) {
  const [credAmount, setCredAmount] = useState(50)
  const [loading, setLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  async function doPost(path: string, body: object) {
    setLoading(path)
    setMsg('')
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setMsg(json.error ?? 'Erro desconhecido.'); return }
      setMsg('Salvo!')
      onAction()
      setTimeout(() => setMsg(''), 3000)
    } finally {
      setLoading(null)
    }
  }

  const name = fullName(teacher)

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
              {initials(teacher)}
            </div>
            <div>
              <p className="font-bold text-[#0f172a]">{name}</p>
              <p className="text-xs text-gray-400">{teacher.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-6 p-6">
          {/* Status */}
          <div className="flex flex-wrap gap-2">
            <span className={cn('rounded-full px-3 py-1 text-xs font-bold', PLAN_LABELS[teacher.plan]?.cls ?? 'bg-gray-100 text-gray-600')}>
              {PLAN_LABELS[teacher.plan]?.label ?? teacher.plan}
            </span>
            {teacher.banned && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">Bloqueado</span>
            )}
            <span className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-500">
              Último login: {timeAgo(teacher.lastSignIn)}
            </span>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Alunos',    value: fmt(teacher.studentsCount) },
              { label: 'Aulas',     value: fmt(teacher.lessonsCount)  },
              { label: 'Créditos',  value: `${teacher.creditsUsed}/${teacher.totalCredits}` },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-gray-100 bg-[#f8fafc] p-3 text-center">
                <p className="text-lg font-black text-[#0f172a]">{s.value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="text-xs text-gray-400">
            Cadastrado em {fmtDate(teacher.createdAt)}
          </div>

          {/* ── Change plan ── */}
          <div className="rounded-xl border border-gray-100 p-4 space-y-3">
            <p className="text-sm font-semibold text-[#0f172a]">Alterar plano</p>
            <div className="flex gap-2 flex-wrap">
              {PLAN_ORDER.map((p) => (
                <button
                  key={p}
                  disabled={loading === 'plan' || teacher.plan === p}
                  onClick={() => doPost('/api/admin/system/change-plan', { userId: teacher.id, planId: p })}
                  className={cn(
                    'rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50',
                    teacher.plan === p
                      ? 'bg-[#1a7cfa] text-white shadow-sm'
                      : 'border border-gray-200 text-gray-600 hover:border-[#1a7cfa] hover:text-[#1a7cfa]'
                  )}
                >
                  {PLAN_LABELS[p]?.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Add credits ── */}
          <div className="rounded-xl border border-gray-100 p-4 space-y-3">
            <p className="text-sm font-semibold text-[#0f172a]">Adicionar créditos de IA</p>
            <div className="flex gap-2">
              {[10, 50, 100, 200].map((n) => (
                <button
                  key={n}
                  onClick={() => setCredAmount(n)}
                  className={cn(
                    'flex-1 rounded-xl border py-1.5 text-xs font-semibold transition-all',
                    credAmount === n ? 'border-[#1a7cfa] bg-blue-50 text-[#1a7cfa]' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                  )}
                >
                  +{n}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                max={1000}
                value={credAmount}
                onChange={(e) => setCredAmount(Math.max(1, Number(e.target.value)))}
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                disabled={loading === 'credits'}
                onClick={() => doPost('/api/admin/system/add-credits', { userId: teacher.id, amount: credAmount })}
                className="flex items-center gap-1.5 rounded-xl bg-[#1a7cfa] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1468d6] disabled:opacity-50"
              >
                {loading === 'credits' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Adicionar
              </button>
            </div>
          </div>

          {/* ── Block/unblock ── */}
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 space-y-3">
            <p className="text-sm font-semibold text-red-700">Zona de risco</p>
            <button
              disabled={loading === 'block'}
              onClick={() => doPost('/api/admin/system/block-user', { userId: teacher.id, block: !teacher.banned })}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-50',
                teacher.banned
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              )}
            >
              {loading === 'block'
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : teacher.banned ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />
              }
              {teacher.banned ? 'Desbloquear usuário' : 'Bloquear usuário'}
            </button>
          </div>

          {/* Feedback */}
          {msg && (
            <p className={cn('text-sm font-medium', msg === 'Salvo!' ? 'text-green-600' : 'text-red-600')}>
              {msg}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'teachers' | 'ai' | 'revenue'

export default function AdminPage() {
  const [tab, setTab]               = useState<Tab>('overview')
  const [overview, setOverview]     = useState<OverviewData | null>(null)
  const [teachers, setTeachers]     = useState<TeacherRow[]>([])
  const [selected, setSelected]     = useState<TeacherRow | null>(null)
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const reload = useCallback(() => setRefreshKey((k) => k + 1), [])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/system/overview').then((r) => r.json()),
      fetch('/api/admin/system/teachers').then((r) => r.json()),
    ]).then(([ov, tc]) => {
      setOverview(ov)
      setTeachers(Array.isArray(tc) ? tc : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [refreshKey])

  // Update selected teacher after reload
  useEffect(() => {
    if (selected) {
      const updated = teachers.find((t) => t.id === selected.id)
      if (updated) setSelected(updated)
    }
  }, [teachers]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredTeachers = teachers.filter((t) => {
    const q = search.toLowerCase()
    return (
      fullName(t).toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      t.plan.toLowerCase().includes(q)
    )
  })

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview',  label: 'Visão Geral',   icon: BarChart2   },
    { id: 'teachers',  label: 'Professores',    icon: Users       },
    { id: 'ai',        label: 'IA & Créditos',  icon: Zap         },
    { id: 'revenue',   label: 'Receita',        icon: DollarSign  },
  ]

  // ── Header ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0f172a]">Dashboard Admin</h1>
          <p className="mt-0.5 text-sm text-gray-400">
            Monitoramento em tempo real · dados ao vivo do Supabase
          </p>
        </div>
        <button
          onClick={reload}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Atualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-gray-100 bg-white p-1 shadow-card w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
              tab === id
                ? 'bg-[#0f172a] text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {loading && !overview ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      ) : (
        <>
          {/* ── TAB: Overview ─────────────────────────────────────────────────── */}
          {tab === 'overview' && overview && (
            <div className="space-y-6">
              {/* Stat cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard
                  label="Total Professores"
                  value={fmt(overview.teachers.total)}
                  sub={`${overview.teachers.active7d} ativos (7 dias)`}
                  icon={Users}
                  iconCls="bg-blue-50 text-brand-500"
                />
                <StatCard
                  label="Professores Ativos"
                  value={fmt(overview.teachers.active7d)}
                  sub="últimos 7 dias"
                  icon={UserCheck}
                  iconCls="bg-emerald-50 text-emerald-600"
                />
                <StatCard
                  label="Total Alunos"
                  value={fmt(overview.students.total)}
                  sub={`${overview.students.avgPerTeacher} média/professor`}
                  icon={GraduationCap}
                  iconCls="bg-violet-50 text-violet-600"
                />
                <StatCard
                  label="Receita Total"
                  value={fmtBRL(overview.revenue.total)}
                  sub={`${fmtBRL(overview.revenue.thisMonth)} este mês`}
                  icon={DollarSign}
                  iconCls="bg-amber-50 text-amber-600"
                />
                <StatCard
                  label="Créditos IA Usados"
                  value={fmt(overview.ai.total)}
                  sub={`${fmt(overview.ai.thisMonth)} este mês`}
                  icon={Zap}
                  iconCls="bg-indigo-50 text-indigo-600"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {/* Plan distribution */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
                  <h3 className="mb-4 text-sm font-bold text-[#0f172a]">Distribuição de Planos</h3>
                  <div className="space-y-3">
                    {PLAN_ORDER.map((p) => {
                      const count = overview.teachers.byPlan[p] ?? 0
                      const pct = overview.teachers.total
                        ? Math.round((count / overview.teachers.total) * 100)
                        : 0
                      const config = PLAN_LABELS[p]
                      return (
                        <div key={p}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className={cn('font-semibold rounded-full px-2 py-0.5', config.cls)}>
                              {config.label}
                            </span>
                            <span className="text-gray-500">{count} ({pct}%)</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-[#1a7cfa] transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Revenue chart */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
                  <h3 className="mb-1 text-sm font-bold text-[#0f172a]">Receita — 6 meses</h3>
                  <p className="mb-4 text-xs text-gray-400">(pagamentos registrados)</p>
                  <MiniBarChart
                    data={overview.revenue.monthlyChart}
                    valueKey="amount"
                    color="#10b981"
                  />
                </div>

                {/* Credits chart */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
                  <h3 className="mb-1 text-sm font-bold text-[#0f172a]">Créditos IA — 6 meses</h3>
                  <p className="mb-4 text-xs text-gray-400">(créditos consumidos)</p>
                  <MiniBarChart
                    data={overview.ai.creditsChart}
                    valueKey="used"
                    color="#6366f1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Teachers ─────────────────────────────────────────────────── */}
          {tab === 'teachers' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    placeholder="Buscar por nome, e-mail ou plano…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <p className="text-sm text-gray-400">{filteredTeachers.length} resultado{filteredTeachers.length !== 1 ? 's' : ''}</p>
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        {['Professor', 'Plano', 'Alunos', 'Créditos', 'Cadastro', 'Último login', ''].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-400">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredTeachers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-sm text-gray-400">
                            Nenhum professor encontrado
                          </td>
                        </tr>
                      ) : filteredTeachers.map((t) => {
                        const planCfg = PLAN_LABELS[t.plan] ?? PLAN_LABELS.free
                        return (
                          <tr
                            key={t.id}
                            onClick={() => setSelected(t)}
                            className={cn(
                              'cursor-pointer transition-colors hover:bg-blue-50/50',
                              selected?.id === t.id && 'bg-blue-50/70',
                              t.banned && 'opacity-50'
                            )}
                          >
                            {/* Name */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0f172a] text-xs font-bold text-white">
                                  {initials(t)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-[#0f172a] truncate max-w-[160px]">
                                    {fullName(t)}
                                    {t.banned && <span className="ml-1 text-red-500">⛔</span>}
                                  </p>
                                  <p className="text-xs text-gray-400 truncate max-w-[160px]">{t.email}</p>
                                </div>
                              </div>
                            </td>

                            {/* Plan */}
                            <td className="px-4 py-3">
                              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold', planCfg.cls)}>
                                {planCfg.label}
                              </span>
                            </td>

                            {/* Students */}
                            <td className="px-4 py-3 text-gray-700 font-medium">{t.studentsCount}</td>

                            {/* Credits */}
                            <td className="px-4 py-3">
                              <div>
                                <div className="text-xs font-medium text-gray-700">
                                  {t.creditsUsed}/{t.totalCredits}
                                </div>
                                <div className="mt-0.5 h-1 w-20 rounded-full bg-gray-100">
                                  <div
                                    className="h-full rounded-full bg-[#1a7cfa]"
                                    style={{ width: `${Math.min(100, (t.creditsUsed / Math.max(t.totalCredits, 1)) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Created */}
                            <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(t.createdAt)}</td>

                            {/* Last login */}
                            <td className="px-4 py-3 text-xs text-gray-500">{timeAgo(t.lastSignIn)}</td>

                            {/* Arrow */}
                            <td className="px-4 py-3 text-gray-300">
                              <ChevronRight className="h-4 w-4" />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: AI & Créditos ─────────────────────────────────────────────── */}
          {tab === 'ai' && overview && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="Total créditos usados"
                  value={fmt(overview.ai.total)}
                  icon={Zap}
                  iconCls="bg-indigo-50 text-indigo-600"
                />
                <StatCard
                  label="Créditos este mês"
                  value={fmt(overview.ai.thisMonth)}
                  icon={Zap}
                  iconCls="bg-blue-50 text-brand-500"
                />
                <StatCard
                  label="Professores com IA"
                  value={fmt(teachers.filter((t) => t.creditsUsed > 0).length)}
                  sub={`de ${fmt(teachers.length)} total`}
                  icon={Users}
                  iconCls="bg-violet-50 text-violet-600"
                />
              </div>

              {/* Top users by credit usage */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
                <h3 className="mb-4 text-sm font-bold text-[#0f172a]">Top usuários por créditos usados (mês atual)</h3>
                <div className="divide-y divide-gray-50">
                  {[...teachers]
                    .sort((a, b) => b.creditsUsed - a.creditsUsed)
                    .slice(0, 10)
                    .map((t, i) => (
                      <div key={t.id} className="flex items-center gap-3 py-2.5">
                        <span className="w-5 text-center text-xs font-bold text-gray-400">{i + 1}</span>
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0f172a] text-[10px] font-bold text-white">
                          {initials(t)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#0f172a] truncate">{fullName(t)}</p>
                          <p className="text-xs text-gray-400">{t.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-indigo-600">{t.creditsUsed}</p>
                          <p className="text-[10px] text-gray-400">créditos</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
                <h3 className="mb-1 text-sm font-bold text-[#0f172a]">Uso de créditos — 6 meses</h3>
                <p className="mb-4 text-xs text-gray-400">Total de créditos consumidos por todos os usuários</p>
                <MiniBarChart data={overview.ai.creditsChart} valueKey="used" color="#6366f1" />
              </div>
            </div>
          )}

          {/* ── TAB: Revenue ──────────────────────────────────────────────────── */}
          {tab === 'revenue' && overview && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="Receita total"
                  value={fmtBRL(overview.revenue.total)}
                  icon={DollarSign}
                  iconCls="bg-emerald-50 text-emerald-600"
                />
                <StatCard
                  label="Receita este mês"
                  value={fmtBRL(overview.revenue.thisMonth)}
                  icon={DollarSign}
                  iconCls="bg-amber-50 text-amber-600"
                />
                <StatCard
                  label="Planos pagos"
                  value={fmt((overview.teachers.byPlan.pro ?? 0) + (overview.teachers.byPlan.studio ?? 0))}
                  sub="Pro + Studio"
                  icon={Crown}
                  iconCls="bg-violet-50 text-violet-600"
                />
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
                <h3 className="mb-1 text-sm font-bold text-[#0f172a]">Receita mensal — 6 meses</h3>
                <p className="mb-4 text-xs text-gray-400">
                  Baseado nos pagamentos registrados (student financial — mensalidades pagas)
                </p>
                <MiniBarChart data={overview.revenue.monthlyChart} valueKey="amount" color="#10b981" />
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
                <h3 className="mb-4 text-sm font-bold text-[#0f172a]">Top professores por alunos</h3>
                <div className="divide-y divide-gray-50">
                  {[...teachers]
                    .sort((a, b) => b.studentsCount - a.studentsCount)
                    .slice(0, 8)
                    .map((t, i) => (
                      <div key={t.id} className="flex items-center gap-3 py-2.5">
                        <span className="w-5 text-center text-xs font-bold text-gray-400">{i + 1}</span>
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0f172a] text-[10px] font-bold text-white">
                          {initials(t)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#0f172a] truncate">{fullName(t)}</p>
                          <span className={cn('text-[10px] rounded-full px-1.5 py-0.5 font-semibold', PLAN_LABELS[t.plan]?.cls)}>
                            {PLAN_LABELS[t.plan]?.label}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#0f172a]">{t.studentsCount}</p>
                          <p className="text-[10px] text-gray-400">alunos</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Teacher detail panel */}
      {selected && (
        <TeacherPanel
          teacher={selected}
          onClose={() => setSelected(null)}
          onAction={reload}
        />
      )}
    </div>
  )
}
