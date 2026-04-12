'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, Pencil, Trash2, Users, Phone, Mail, Music, ChevronRight, AlertTriangle, CalendarX } from 'lucide-react'
import { useStudents } from '@/hooks/useStudents'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { useNotifications } from '@/hooks/useNotifications'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { UpgradePrompt } from '@/components/ui/UpgradePrompt'
import { getNextLessonForStudent, getLessonsByStudent } from '@/lib/db/lessons'
import { INSTRUMENTS, LEVELS, STUDENT_COLORS } from '@/lib/db/types'
import { PLANS } from '@/lib/plans'
import type { Student, StudentLevel } from '@/lib/db/types'
import { cn, getInitials } from '@/lib/utils'

// ─── Form ─────────────────────────────────────────────────────────────────────

interface FormState {
  name: string
  instrument: string
  level: StudentLevel
  email: string
  phone: string
  notes: string
  objectives: string
  nextSteps: string
  color: string
  needsAttention: boolean
  meetLink: string
}

const EMPTY_FORM: FormState = {
  name: '',
  instrument: '',
  level: 'Iniciante',
  email: '',
  phone: '',
  notes: '',
  objectives: '',
  nextSteps: '',
  color: STUDENT_COLORS[0],
  needsAttention: false,
  meetLink: '',
}

function validateForm(f: FormState): Record<string, string> {
  const e: Record<string, string> = {}
  if (!f.name.trim() || f.name.trim().length < 2)
    e.name = 'O nome deve ter pelo menos 2 caracteres'
  if (!f.instrument) e.instrument = 'Selecione um instrumento'
  if (f.email && !/\S+@\S+\.\S+/.test(f.email)) e.email = 'Informe um e-mail válido'
  return e
}

// ─── Level badge colours ──────────────────────────────────────────────────────

const levelStyle: Record<StudentLevel, string> = {
  Iniciante: 'bg-blue-100 text-blue-700',
  Intermediário: 'bg-purple-100 text-purple-700',
  Avançado: 'bg-indigo-100 text-indigo-700',
}

// ─── Avatar gradient palette (cycles by index) ───────────────────────────────

const avatarGradients = [
  'from-[#1a7cfa] to-[#1468d6]',
  'from-emerald-500 to-teal-600',
  'from-indigo-500 to-blue-600',
  'from-orange-500 to-amber-600',
  'from-[#1057b0] to-[#0d2d5e]',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatNextLesson(lesson: ReturnType<typeof getNextLessonForStudent>): string {
  if (!lesson) return 'Sem aulas agendadas'
  const date = new Date(lesson.date + 'T00:00:00')
  const todayStr = new Date().toISOString().split('T')[0]
  const tomorrowDate = new Date()
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0]

  let dayLabel: string
  if (lesson.date === todayStr) dayLabel = 'Hoje'
  else if (lesson.date === tomorrowStr) dayLabel = 'Amanhã'
  else dayLabel = date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })

  const [h, m] = lesson.time.split(':')
  return `${dayLabel}, ${h}h${m !== '00' ? m : ''}`
}

// ─── Student card ─────────────────────────────────────────────────────────────

interface StudentCardProps {
  student: Student
  index: number
  onEdit: () => void
  onDelete: () => void
}

