'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Music, Phone, Mail, Edit2, Check, X, Plus, Trash2,
  BookOpen, Clock, ChevronDown, Tag, StickyNote, TrendingUp, List,
  Sparkles, ChevronRight as ChevronRightIcon, Save, RefreshCw,
  CreditCard, DollarSign, Calendar, FileDown, Lightbulb, PlayCircle, FolderOpen,
} from 'lucide-react'
import { FilesTab } from '@/components/ui/FilesTab'
import { useStudentProfile } from '@/hooks/useStudentProfile'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { useNotifications } from '@/hooks/useNotifications'
import { getUserSettings } from '@/lib/db/userSettings'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { UpgradePrompt } from '@/components/ui/UpgradePrompt'
import { INSTRUMENTS, LEVELS, LESSON_STATUSES, REPERTOIRE_TYPES, REPERTOIRE_STATUSES, LESSON_FOCUSES } from '@/lib/db/types'
import type {
  StudentLevel,
  LessonStatus,
  LessonFocus,
  LessonPlan,
  LessonPlanSection,
  RepertoireItemType,
  RepertoireItemStatus,
  StudentNote,
  RepertoireItem,
} from '@/lib/db/types'
import { generateLessonPlan } from '@/lib/ai/lessonPlanner'
import { exportLessonPlanPDF } from '@/lib/pdf/exportLessonPlan'
import { computeStatusForMonth, getDueDateForMonth, computePaymentStatus } from '@/lib/db/payments'
import { currentYearMonth, formatCurrency, formatMonth } from '@/hooks/useFinancial'
import { cn, getInitials } from '@/lib/utils'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatTime(time: string) {
  const [h, m] = time.split(':')
  return `${h}h${m !== '00' ? m : ''}`
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}min`
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const lessonStatusStyle: Record<LessonStatus, { pill: string; dot: string }> = {
  agendada: { pill: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  concluída: { pill: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  cancelada: { pill: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
  falta: { pill: 'bg-red-100 text-red-600', dot: 'bg-red-500' },
}

const repertoireStatusStyle: Record<RepertoireItemStatus, string> = {
  'em andamento': 'bg-blue-100 text-blue-700',
  concluído: 'bg-green-100 text-green-700',
  pausado: 'bg-gray-100 text-gray-500',
}

const levelStyle: Record<StudentLevel, string> = {
  Iniciante: 'bg-blue-100 text-blue-700',
  Intermediário: 'bg-purple-100 text-purple-700',
  Avançado: 'bg-indigo-100 text-indigo-700',
}

// ─── Tab definition ───────────────────────────────────────────────────────────

type TabId = 'overview' | 'history' | 'progress' | 'repertoire' | 'notes' | 'ai-planner' | 'financeiro' | 'materiais'

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Visão Geral', icon: Music },
  { id: 'history', label: 'Histórico', icon: BookOpen },
  { id: 'progress', label: 'Progresso', icon: TrendingUp },
  { id: 'repertoire', label: 'Repertório', icon: List },
  { id: 'notes', label: 'Anotações', icon: StickyNote },
  { id: 'ai-planner', label: 'Plano IA', icon: Sparkles },
  { id: 'financeiro', label: 'Financeiro', icon: CreditCard },
  { id: 'materiais', label: 'Materiais', icon: FolderOpen },
]

// ─── TagInput ─────────────────────────────────────────────────────────────────

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

function TagInput({ tags, onChange, placeholder = 'Adicionar…' }: TagInputProps) {
  const [value, setValue] = useState('')

  function add() {
    const trimmed = value.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
    setValue('')
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
          >
            <Tag className="h-2.5 w-2.5" />
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="ml-0.5 rounded-full hover:bg-blue-100 p-0.5"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── EditableTextarea ─────────────────────────────────────────────────────────

interface EditableTextareaProps {
  value: string
  onSave: (value: string) => void
  placeholder?: string
  rows?: number
}

function EditableTextarea({ value, onSave, placeholder, rows = 3 }: EditableTextareaProps) {
  const [draft, setDraft] = useState(value)
  const [saved, setSaved] = useState(false)
  const dirty = draft !== value

  useEffect(() => { setDraft(value) }, [value])

  function handleSave() {
    onSave(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="relative">
      <textarea
        rows={rows}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="block w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      />
      {(dirty || saved) && (
        <div className="mt-2 flex items-center gap-2">
          {saved ? (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <Check className="h-3 w-3" /> Salvo!
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                <Check className="h-3 w-3" /> Salvar
              </button>
              <button
                type="button"
                onClick={() => setDraft(value)}
                className="rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Visão Geral ─────────────────────────────────────────────────────────

function TabOverview({ profile }: { profile: ReturnType<typeof useStudentProfile> }) {
  const { student, updateStudent, financial, payments, addPayment } = profile
  if (!student) return null

  // ── Financial status helpers ──────────────────────────────────────────────
  const thisMonth = currentYearMonth()
  const currentPayment = payments.find((p) => p.referenceMonth === thisMonth) ?? null
  const currentStatus = financial
    ? computeStatusForMonth(financial, currentPayment, thisMonth)
    : null
  const currentDueDate = financial
    ? getDueDateForMonth(financial.dueDayOfMonth, thisMonth)
    : null

  const [markingPaid, setMarkingPaid] = useState(false)
  function handleQuickPaid() {
    if (!financial) return
    setMarkingPaid(true)
    try {
      addPayment({
        referenceMonth: thisMonth,
        dueDate: getDueDateForMonth(financial.dueDayOfMonth, thisMonth),
        paidAt: new Date().toISOString().split('T')[0],
        amount: financial.monthlyFee,
        notes: '',
      })
    } finally {
      setMarkingPaid(false)
    }
  }

  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState({
    name: student.name,
    instrument: student.instrument,
    level: student.level as StudentLevel,
    email: student.email,
    phone: student.phone,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  function handleSave() {
    const e: Record<string, string> = {}
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Nome deve ter pelo menos 2 caracteres'
    if (!form.instrument) e.instrument = 'Selecione um instrumento'
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'E-mail inválido'
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setSaving(true)
    try {
      updateStudent({ ...form, name: form.name.trim(), email: form.email.trim() })
      setEditOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Basic info card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Informações básicas</h3>
          <button
            onClick={() => {
              setForm({ name: student.name, instrument: student.instrument, level: student.level as StudentLevel, email: student.email, phone: student.phone })
              setErrors({})
              setEditOpen(true)
            }}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            <Edit2 className="h-3 w-3" /> Editar
          </button>
        </div>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-gray-400">Instrumento</dt>
            <dd className="mt-0.5 text-sm font-medium text-gray-900">{student.instrument}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">Nível</dt>
            <dd className="mt-0.5">
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', levelStyle[student.level as StudentLevel])}>
                {student.level}
              </span>
            </dd>
          </div>
          {student.email && (
            <div>
              <dt className="text-xs text-gray-400">E-mail</dt>
              <dd className="mt-0.5 flex items-center gap-1 text-sm text-gray-700">
                <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                <span className="truncate">{student.email}</span>
              </dd>
            </div>
          )}
          {student.phone && (
            <div>
              <dt className="text-xs text-gray-400">Telefone</dt>
              <dd className="mt-0.5 flex items-center gap-1 text-sm text-gray-700">
                <Phone className="h-3 w-3 text-gray-400" /> {student.phone}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Financial status mini-card */}
      {financial && (
        <div className={cn(
          'rounded-2xl border p-5',
          currentStatus === 'atrasado' ? 'border-red-200 bg-red-50' :
          currentStatus === 'pago' ? 'border-green-100 bg-green-50' :
          'border-yellow-200 bg-yellow-50'
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">Status financeiro</h3>
            </div>
            {currentStatus && (
              <span className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                currentStatus === 'pago' ? 'bg-green-100 text-green-700' :
                currentStatus === 'atrasado' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              )}>
                {currentStatus === 'pago' ? 'Em dia' : currentStatus === 'atrasado' ? 'Atrasado' : 'Pendente'}
              </span>
            )}
          </div>
          <div className="mt-3 flex items-center gap-5">
            <div>
              <p className="text-xs text-gray-400">Mensalidade</p>
              <p className="mt-0.5 text-base font-bold text-gray-900">{formatCurrency(financial.monthlyFee)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Vencimento</p>
              <p className="mt-0.5 text-sm font-semibold text-gray-700">Dia {financial.dueDayOfMonth}</p>
            </div>
            {currentDueDate && currentStatus !== 'pago' && (() => {
              const today = new Date(); today.setHours(0, 0, 0, 0)
              const due = new Date(currentDueDate + 'T00:00:00')
              const diff = Math.round((due.getTime() - today.getTime()) / 86400000)
              return (
                <div>
                  <p className="text-xs text-gray-400">Situação</p>
                  <p className={cn('mt-0.5 text-sm font-semibold', diff < 0 ? 'text-red-600' : diff <= 3 ? 'text-yellow-700' : 'text-gray-700')}>
                    {diff === 0 ? 'Vence hoje' : diff < 0 ? `${Math.abs(diff)}d atrasado` : diff <= 3 ? `Vence em ${diff}d` : `Faltam ${diff} dias`}
                  </p>
                </div>
              )
            })()}
          </div>
          {currentStatus !== 'pago' && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={handleQuickPaid}
                disabled={markingPaid}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" /> Marcar como pago
              </button>
              {financial.paymentLink && (
                <a
                  href={financial.paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <CreditCard className="h-3.5 w-3.5" /> Pagar agora
                </a>
              )}
              {financial.contactLink && (
                <a
                  href={financial.contactLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Phone className="h-3.5 w-3.5" /> Entrar em contato
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Objectives */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Objetivos do aluno</h3>
        <EditableTextarea
          value={student.objectives}
          onSave={(v) => updateStudent({ objectives: v })}
          placeholder="Descreva os objetivos musicais do aluno…"
        />
      </div>

      {/* Next steps */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Próximos passos</h3>
        <EditableTextarea
          value={student.nextSteps}
          onSave={(v) => updateStudent({ nextSteps: v })}
          placeholder="O que planejar para as próximas aulas…"
        />
      </div>

      {/* Notes/Observations */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Observações gerais</h3>
        <EditableTextarea
          value={student.notes}
          onSave={(v) => updateStudent({ notes: v })}
          placeholder="Observações sobre o aluno…"
          rows={4}
        />
      </div>

      {/* Edit modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Editar informações" size="md">
        <div className="space-y-4">
          <Input
            label="Nome completo *"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            error={errors.name}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Instrumento *</label>
              <select
                value={form.instrument}
                onChange={(e) => setForm((p) => ({ ...p, instrument: e.target.value }))}
                className={cn(
                  'block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2',
                  errors.instrument ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                )}
              >
                <option value="">Selecione…</option>
                {INSTRUMENTS.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
              {errors.instrument && <p className="mt-1 text-xs text-red-600">{errors.instrument}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Nível *</label>
              <select
                value={form.level}
                onChange={(e) => setForm((p) => ({ ...p, level: e.target.value as StudentLevel }))}
                className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="E-mail"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              error={errors.email}
            />
            <Input
              label="Telefone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>Salvar alterações</Button>
        </div>
      </Modal>
    </div>
  )
}

// ─── Tab: Histórico de Aulas ──────────────────────────────────────────────────

function TabHistory({ profile }: { profile: ReturnType<typeof useStudentProfile> }) {
  const { lessons, updateLesson } = profile
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesDraft, setNotesDraft] = useState('')

  if (lessons.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white py-12 text-center">
        <BookOpen className="mx-auto h-8 w-8 text-gray-300" />
        <p className="mt-2 text-sm text-gray-400">Nenhuma aula registrada ainda.</p>
      </div>
    )
  }

  // Group by date
  const groups: Record<string, typeof lessons> = {}
  for (const lesson of lessons) {
    if (!groups[lesson.date]) groups[lesson.date] = []
    groups[lesson.date].push(lesson)
  }

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([date, dayLessons]) => (
        <div key={date} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
          <div className="border-b border-gray-50 bg-gray-50 px-5 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{formatDate(date)}</p>
          </div>
          <div className="divide-y divide-gray-50">
            {dayLessons.map((lesson) => {
              const style = lessonStatusStyle[lesson.status]
              return (
                <div key={lesson.id} className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('h-2 w-2 flex-shrink-0 rounded-full', style.dot)} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900">{lesson.instrument}</span>
                        {lesson.topic && (
                          <span className="text-xs text-gray-400 italic">— {lesson.topic}</span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {formatTime(lesson.time)}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span>{formatDuration(lesson.duration)}</span>
                      </div>
                    </div>
                    {/* Status dropdown */}
                    <div className="relative">
                      <select
                        value={lesson.status}
                        onChange={(e) => updateLesson(lesson.id, { status: e.target.value as LessonStatus })}
                        className={cn(
                          'appearance-none rounded-full pl-2.5 pr-6 py-0.5 text-[11px] font-semibold cursor-pointer focus:outline-none',
                          style.pill
                        )}
                      >
                        {LESSON_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 opacity-60" />
                    </div>
                  </div>

                  {/* Inline notes */}
                  {editingNotes === lesson.id ? (
                    <div className="mt-3 pl-5">
                      <textarea
                        rows={3}
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        className="block w-full resize-none rounded-xl border border-blue-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        autoFocus
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => { updateLesson(lesson.id, { notes: notesDraft }); setEditingNotes(null) }}
                          className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                        >
                          <Check className="h-3 w-3" /> Salvar
                        </button>
                        <button
                          onClick={() => setEditingNotes(null)}
                          className="rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 pl-5">
                      {lesson.notes ? (
                        <p className="text-xs text-gray-500 leading-relaxed">{lesson.notes}</p>
                      ) : null}
                      <button
                        onClick={() => { setNotesDraft(lesson.notes); setEditingNotes(lesson.id) }}
                        className="mt-1 text-xs text-blue-500 hover:text-blue-700"
                      >
                        {lesson.notes ? 'Editar anotações' : '+ Adicionar anotações'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Tab: Progresso ───────────────────────────────────────────────────────────

function TabProgress({ profile }: { profile: ReturnType<typeof useStudentProfile> }) {
  const { student, progress, saveProgress } = profile
  if (!student) return null

  const [form, setForm] = useState({
    level: student.level as StudentLevel,
    evolution: progress?.evolution ?? '',
    lessonFrequency: progress?.lessonFrequency ?? '',
    identifiedDifficulties: progress?.identifiedDifficulties ?? [],
    developedSkills: progress?.developedSkills ?? [],
  })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  function handleSave() {
    setSaving(true)
    try {
      profile.updateStudent({ level: form.level })
      saveProgress({
        evolution: form.evolution,
        lessonFrequency: form.lessonFrequency,
        identifiedDifficulties: form.identifiedDifficulties,
        developedSkills: form.developedSkills,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Nível atual</label>
          <select
            value={form.level}
            onChange={(e) => setForm((p) => ({ ...p, level: e.target.value as StudentLevel }))}
            className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Frequência de aulas</label>
          <input
            type="text"
            value={form.lessonFrequency}
            onChange={(e) => setForm((p) => ({ ...p, lessonFrequency: e.target.value }))}
            placeholder="Ex: 1x por semana"
            className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Evolução do aluno</label>
        <textarea
          rows={4}
          value={form.evolution}
          onChange={(e) => setForm((p) => ({ ...p, evolution: e.target.value }))}
          placeholder="Descreva a evolução musical do aluno ao longo do tempo…"
          className="block w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Dificuldades identificadas</label>
        <TagInput
          tags={form.identifiedDifficulties}
          onChange={(tags) => setForm((p) => ({ ...p, identifiedDifficulties: tags }))}
          placeholder="Ex: Leitura de partitura…"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Habilidades desenvolvidas</label>
        <TagInput
          tags={form.developedSkills}
          onChange={(tags) => setForm((p) => ({ ...p, developedSkills: tags }))}
          placeholder="Ex: Ritmo, Improvisação…"
        />
      </div>

      <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
        <Button variant="primary" loading={saving} onClick={handleSave}>
          <Check className="h-4 w-4" /> Salvar progresso
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <Check className="h-3.5 w-3.5" /> Salvo com sucesso!
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Repertório ──────────────────────────────────────────────────────────

function TabRepertoire({ profile }: { profile: ReturnType<typeof useStudentProfile> }) {
  const { repertoire, addRepertoireItem, updateRepertoireItem, deleteRepertoireItem } = profile

  const [form, setForm] = useState({ title: '', type: 'Música' as RepertoireItemType, notes: '' })
  const [addError, setAddError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<RepertoireItem | null>(null)

  function handleAdd() {
    if (!form.title.trim()) { setAddError('Informe o título'); return }
    setAddError('')
    addRepertoireItem({ title: form.title.trim(), type: form.type, status: 'em andamento', notes: form.notes.trim() })
    setForm({ title: '', type: 'Música', notes: '' })
  }

  return (
    <div className="space-y-4">
      {/* Add form */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <h3 className="mb-3 font-semibold text-gray-900">Adicionar item</h3>
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[160px]">
            <input
              type="text"
              value={form.title}
              onChange={(e) => { setForm((p) => ({ ...p, title: e.target.value })); setAddError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
              placeholder="Título da música ou exercício…"
              className={cn(
                'block w-full rounded-xl border px-3.5 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2',
                addError ? 'border-red-400 focus:ring-red-500/20' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
              )}
            />
            {addError && <p className="mt-1 text-xs text-red-600">{addError}</p>}
          </div>
          <select
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as RepertoireItemType }))}
            className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {REPERTOIRE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <Button variant="primary" onClick={handleAdd}>
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </div>
      </div>

      {/* List */}
      {repertoire.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white py-10 text-center">
          <List className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-400">Nenhum item no repertório.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
          <div className="divide-y divide-gray-50">
            {repertoire.map((item) => (
              <div key={item.id} className="group flex items-center gap-3 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{item.title}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                      {item.type}
                    </span>
                  </div>
                  {item.notes && (
                    <p className="mt-0.5 text-xs text-gray-400 truncate">{item.notes}</p>
                  )}
                </div>
                {/* Status dropdown */}
                <div className="relative flex-shrink-0">
                  <select
                    value={item.status}
                    onChange={(e) => updateRepertoireItem(item.id, { status: e.target.value as RepertoireItemStatus })}
                    className={cn(
                      'appearance-none rounded-full pl-2.5 pr-6 py-0.5 text-[11px] font-semibold cursor-pointer focus:outline-none',
                      repertoireStatusStyle[item.status]
                    )}
                  >
                    {REPERTOIRE_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 opacity-60" />
                </div>
                <button
                  onClick={() => setDeleteTarget(item)}
                  className="rounded-lg p-1.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500"
                  aria-label="Remover"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { deleteRepertoireItem(deleteTarget.id); setDeleteTarget(null) } }}
        title="Remover item"
        description={`Remover "${deleteTarget?.title}" do repertório?`}
        confirmLabel="Remover"
      />
    </div>
  )
}

// ─── Tab: Anotações ───────────────────────────────────────────────────────────

function TabNotes({ profile }: { profile: ReturnType<typeof useStudentProfile> }) {
  const { notes, addNote, updateNote, deleteNote } = profile

  const [newContent, setNewContent] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<StudentNote | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleAdd() {
    if (!newContent.trim()) return
    setAdding(true)
    try {
      addNote(newContent.trim())
      setNewContent('')
    } finally {
      setAdding(false)
    }
  }

  function startEdit(note: StudentNote) {
    setEditingId(note.id)
    setEditDraft(note.content)
  }

  function saveEdit(id: string) {
    if (!editDraft.trim()) return
    updateNote(id, { content: editDraft.trim() })
    setEditingId(null)
  }

  return (
    <div className="space-y-4">
      {/* Add note */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <h3 className="mb-3 font-semibold text-gray-900">Nova anotação</h3>
        <textarea
          ref={textareaRef}
          rows={3}
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Escreva uma anotação sobre a aula ou sobre o aluno…"
          className="block w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <div className="mt-3 flex justify-end">
          <Button variant="primary" loading={adding} onClick={handleAdd} disabled={!newContent.trim()}>
            <Plus className="h-4 w-4" /> Adicionar anotação
          </Button>
        </div>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white py-10 text-center">
          <StickyNote className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-400">Nenhuma anotação ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="group rounded-2xl border border-gray-100 bg-white p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-xs text-gray-400">{formatDateTime(note.createdAt)}</p>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(note)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                    aria-label="Editar"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(note)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {editingId === note.id ? (
                <div>
                  <textarea
                    rows={3}
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    className="block w-full resize-none rounded-xl border border-blue-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    autoFocus
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => saveEdit(note.id)}
                      className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      <Check className="h-3 w-3" /> Salvar
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { deleteNote(deleteTarget.id); setDeleteTarget(null) } }}
        title="Excluir anotação"
        description="Tem certeza que deseja excluir esta anotação? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
      />
    </div>
  )
}

// ─── Smart Suggestion ────────────────────────────────────────────────────────

interface SmartSuggestionData {
  text: string
  focus?: string  // suggested focus value
}

function buildSmartSuggestion(
  difficulties: string[],
  lessonPlansCount: number,
  repertoire: { status: string }[],
  progress: { evolution: string; developedSkills: string[] } | null
): SmartSuggestionData | null {
  if (difficulties.length === 0 && lessonPlansCount < 2) return null

  // Repeated difficulty detection
  if (difficulties.length > 0 && lessonPlansCount >= 3) {
    const topDiff = difficulties[0]
    const lowerDiff = topDiff.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    if (/ritm|tempo|compasso|metrono/.test(lowerDiff)) {
      return {
        text: `Aluno apresenta dificuldade com ritmo em ${lessonPlansCount} planos consecutivos. Sugere-se focar em exercícios de subdivisão rítmica e uso de metrônomo.`,
        focus: 'ritmo',
      }
    }
    if (/tecni|postura|dedilh|articulac/.test(lowerDiff)) {
      return {
        text: `Dificuldade técnica identificada em múltiplas aulas: "${topDiff}". Considere dedicar mais tempo a exercícios técnicos isolados.`,
        focus: 'tecnica',
      }
    }
    if (/leitura|partitura|solfejo|nota/.test(lowerDiff)) {
      return {
        text: `Aluno demonstra dificuldade com leitura em ${lessonPlansCount} planos. Recomenda-se prática de leitura à primeira vista.`,
        focus: 'leitura',
      }
    }
    if (/repertori|musica|pec|obra/.test(lowerDiff)) {
      return {
        text: `Dificuldades recorrentes no repertório: "${topDiff}". Considere reduzir o ritmo de introdução de novas peças.`,
        focus: 'repertorio',
      }
    }
    return {
      text: `Aluno apresenta dificuldades recorrentes em "${topDiff}" por ${lessonPlansCount} planos. Vale reforçar este ponto na próxima aula.`,
    }
  }

  // First lesson plan — onboarding suggestion
  if (lessonPlansCount === 0) {
    const activeRepertoire = repertoire.filter((r) => r.status === 'em andamento').length
    if (activeRepertoire > 3) {
      return {
        text: 'Aluno tem vários itens em andamento no repertório. Uma aula focada em repertório pode ajudar a consolidar o que já está sendo estudado.',
        focus: 'repertorio',
      }
    }
    if (difficulties.length > 0) {
      return {
        text: `Dificuldades identificadas no perfil: "${difficulties[0]}". Comece com um plano focado neste ponto para criar uma base sólida.`,
      }
    }
  }

  // Student making good progress
  if (progress && progress.developedSkills.length >= 3 && difficulties.length === 0) {
    return {
      text: `Aluno com bom progresso (${progress.developedSkills.length} habilidades desenvolvidas). Boa oportunidade para introduzir repertório mais desafiador ou improvisação.`,
      focus: 'improvisacao',
    }
  }

  return null
}

// ─── Tab: Plano IA ────────────────────────────────────────────────────────────

const focusBadgeStyle: Record<LessonFocus, string> = {
  misto:        'bg-gray-100 text-gray-600',
  tecnica:      'bg-blue-100 text-blue-700',
  repertorio:   'bg-purple-100 text-purple-700',
  teoria:       'bg-indigo-100 text-indigo-700',
  improvisacao: 'bg-orange-100 text-orange-700',
  leitura:      'bg-teal-100 text-teal-700',
  ritmo:        'bg-pink-100 text-pink-700',
}

function SectionEditor({
  section,
  onChange,
}: {
  section: LessonPlanSection
  onChange: (updated: LessonPlanSection) => void
}) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [draft, setDraft] = useState('')

  function startEdit(idx: number) {
    setEditingIdx(idx)
    setDraft(section.activities[idx])
  }

  function saveEdit() {
    if (editingIdx === null) return
    const activities = [...section.activities]
    if (draft.trim()) {
      activities[editingIdx] = draft.trim()
    } else {
      activities.splice(editingIdx, 1)
    }
    onChange({ ...section, activities })
    setEditingIdx(null)
  }

  function addActivity() {
    onChange({ ...section, activities: [...section.activities, 'Nova atividade'] })
  }

  function removeActivity(idx: number) {
    const activities = section.activities.filter((_, i) => i !== idx)
    onChange({ ...section, activities })
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-2.5 border-b border-gray-50 bg-gray-50/60 px-5 py-3">
        <span className="text-lg">{section.emoji}</span>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">{section.title}</p>
        </div>
        <span className="rounded-full bg-white border border-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-500">
          {section.duration} min
        </span>
      </div>

      {/* Activities */}
      <ul className="divide-y divide-gray-50">
        {section.activities.map((activity, idx) => (
          <li key={idx} className="group flex items-start gap-3 px-5 py-3">
            <span className="mt-0.5 flex-shrink-0 h-1.5 w-1.5 rounded-full bg-blue-400 mt-2" />
            {editingIdx === idx ? (
              <div className="flex-1">
                <textarea
                  rows={2}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="block w-full resize-none rounded-lg border border-blue-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit() }
                    if (e.key === 'Escape') setEditingIdx(null)
                  }}
                />
                <div className="mt-1.5 flex gap-1.5">
                  <button onClick={saveEdit} className="flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700">
                    <Check className="h-2.5 w-2.5" /> OK
                  </button>
                  <button onClick={() => { removeActivity(idx); setEditingIdx(null) }} className="rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-50">
                    Remover
                  </button>
                  <button onClick={() => setEditingIdx(null)} className="rounded-md px-2 py-1 text-xs text-gray-400 hover:bg-gray-100">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p
                  className="flex-1 text-sm text-gray-700 leading-relaxed cursor-pointer hover:text-blue-700"
                  onClick={() => startEdit(idx)}
                  title="Clique para editar"
                >
                  {activity}
                </p>
                <button
                  onClick={() => startEdit(idx)}
                  className="flex-shrink-0 rounded-md p-1 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50 hover:text-blue-500"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      {/* Add activity */}
      <div className="border-t border-gray-50 px-5 py-2.5">
        <button
          onClick={addActivity}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar atividade
        </button>
      </div>
    </div>
  )
}

function TabAIPlanner({ profile }: { profile: ReturnType<typeof useStudentProfile> }) {
  const { student, progress, repertoire, lessonPlans, saveLessonPlan, updateLessonPlan, deleteLessonPlan } = profile
  const { canGenerateAIPlan, aiPlansThisMonth, planId, refresh: refreshSubscription } = useSubscription()
  const { add: addNotification } = useNotifications()
  const { user } = useAuth()

  // ── Form state ────────────────────────────────────────────────────────────
  const [duration, setDuration] = useState<30 | 45 | 60>(60)
  const [focus, setFocus] = useState<LessonFocus>('misto')
  const [observation, setObservation] = useState('')

  // ── Generation state ──────────────────────────────────────────────────────
  const [generating, setGenerating] = useState(false)
  const [currentSections, setCurrentSections] = useState<LessonPlanSection[] | null>(null)
  const [currentTitle, setCurrentTitle] = useState('')
  const [currentSummary, setCurrentSummary] = useState('')
  const [currentInputSnapshot, setCurrentInputSnapshot] = useState<{
    duration: 30 | 45 | 60
    focus: LessonFocus
    level: string
    difficulties: string[]
    objectives: string
    teacherObservation: string
  } | null>(null)

  // ── Save state ────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  // ── Saved plans expand ────────────────────────────────────────────────────
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null)
  const [planToDelete, setPlanToDelete] = useState<LessonPlan | null>(null)
  const [exportingPdfId, setExportingPdfId] = useState<string | null>(null)

  if (!student) return null

  const difficulties = progress?.identifiedDifficulties ?? []
  const objectives = student.objectives
  const activeRepertoire = repertoire
    .filter((r) => r.status === 'em andamento')
    .map((r) => r.title)

  const smartSuggestion = buildSmartSuggestion(
    difficulties,
    lessonPlans.length,
    repertoire,
    progress ?? null
  )

  // ── Generate ──────────────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!canGenerateAIPlan) return
    setGenerating(true)
    setCurrentSections(null)
    setJustSaved(false)

    // Simulate AI thinking delay
    await new Promise((resolve) => setTimeout(resolve, 1600))

    const teachingMethod = user ? (getUserSettings(user.id)?.teachingMethod ?? '') : ''
    const result = generateLessonPlan({
      instrument: student!.instrument,
      duration,
      focus,
      level: student!.level as import('@/lib/db/types').StudentLevel,
      difficulties,
      objectives,
      teacherObservation: observation,
      teachingMethod,
      repertoireTitles: activeRepertoire,
    })

    setCurrentTitle(result.title)
    setCurrentSummary(result.summary)
    setCurrentSections(result.sections)
    setCurrentInputSnapshot({
      duration,
      focus,
      level: student!.level,
      difficulties,
      objectives,
      teacherObservation: observation,
    })
    addNotification('lesson_generated', `Plano gerado para ${student!.name}: "${result.title}"`)
    setGenerating(false)
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  function handleSave() {
    if (!currentSections || !currentInputSnapshot) return
    setSaving(true)
    try {
      saveLessonPlan({
        duration: currentInputSnapshot.duration,
        focus: currentInputSnapshot.focus,
        level: currentInputSnapshot.level as import('@/lib/db/types').StudentLevel,
        difficulties: currentInputSnapshot.difficulties,
        objectives: currentInputSnapshot.objectives,
        teacherObservation: currentInputSnapshot.teacherObservation,
        title: currentTitle,
        summary: currentSummary,
        sections: currentSections,
      })
      addNotification('plan_saved', `Plano "${currentTitle}" salvo para ${student!.name}.`)
      refreshSubscription()
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  // ── Update saved plan sections ─────────────────────────────────────────────
  function handleUpdateSavedPlan(plan: LessonPlan, sections: LessonPlanSection[]) {
    updateLessonPlan(plan.id, { sections })
  }

  function focusLabel(f: LessonFocus) {
    return LESSON_FOCUSES.find((x) => x.value === f)?.label ?? f
  }

  return (
    <div className="space-y-6">
      {/* ── Smart Suggestion ──────────────────────────────────────────────── */}
      {smartSuggestion && (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-[#eef5ff] p-4">
          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
            <Lightbulb className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-1">Sugestão inteligente</p>
            <p className="text-sm text-gray-700 leading-relaxed">{smartSuggestion.text}</p>
            {smartSuggestion.focus && (
              <button
                onClick={() => setFocus(smartSuggestion.focus as LessonFocus)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <Sparkles className="h-3 w-3" />
                Aplicar foco sugerido
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Input form ────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <h3 className="font-semibold text-gray-900">Gerar plano de aula com IA</h3>
        </div>

        {/* Duration */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">Duração da aula</label>
          <div className="flex gap-2">
            {([30, 45, 60] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={cn(
                  'flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors',
                  duration === d
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>

        {/* Focus */}
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Foco da aula</label>
          <select
            value={focus}
            onChange={(e) => setFocus(e.target.value as LessonFocus)}
            className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {LESSON_FOCUSES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* Auto-filled fields (read-only) */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3.5 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Nível (automático)</p>
            <p className="text-sm font-medium text-gray-700">{student.level}</p>
          </div>
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3.5 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Instrumento (automático)</p>
            <p className="text-sm font-medium text-gray-700">{student.instrument}</p>
          </div>
        </div>

        {difficulties.length > 0 && (
          <div className="mb-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3.5 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Dificuldades (do perfil)</p>
            <div className="flex flex-wrap gap-1.5">
              {difficulties.map((d) => (
                <span key={d} className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}

        {objectives.trim() && (
          <div className="mb-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3.5 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Objetivos (do perfil)</p>
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{objectives}</p>
          </div>
        )}

        {/* Teacher observation */}
        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Observação adicional <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <textarea
            rows={2}
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="Ex: aluno tem apresentação em 2 semanas, focar no repertório de recital…"
            className="block w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* AI plan usage counter (Free plan) */}
        {planId === 'free' && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5">
            <span className="text-xs text-gray-500">Planos IA este mês</span>
            <span className={cn(
              'text-xs font-semibold',
              aiPlansThisMonth >= 5 ? 'text-red-600' : aiPlansThisMonth >= 3 ? 'text-amber-600' : 'text-gray-700'
            )}>
              {aiPlansThisMonth} / 5
            </span>
          </div>
        )}

        {/* Upgrade prompt when limit reached */}
        {!canGenerateAIPlan ? (
          <UpgradePrompt
            title="Limite de planos IA atingido"
            description="O plano Grátis permite 5 planos de aula por IA por mês. Faça upgrade para Pro e gere planos ilimitados."
          />
        ) : (
          /* Generate button */
          <Button
            variant="primary"
            loading={generating}
            disabled={generating}
            onClick={handleGenerate}
            className="w-full"
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Gerando plano…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Gerar plano de aula
              </>
            )}
          </Button>
        )}

        {generating && (
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-400">
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:300ms]" />
            </div>
            Analisando perfil e gerando plano personalizado…
          </div>
        )}
      </div>

      {/* ── Generated plan ─────────────────────────────────────────────────── */}
      {currentSections && !generating && (
        <div className="space-y-4">
          {/* Plan header */}
          <div className="rounded-2xl border border-blue-100 bg-[#eef5ff] p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Plano gerado</p>
                </div>
                <input
                  type="text"
                  value={currentTitle}
                  onChange={(e) => setCurrentTitle(e.target.value)}
                  className="block w-full bg-transparent text-lg font-bold text-gray-900 focus:outline-none focus:ring-0 border-0 p-0 mb-2"
                />
                <textarea
                  rows={2}
                  value={currentSummary}
                  onChange={(e) => setCurrentSummary(e.target.value)}
                  className="block w-full resize-none bg-transparent text-sm text-gray-600 leading-relaxed focus:outline-none focus:ring-0 border-0 p-0"
                />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-2">
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', focusBadgeStyle[focus])}>
                  {focusLabel(focus)}
                </span>
                <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  {duration} min
                </span>
              </div>
              <div className="flex items-center gap-2">
                {justSaved && (
                  <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                    <Check className="h-3.5 w-3.5" /> Salvo!
                  </span>
                )}
                <Button variant="outline" size="sm" onClick={handleGenerate}>
                  <RefreshCw className="h-3.5 w-3.5" /> Regerar
                </Button>
                <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
                  <Save className="h-3.5 w-3.5" /> Salvar plano
                </Button>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-3">
            {currentSections.map((section, idx) => (
              <SectionEditor
                key={section.id}
                section={section}
                onChange={(updated) => {
                  const next = [...currentSections]
                  next[idx] = updated
                  setCurrentSections(next)
                }}
              />
            ))}
          </div>

          <p className="text-center text-xs text-gray-400">
            Clique em qualquer atividade para editar · Use <kbd className="rounded border border-gray-200 px-1 py-0.5 font-mono text-[10px]">Enter</kbd> para confirmar
          </p>
        </div>
      )}

      {/* ── Saved plans ────────────────────────────────────────────────────── */}
      {lessonPlans.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Planos salvos ({lessonPlans.length})</h3>
          <div className="space-y-3">
            {lessonPlans.map((plan) => {
              const isExpanded = expandedPlanId === plan.id
              return (
                <div key={plan.id} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                  {/* Plan summary row */}
                  <div
                    className="flex cursor-pointer items-center gap-3 px-5 py-4 hover:bg-gray-50"
                    onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{plan.title}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', focusBadgeStyle[plan.focus])}>
                          {focusLabel(plan.focus)}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {new Date(plan.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          setExportingPdfId(plan.id)
                          try {
                            await exportLessonPlanPDF(plan, student!.name)
                          } finally {
                            setExportingPdfId(null)
                          }
                        }}
                        disabled={exportingPdfId === plan.id}
                        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-50"
                        title="Exportar PDF"
                      >
                        {exportingPdfId === plan.id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <FileDown className="h-3 w-3" />
                        )}
                        PDF
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPlanToDelete(plan) }}
                        className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', isExpanded && 'rotate-180')} />
                    </div>
                  </div>

                  {/* Expanded view with editable sections */}
                  {isExpanded && (
                    <div className="border-t border-gray-50 px-5 pb-5 pt-4 space-y-3">
                      <p className="text-sm text-gray-500 leading-relaxed">{plan.summary}</p>
                      {plan.sections.map((section, idx) => (
                        <SectionEditor
                          key={section.id}
                          section={section}
                          onChange={(updated) => {
                            const sections = [...plan.sections]
                            sections[idx] = updated
                            handleUpdateSavedPlan(plan, sections)
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty saved plans */}
      {lessonPlans.length === 0 && !currentSections && !generating && (
        <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-400">Nenhum plano gerado ainda.</p>
          <p className="text-xs text-gray-300 mt-0.5">Configure os campos acima e clique em "Gerar plano de aula".</p>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!planToDelete}
        onClose={() => setPlanToDelete(null)}
        onConfirm={() => { if (planToDelete) { deleteLessonPlan(planToDelete.id); setPlanToDelete(null) } }}
        title="Excluir plano"
        description={`Excluir "${planToDelete?.title}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir plano"
      />
    </div>
  )
}