function StudentCard({ student, index, onEdit, onDelete }: StudentCardProps) {
  const nextLesson = getNextLessonForStudent(student.id)
  const hasNextLesson = !!nextLesson
  const studentColor = student.color || STUDENT_COLORS[index % STUDENT_COLORS.length]

  // Compute days since last lesson for the "no lessons" alert badge
  const studentLessons = getLessonsByStudent(student.id).filter((l) => l.status !== 'cancelada')
  const lastLesson = studentLessons.sort((a, b) => b.date.localeCompare(a.date))[0]
  const daysSinceLast = lastLesson
    ? Math.floor((Date.now() - new Date(lastLesson.date + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24))
    : null
  const showNoLessonBadge = !student.needsAttention && (daysSinceLast === null || daysSinceLast >= 14)

  return (
    <div
      className="group relative flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
      style={{ borderLeftColor: studentColor, borderLeftWidth: 3 }}
    >
      {/* Needs attention badge */}
      {student.needsAttention && (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5">
          <AlertTriangle className="h-3 w-3 text-amber-600" />
          <span className="text-[10px] font-semibold text-amber-700">Atenção</span>
        </div>
      )}

      {/* No lesson badge */}
      {showNoLessonBadge && (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5">
          <CalendarX className="h-3 w-3 text-orange-600" />
          <span className="text-[10px] font-semibold text-orange-700">
            {daysSinceLast === null ? 'Sem aulas' : `${daysSinceLast}d sem aula`}
          </span>
        </div>
      )}

      {/* Top row */}
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: studentColor }}
        >
          {getInitials(student.name)}
        </div>
        <div className="flex-1 min-w-0">
          <Link
            href={`/students/${student.id}`}
            className="truncate font-semibold text-gray-900 hover:text-blue-600 transition-colors flex items-center gap-1"
          >
            {student.name}
            <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Music className="h-3 w-3" /> {student.instrument}
            </span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                levelStyle[student.level]
              )}
            >
              {student.level}
            </span>
          </div>
        </div>
        {/* Actions — visible on hover */}
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onEdit}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
            aria-label="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
            aria-label="Excluir"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Contact info */}
      {(student.email || student.phone) && (
        <div className="mt-3 space-y-1">
          {student.email && (
            <p className="flex items-center gap-1.5 text-xs text-gray-400">
              <Mail className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{student.email}</span>
            </p>
          )}
          {student.phone && (
            <p className="flex items-center gap-1.5 text-xs text-gray-400">
              <Phone className="h-3 w-3 flex-shrink-0" />
              {student.phone}
            </p>
          )}
        </div>
      )}

      {/* Next lesson */}
      <div className="mt-4 flex items-center gap-1.5 border-t border-gray-50 pt-3 text-xs">
        <div
          className={cn(
            'h-1.5 w-1.5 rounded-full flex-shrink-0',
            hasNextLesson ? 'bg-green-500' : 'bg-gray-300'
          )}
        />
        <span className={hasNextLesson ? 'text-gray-600' : 'text-gray-400'}>
          {formatNextLesson(nextLesson)}
        </span>
      </div>
    </div>
  )
}

// ─── Form fields component ────────────────────────────────────────────────────

interface StudentFormProps {
  form: FormState
  errors: Record<string, string>
  onChange: (patch: Partial<FormState>) => void
}

function StudentForm({ form, errors, onChange }: StudentFormProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Nome completo *"
        placeholder="Ex: Ana Silva"
        value={form.name}
        onChange={(e) => onChange({ name: e.target.value })}
        error={errors.name}
      />

      <div className="grid grid-cols-2 gap-3">
        {/* Instrument */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Instrumento *</label>
          <select
            value={form.instrument}
            onChange={(e) => onChange({ instrument: e.target.value })}
            className={cn(
              'block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2',
              errors.instrument
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
            )}
          >
            <option value="">Selecione…</option>
            {INSTRUMENTS.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
          {errors.instrument && (
            <p className="mt-1.5 text-xs text-red-600">{errors.instrument}</p>
          )}
        </div>

        {/* Level */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Nível *</label>
          <select
            value={form.level}
            onChange={(e) => onChange({ level: e.target.value as StudentLevel })}
            className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="E-mail"
          type="email"
          placeholder="aluno@email.com"
          value={form.email}
          onChange={(e) => onChange({ email: e.target.value })}
          error={errors.email}
        />
        <Input
          label="Telefone"
          type="tel"
          placeholder="(11) 99999-9999"
          value={form.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
        />
      </div>

      <Input
        label="Link Google Meet"
        type="url"
        placeholder="https://meet.google.com/xxx-xxxx-xxx"
        value={form.meetLink}
        onChange={(e) => onChange({ meetLink: e.target.value })}
      />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Observações
        </label>
        <textarea
          rows={2}
          placeholder="Informações adicionais sobre o aluno…"
          value={form.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          className="block w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm placeholder-gray-400 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Color picker */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Cor do aluno</label>
        <div className="flex flex-wrap gap-2">
          {STUDENT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange({ color })}
              className={cn(
                'h-7 w-7 rounded-full transition-all',
                form.color === color ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-105'
              )}
              style={{ backgroundColor: color }}
              aria-label={`Cor ${color}`}
            />
          ))}
        </div>
      </div>

      {/* Needs attention toggle */}
      <label className="flex cursor-pointer items-center gap-3">
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only"
            checked={form.needsAttention}
            onChange={(e) => onChange({ needsAttention: e.target.checked })}
          />
          <div className={cn(
            'h-5 w-9 rounded-full transition-colors',
            form.needsAttention ? 'bg-amber-500' : 'bg-gray-200'
          )}>
            <div className={cn(
              'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
              form.needsAttention ? 'left-4' : 'left-0.5'
            )} />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Precisa de atenção especial</p>
          <p className="text-xs text-gray-400">Aparece com alerta na lista e no painel de progresso</p>
        </div>
      </label>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const { user } = useAuth()
  const { students, create, update, remove } = useStudents()
  const { canAddStudent, planId, studentsCount, refresh: refreshSubscription } = useSubscription()
  const { add: addNotification } = useNotifications()

  // Filters
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<StudentLevel | 'all'>('all')

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null)

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(q) || s.instrument.toLowerCase().includes(q)
      const matchesLevel = levelFilter === 'all' || s.level === levelFilter
      return matchesSearch && matchesLevel
    })
  }, [students, search, levelFilter])

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openNew = useCallback(() => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((student: Student) => {
    setEditing(student)
    setForm({
      name: student.name,
      instrument: student.instrument,
      level: student.level,
      email: student.email,
      phone: student.phone,
      notes: student.notes,
      objectives: student.objectives,
      nextSteps: student.nextSteps,
      color: student.color || STUDENT_COLORS[0],
      needsAttention: student.needsAttention || false,
      meetLink: student.meetLink || '',
    })
    setErrors({})
    setModalOpen(true)
  }, [])

  const patchForm = useCallback((patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }))
  }, [])

  // ── Save ──────────────────────────────────────────────────────────────────
  function handleSave() {
    const e = validateForm(form)
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({})
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        instrument: form.instrument,
        level: form.level,
        email: form.email.trim(),
        phone: form.phone.trim(),
        notes: form.notes.trim(),
        objectives: form.objectives.trim(),
        nextSteps: form.nextSteps.trim(),
        color: form.color,
        needsAttention: form.needsAttention,
        meetLink: form.meetLink.trim(),
      }
      if (editing) {
        update(editing.id, payload)
      } else {
        const student = create(payload)
        addNotification('student_created', `Aluno "${form.name.trim()}" cadastrado com sucesso.`, student.id)
        refreshSubscription()
      }
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  function handleDelete() {
    if (!deleteTarget) return
    const name = deleteTarget.name
    remove(deleteTarget.id)
    addNotification('student_deleted', `Aluno "${name}" removido.`)
    setDeleteTarget(null)
    refreshSubscription()
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-8 animate-in">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alunos</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {students.length === 0
              ? 'Nenhum aluno cadastrado'
              : `${students.length} aluno${students.length !== 1 ? 's' : ''}${
                  PLANS[planId].limits.students !== null
                    ? ` de ${PLANS[planId].limits.students} disponíveis`
                    : ''
                }`}
          </p>
        </div>
        {canAddStudent ? (
          <Button variant="primary" onClick={openNew}>
            <Plus className="h-4 w-4" /> Novo Aluno
          </Button>
        ) : (
          <Button variant="outline" onClick={openNew} className="opacity-50 cursor-not-allowed" disabled>
            <Plus className="h-4 w-4" /> Novo Aluno
          </Button>
        )}
      </div>

      {/* Upgrade prompt when student limit is reached */}
      {!canAddStudent && (
        <div className="mb-6">
          <UpgradePrompt
            title="Limite de alunos atingido"
            description={`O plano Grátis permite até ${PLANS.free.limits.students} alunos. Faça upgrade para Pro e adicione alunos ilimitados.`}
          />
        </div>
      )}

      {/* Filters */}
      {students.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Buscar por nome ou instrumento…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as StudentLevel | 'all')}
            className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Todos os níveis</option>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      )}

      {/* Content */}
      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum aluno ainda"
          description="Cadastre seu primeiro aluno para começar a gerenciar aulas e acompanhar o progresso."
          action={
            <Button variant="primary" onClick={openNew}>
              <Plus className="h-4 w-4" /> Cadastrar primeiro aluno
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nenhum resultado"
          description={`Não há alunos correspondendo a "${search}".`}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((student, i) => (
            <StudentCard
              key={student.id}
              student={student}
              index={i}
              onEdit={() => openEdit(student)}
              onDelete={() => setDeleteTarget(student)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Aluno' : 'Novo Aluno'}
        size="md"
      >
        <StudentForm form={form} errors={errors} onChange={patchForm} />
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="outline" onClick={() => setModalOpen(false)}>
            Cancelar
          </Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>
            {editing ? 'Salvar alterações' : 'Cadastrar aluno'}
          </Button>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir aluno"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Todas as aulas associadas também serão removidas. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir aluno"
      />
    </div>
  )
}