// ─── Tab: Financeiro ──────────────────────────────────────────────────────────

const paymentStatusStyle: Record<import('@/lib/db/types').PaymentStatus, { badge: string; dot: string; label: string }> = {
  pago:     { badge: 'bg-green-100 text-green-700',  dot: 'bg-green-500',  label: 'Pago' },
  pendente: { badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500', label: 'Pendente' },
  atrasado: { badge: 'bg-red-100 text-red-600',       dot: 'bg-red-500',    label: 'Atrasado' },
}

function formatDatePT(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')
}

function TabFinanceiro({ profile }: { profile: ReturnType<typeof useStudentProfile> }) {
  const { student, financial, payments, saveFinancial, addPayment, editPayment, removePayment } = profile
  if (!student) return null

  const thisMonth = currentYearMonth()

  // ── Settings state ────────────────────────────────────────────────────────
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [feeForm, setFeeForm] = useState({
    monthlyFee: financial?.monthlyFee?.toString() ?? '',
    dueDayOfMonth: financial?.dueDayOfMonth?.toString() ?? '10',
    paymentLink: financial?.paymentLink ?? '',
    contactLink: financial?.contactLink ?? '',
  })
  const [feeErrors, setFeeErrors] = useState<Record<string, string>>({})
  const [savingSettings, setSavingSettings] = useState(false)

  // ── Payment modal state ───────────────────────────────────────────────────
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<import('@/lib/db/types').Payment | null>(null)
  const [paymentForm, setPaymentForm] = useState({
    referenceMonth: thisMonth,
    amount: '',
    paidAt: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [savingPayment, setSavingPayment] = useState(false)

  // ── Delete state ──────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<import('@/lib/db/types').Payment | null>(null)

  // ── Derived current month data ────────────────────────────────────────────
  const currentPayment = payments.find((p) => p.referenceMonth === thisMonth) ?? null
  const currentStatus = financial
    ? computeStatusForMonth(financial, currentPayment, thisMonth)
    : null
  const currentDueDate = financial
    ? getDueDateForMonth(financial.dueDayOfMonth, thisMonth)
    : null

  // ── Open payment modal ────────────────────────────────────────────────────
  function openRegisterPayment(month: string = thisMonth, existing: import('@/lib/db/types').Payment | null = null) {
    setEditingPayment(existing)
    setPaymentForm({
      referenceMonth: month,
      amount: existing?.amount?.toString() ?? financial?.monthlyFee?.toString() ?? '',
      paidAt: existing?.paidAt ?? new Date().toISOString().split('T')[0],
      notes: existing?.notes ?? '',
    })
    setPaymentOpen(true)
  }

  // ── Save financial settings ───────────────────────────────────────────────
  function handleSaveSettings() {
    const errs: Record<string, string> = {}
    const fee = parseFloat(feeForm.monthlyFee)
    const day = parseInt(feeForm.dueDayOfMonth, 10)
    if (isNaN(fee) || fee <= 0) errs.monthlyFee = 'Informe um valor válido'
    if (isNaN(day) || day < 1 || day > 28) errs.dueDayOfMonth = 'Dia deve ser entre 1 e 28'
    if (Object.keys(errs).length > 0) { setFeeErrors(errs); return }
    setSavingSettings(true)
    try {
      saveFinancial({
        monthlyFee: fee,
        dueDayOfMonth: day,
        paymentLink: feeForm.paymentLink.trim() || undefined,
        contactLink: feeForm.contactLink.trim() || undefined,
      })
      setSettingsOpen(false)
    } finally {
      setSavingSettings(false)
    }
  }

  // ── Quick "Marcar como pago" ──────────────────────────────────────────────
  const [markingPaid, setMarkingPaid] = useState(false)
  function handleMarkAsPaid() {
    if (!financial) return
    setMarkingPaid(true)
    try {
      const dueDate = getDueDateForMonth(financial.dueDayOfMonth, thisMonth)
      addPayment({
        referenceMonth: thisMonth,
        dueDate,
        paidAt: new Date().toISOString().split('T')[0],
        amount: financial.monthlyFee,
        notes: '',
      })
    } finally {
      setMarkingPaid(false)
    }
  }

  // ── Save payment ──────────────────────────────────────────────────────────
  function handleSavePayment() {
    const amount = parseFloat(paymentForm.amount)
    if (isNaN(amount) || amount <= 0) return
    setSavingPayment(true)
    try {
      const dueDate = financial
        ? getDueDateForMonth(financial.dueDayOfMonth, paymentForm.referenceMonth)
        : paymentForm.paidAt
      addPayment({
        referenceMonth: paymentForm.referenceMonth,
        dueDate,
        paidAt: paymentForm.paidAt || null,
        amount,
        notes: paymentForm.notes.trim(),
      })
      setPaymentOpen(false)
    } finally {
      setSavingPayment(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Settings card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Configurações de cobrança</h3>
          </div>
          <button
            onClick={() => {
              setFeeForm({
                monthlyFee: financial?.monthlyFee?.toString() ?? '',
                dueDayOfMonth: financial?.dueDayOfMonth?.toString() ?? '10',
                paymentLink: financial?.paymentLink ?? '',
                contactLink: financial?.contactLink ?? '',
              })
              setFeeErrors({})
              setSettingsOpen(true)
            }}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            <Edit2 className="h-3 w-3" />
            {financial ? 'Editar' : 'Configurar'}
          </button>
        </div>

        {financial ? (
          <>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-gray-400">Valor mensal</dt>
                <dd className="mt-0.5 text-xl font-bold text-gray-900">{formatCurrency(financial.monthlyFee)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Vencimento</dt>
                <dd className="mt-0.5 text-xl font-bold text-gray-900">Dia {financial.dueDayOfMonth}</dd>
              </div>
            </dl>
            {(financial.paymentLink || financial.contactLink) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {financial.paymentLink && (
                  <a
                    href={financial.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition-colors hover:bg-green-100"
                  >
                    <CreditCard className="h-3.5 w-3.5" /> Pagar agora
                  </a>
                )}
                {financial.contactLink && (
                  <a
                    href={financial.contactLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                  >
                    <Phone className="h-3.5 w-3.5" /> Entrar em contato
                  </a>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 py-6 text-center">
            <CreditCard className="mx-auto h-6 w-6 text-gray-300" />
            <p className="mt-1.5 text-sm text-gray-400">Nenhuma cobrança configurada.</p>
            <button
              onClick={() => { setFeeErrors({}); setSettingsOpen(true) }}
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Configurar agora
            </button>
          </div>
        )}
      </div>

      {/* Current month status */}
      {financial && (
        <div className={cn(
          'rounded-2xl border p-5',
          currentStatus === 'atrasado' ? 'border-red-200 bg-red-50' :
          currentStatus === 'pago' ? 'border-green-100 bg-white' :
          'border-yellow-200 bg-yellow-50'
        )}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <h3 className="font-semibold text-gray-900">{formatMonth(thisMonth)}</h3>
            </div>
            {currentStatus && (
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', paymentStatusStyle[currentStatus].badge)}>
                {paymentStatusStyle[currentStatus].label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-6 mb-3">
            <div>
              <p className="text-xs text-gray-400">Valor mensal</p>
              <p className="mt-0.5 text-lg font-bold text-gray-900">
                {currentPayment ? formatCurrency(currentPayment.amount) : formatCurrency(financial.monthlyFee)}
              </p>
            </div>
            {currentDueDate && (
              <div>
                <p className="text-xs text-gray-400">Vencimento</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-700">{formatDatePT(currentDueDate)}</p>
              </div>
            )}
            {currentPayment?.paidAt && (
              <div>
                <p className="text-xs text-gray-400">Pago em</p>
                <p className="mt-0.5 text-sm font-semibold text-green-700">{formatDatePT(currentPayment.paidAt)}</p>
              </div>
            )}
          </div>

          {/* Dynamic status text */}
          {currentStatus !== 'pago' && currentDueDate && (() => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const due = new Date(currentDueDate + 'T00:00:00')
            const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000)
            return (
              <p className={cn('mb-3 text-sm font-medium', currentStatus === 'atrasado' ? 'text-red-600' : 'text-yellow-700')}>
                {diffDays === 0
                  ? 'Pagamento vence hoje'
                  : diffDays < 0
                  ? `Pagamento atrasado há ${Math.abs(diffDays)} dia${Math.abs(diffDays) !== 1 ? 's' : ''}`
                  : `Faltam ${diffDays} dia${diffDays !== 1 ? 's' : ''} para o vencimento`
                }
              </p>
            )
          })()}

          <div className="flex flex-wrap gap-2">
            {currentStatus !== 'pago' ? (
              <>
                <Button variant="primary" size="sm" loading={markingPaid} onClick={handleMarkAsPaid}>
                  <Check className="h-3.5 w-3.5" /> Marcar como pago
                </Button>
                <Button variant="outline" size="sm" onClick={() => openRegisterPayment(thisMonth, currentPayment)}>
                  <DollarSign className="h-3.5 w-3.5" /> Registrar com detalhes
                </Button>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1 text-sm font-medium text-green-700">
                  <Check className="h-4 w-4" /> Pagamento confirmado
                </span>
                <button
                  onClick={() => openRegisterPayment(thisMonth, currentPayment)}
                  className="ml-2 text-xs text-gray-400 hover:text-gray-600"
                >
                  Editar
                </button>
              </>
            )}
            {financial.paymentLink && currentStatus !== 'pago' && (
              <a
                href={financial.paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              >
                <CreditCard className="h-3.5 w-3.5" /> Pagar agora
              </a>
            )}
            {financial.contactLink && (
              <a
                href={financial.contactLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Phone className="h-3.5 w-3.5" /> Entrar em contato
              </a>
            )}
          </div>
        </div>
      )}

      {/* Payment history */}
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4">
          <h3 className="font-semibold text-gray-900">Histórico de pagamentos</h3>
          {financial && (
            <button
              onClick={() => openRegisterPayment(thisMonth, null)}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-3.5 w-3.5" /> Registrar
            </button>
          )}
        </div>

        {payments.length === 0 ? (
          <div className="py-10 text-center">
            <CreditCard className="mx-auto h-7 w-7 text-gray-300" />
            <p className="mt-2 text-sm text-gray-400">Nenhum pagamento registrado.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {payments.map((payment) => {
              const status = computePaymentStatus(payment)
              const style = paymentStatusStyle[status]
              return (
                <div key={payment.id} className="group flex items-center gap-4 px-5 py-4">
                  <div className={cn('h-2 w-2 flex-shrink-0 rounded-full', style.dot)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{formatMonth(payment.referenceMonth)}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                      <span>Venc. {formatDatePT(payment.dueDate)}</span>
                      {payment.paidAt && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="text-green-600">Pago em {formatDatePT(payment.paidAt)}</span>
                        </>
                      )}
                      {payment.notes && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="italic truncate max-w-[120px]">{payment.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                  <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', style.badge)}>
                    {style.label}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openRegisterPayment(payment.referenceMonth, payment)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                      aria-label="Editar"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(payment)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Settings modal */}
      <Modal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} title="Configurações de cobrança" size="sm">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Valor mensal (R$) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={feeForm.monthlyFee}
              onChange={(e) => setFeeForm((p) => ({ ...p, monthlyFee: e.target.value }))}
              placeholder="Ex: 200.00"
              className={cn(
                'block w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2',
                feeErrors.monthlyFee ? 'border-red-400 focus:ring-red-500/20' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
              )}
            />
            {feeErrors.monthlyFee && <p className="mt-1 text-xs text-red-600">{feeErrors.monthlyFee}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Dia do vencimento (1–28) *</label>
            <input
              type="number"
              min="1"
              max="28"
              value={feeForm.dueDayOfMonth}
              onChange={(e) => setFeeForm((p) => ({ ...p, dueDayOfMonth: e.target.value }))}
              placeholder="Ex: 10"
              className={cn(
                'block w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2',
                feeErrors.dueDayOfMonth ? 'border-red-400 focus:ring-red-500/20' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
              )}
            />
            {feeErrors.dueDayOfMonth && <p className="mt-1 text-xs text-red-600">{feeErrors.dueDayOfMonth}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Link de pagamento (opcional)</label>
            <input
              type="url"
              value={feeForm.paymentLink}
              onChange={(e) => setFeeForm((p) => ({ ...p, paymentLink: e.target.value }))}
              placeholder="Ex: https://pix.app.link/..."
              className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="mt-1 text-xs text-gray-400">Pix, MercadoPago, PagBank, etc.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Link de contato (opcional)</label>
            <input
              type="url"
              value={feeForm.contactLink}
              onChange={(e) => setFeeForm((p) => ({ ...p, contactLink: e.target.value }))}
              placeholder="Ex: https://wa.me/5511999999999"
              className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="mt-1 text-xs text-gray-400">WhatsApp ou outro canal de contato.</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancelar</Button>
          <Button variant="primary" loading={savingSettings} onClick={handleSaveSettings}>Salvar</Button>
        </div>
      </Modal>

      {/* Payment modal */}
      <Modal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title={editingPayment ? 'Editar pagamento' : 'Registrar pagamento'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Mês de referência *</label>
            <input
              type="month"
              value={paymentForm.referenceMonth}
              onChange={(e) => setPaymentForm((p) => ({ ...p, referenceMonth: e.target.value }))}
              className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Valor pago (R$) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))}
              placeholder={financial?.monthlyFee?.toString() ?? '0.00'}
              className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Data do pagamento *</label>
            <input
              type="date"
              value={paymentForm.paidAt}
              onChange={(e) => setPaymentForm((p) => ({ ...p, paidAt: e.target.value }))}
              className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Observação <span className="font-normal text-gray-400">(opcional)</span></label>
            <input
              type="text"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Ex: Pix, parcela, desconto…"
              className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancelar</Button>
          <Button
            variant="primary"
            loading={savingPayment}
            onClick={handleSavePayment}
            disabled={!paymentForm.amount || !paymentForm.paidAt}
          >
            <Check className="h-4 w-4" /> {editingPayment ? 'Atualizar' : 'Confirmar pagamento'}
          </Button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { removePayment(deleteTarget.id); setDeleteTarget(null) } }}
        title="Excluir pagamento"
        description={`Excluir o pagamento de ${formatMonth(deleteTarget?.referenceMonth ?? '')}? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
      />
    </div>
  )
}

// ─── Avatar gradients ─────────────────────────────────────────────────────────

const avatarGradients = [
  'from-[#1a7cfa] to-[#1468d6]',
  'from-emerald-500 to-teal-600',
  'from-indigo-500 to-blue-600',
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentProfilePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentId = params.id as string

  const { user } = useAuth()
  const profile = useStudentProfile(studentId)
  const { student, lessons, loading, notFound } = profile

  // Support deep-linking via ?tab=progress etc.
  const initialTab = (searchParams.get('tab') as TabId | null) ?? 'overview'
  const [activeTab, setActiveTab] = useState<TabId>(initialTab)

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (notFound || !student) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <p className="text-gray-500">Aluno não encontrado.</p>
        <Button variant="outline" onClick={() => router.push('/students')}>
          <ArrowLeft className="h-4 w-4" /> Voltar para Alunos
        </Button>
      </div>
    )
  }

  const completedLessons = lessons.filter((l) => l.status === 'concluída').length
  const gradient = avatarGradients[student.name.charCodeAt(0) % avatarGradients.length]

  // Next upcoming lesson (for "Iniciar aula" button)
  const todayStr = new Date().toISOString().split('T')[0]
  const nextLesson = lessons
    .filter((l) => l.date >= todayStr && l.status === 'agendada')
    .sort((a, b) => a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date))[0] ?? null

  return (
    <div className="p-6 lg:p-8 animate-in">
      {/* Back + header */}
      <div className="mb-6">
        <Link
          href="/students"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Alunos
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          <div
            className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-lg font-bold text-white`}
          >
            {getInitials(student.name)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Music className="h-3.5 w-3.5" /> {student.instrument}
              </span>
              <span className="text-gray-300">·</span>
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', levelStyle[student.level as StudentLevel])}>
                {student.level}
              </span>
              <span className="text-gray-300">·</span>
              <span>{completedLessons} aula{completedLessons !== 1 ? 's' : ''} concluída{completedLessons !== 1 ? 's' : ''}</span>
            </div>
          </div>
          {nextLesson && (
            <Link
              href={`/lesson-mode/${nextLesson.id}`}
              className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              <PlayCircle className="h-4 w-4" />
              Iniciar aula
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-100 pb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && <TabOverview profile={profile} />}
      {activeTab === 'history' && <TabHistory profile={profile} />}
      {activeTab === 'progress' && <TabProgress profile={profile} />}
      {activeTab === 'repertoire' && <TabRepertoire profile={profile} />}
      {activeTab === 'notes' && <TabNotes profile={profile} />}
      {activeTab === 'ai-planner' && <TabAIPlanner profile={profile} />}
      {activeTab === 'financeiro' && <TabFinanceiro profile={profile} />}
      {activeTab === 'materiais' && (
        <FilesTab studentId={student.id} teacherId={user?.id ?? ''} />
      )}
    </div>
  )
}
