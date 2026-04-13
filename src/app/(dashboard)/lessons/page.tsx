'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Plus, Search, Pencil, Trash2, Calendar, Clock, Music,
  BookOpen, ChevronDown, CheckCircle2, Video, PlayCircle, AlertTriangle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLessons } from '@/hooks/useLessons'
import { useStudents } from '@/hooks/useStudents'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { INSTRUMENTS, LESSON_STATUSES, LESSON_DURATIONS } from '@/lib/db/types'
import type { Lesson, LessonStatus } from '@/lib/db/types'
import { todayISO, thisWeekRange } from '@/lib/db/lessons'
import { cn } from '@/lib/utils'

// ─── Status styles ────────────────────────────────────────────────────────────

const statusStyle: Record<LessonStatus, { pill: string; dot: string; label: string }> = {
  agendada: { pill: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', label: 'Agendada' },
  concluída: { pill: 'bg-green-100 text-green-700', dot: 'bg-green-500', label: 'Concluída' },
  cancelada: { pill: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400', label: 'Cancelada' },
  falta: { pill: 'bg-red-100 text-red-600', dot: 'bg-red-500', label: 'Falta' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}min`
}

function formatDateHeader(dateStr: string): string {
  const today = todayISO()
  const tomorrowDate = new Date()
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrow = tomorrowDate.toISOString().split('T')[0]

  if (dateStr === today) return 'Hoje'
  if (dateStr === tomorrow) return 'Amanhã'

  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function formatTime(time: string): string {
  const [h, m] = time.split(':')
  return `${h}h${m !== '00' ? m : ''}`
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type FilterTab = 'todas' | 'hoje' | 'semana' | 'proximas'

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'hoje', label: 'Hoje' },
  { id: 'semana', label: 'Esta semana' },
  { id: 'proximas', label: 'Próximas' },
]

// ─── Form ─────────────────────────────────────────────────────────────────────

interface FormState {
  studentId: string
  date: string
  time: string
  duration: number
  instrument: string
  topic: string
  notes: string
  status: LessonStatus
}

function makeDefaultForm(): FormState {
  const now = new Date()
  const hh = String(now.getHours() + 1).padStart(2, '0')
  return {
    studentId: '',
    date: todayISO(),
    time: `${hh}:00`,
    duration: 60,
    instrument: '',
    topic: '',
    notes: '',
    status: 'agendada',
  }
}

function validateForm(f: FormState): Record<string, string> {
  const e: Record<string, string> = {}
  if (!f.studentId) e.studentId = 'Selecione um aluno'
  if (!f.date) e.date = 'Informe a data'
  if (!f.time) e.time = 'Informe o horário'
  if (!f.instrument) e.instrument = 'Selecione o instrumento'
  return e
}

/** Returns the conflicting lesson, if any, for given date/time/duration. */
function findConflict(allLessons: Lesson[], date: string, time: string, duration: number, excludeId?: string): Lesson | null {
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  const newStart = toMin(time)
  const newEnd = newStart + duration
  return allLessons.find((l) => {
    if (l.id === excludeId) return false
    if (l.date !== date) return false
    if (l.status === 'cancelada') return false
    const lStart = toMin(l.time)
    const lEnd = lStart + l.duration
    return newStart < lEnd && newEnd > lStart
  }) ?? null
}

// ─── Lesson row ──────────────────────────────────────────────────────────────

interface LessonRowProps {
  lesson: Lesson
  studentName: string
  studentMeetLink?: string
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: LessonStatus) => void
  onReschedule: (date: string, time: string) => void
  allLessons: Lesson[]
}

function LessonRow({ lesson, studentName, studentMeetLink, onEdit, onDelete, onStatusChange, onReschedule, allLessons }: LessonRowProps) {
  const [statusOpen, setStatusOpen] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)
  const [newDate, setNewDate] = useState(lesson.date)
  const [newTime, setNewTime] = useState(lesson.time)
  const [rescheduleError, setRescheduleError] = useState('')
  const router = useRouter()

  function handleRescheduleSave() {
    if (!newDate) { setRescheduleError('Selecione uma data.'); return }
    if (!newTime) { setRescheduleError('Selecione um horário.'); return }
    if (newDate < todayISO()) { setRescheduleError('A nova data não pode ser no passado.'); return }
    const conflict = findConflict(allLessons, newDate, newTime, lesson.duration, lesson.id)
    if (conflict) { setRescheduleError(`Conflito com aula de outro aluno às ${formatTime(conflict.time)}.`); return }
    onReschedule(newDate, newTime)
    setRescheduling(false)
  }
  const style = statusStyle[lesson.status]

  return (
    <div className="group relative flex items-start gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3.5 shadow-card transition-all duration-150 hover:shadow-card-hover">
      {/* Status dot */}
      <div className="mt-1 flex-shrink-0">
        <div className={cn('h-2.5 w-2.5 rounded-full', style.dot)} />
      </div>

      {/* Main info */}
      <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 min-w-0">
        <span className="text-sm font-semibold text-gray-900 min-w-[120px]">
          {formatTime(lesson.time)}
        </span>
        <span className="font-medium text-gray-800 text-sm">{studentName}</span>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Music className="h-3 w-3" /> {lesson.instrument}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="h-3 w-3" /> {formatDuration(lesson.duration)}
        </span>
        {lesson.topic && (
          <span className="flex items-center gap-1 text-xs text-gray-500 italic">
            <BookOpen className="h-3 w-3" /> {lesson.topic}
          </span>
        )}
      </div>

      {/* Right: status + actions */}
      <div className="flex flex-shrink-0 items-center gap-2">
        {/* Iniciar aula */}
        {lesson.status === 'agendada' && (
          <button
            onClick={() => router.push(`/lesson-mode/${lesson.id}`)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
            title="Iniciar aula"
          >
            <PlayCircle className="h-3.5 w-3.5" />
            Iniciar aula
          </button>
        )}
        {/* Meet link */}
        {studentMeetLink && (
          <a
            href={studentMeetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100"
            title="Entrar na aula"
          >
            <Video className="h-3.5 w-3.5" />
            Entrar na aula
          </a>
        )}
        {/* Status dropdown */}
        <div className="relative">
          <button
            onClick={() => setStatusOpen((v) => !v)}
            className={cn(
              'flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors hover:opacity-80',
              style.pill
            )}
          >
            {style.label}
            <ChevronDown className="h-3 w-3" />
          </button>
          {statusOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[130px] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-card-hover">
                {LESSON_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => {
                      onStatusChange(s.value)
                      setStatusOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-xs font-medium transition-colors hover:bg-gray-50',
                      lesson.status === s.value ? 'text-blue-600' : 'text-gray-700'
                    )}
                  >
                    <div className={cn('h-2 w-2 rounded-full', statusStyle[s.value].dot)} />
                    {s.label}
                    {lesson.status === s.value && <CheckCircle2 className="ml-auto h-3 w-3" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Remarcar */}
        {lesson.status === 'agendada' && (
          <button
            onClick={() => { setRescheduling((v) => !v); setRescheduleError('') }}
            title="Remarcar aula"
            className={cn(
              'rounded-lg p-1.5 text-gray-400 transition-colors opacity-0 group-hover:opacity-100',
              rescheduling ? 'bg-blue-50 text-blue-600' : 'hover:bg-blue-50 hover:text-blue-600'
            )}
          >
            <Calendar className="h-3.5 w-3.5" />
          </button>
        )}
        {/* Edit / Delete */}
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

      {/* Inline reschedule panel */}
      {rescheduling && (
        <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="mb-3 text-xs font-semibold text-blue-800">Remarcar aula — {studentName}</p>
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-blue-700">Nova data</label>
              <input type="date" value={newDate} min={todayISO()}
                onChange={(e) => { setNewDate(e.target.value); setRescheduleError('') }}
                className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-blue-700">Novo horário</label>
              <input type="time" value={newTime}
                onChange={(e) => { setNewTime(e.target.value); setRescheduleError('') }}
                className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={handleRescheduleSave}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
                <CheckCircle2 className="h-3.5 w-3.5" /> Confirmar
              </button>
              <button onClick={() => setRescheduling(false)}
                className="rounded-lg px-3 py-2 text-xs text-gray-500 hover:bg-blue-100 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
          {rescheduleError && <p className="mt-2 text-xs text-red-600">{rescheduleError}</p>}
        </div>
      )}
    </div>
  )
}

// ─── Lesson form ──────────────────────────────────────────────────────────────

interface LessonFormProps {
  form: FormState
  errors: Record<string, string>
  onChange: (patch: Partial<FormState>) => void
  students: { id: string; name: string; instrument: string }[]
}

function LessonForm({ form, errors, onChange, students }: LessonFormProps) {
  return (
    <div className="space-y-4">
      {/* Student */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Aluno *</label>
        <select
          value={form.studentId}
          onChange={(e) => {
            const student = students.find((s) => s.id === e.target.value)
            onChange({
              studentId: e.target.value,
              instrument: student?.instrument ?? form.instrument,
            })
          }}
          className={cn(
            'block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2',
            errors.studentId
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
          )}
        >
          <option value="">Selecione um aluno…</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {errors.studentId && <p className="mt-1.5 text-xs text-red-600">{errors.studentId}</p>}
      </div>

      {/* Date + Time */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Data *"
          type="date"
          value={form.date}
          onChange={(e) => onChange({ date: e.target.value })}
          error={errors.date}
        />
        <Input
          label="Horário *"
          type="time"
          value={form.time}
          onChange={(e) => onChange({ time: e.target.value })}
          error={errors.time}
        />
      </div>

      {/* Duration + Instrument */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Duração</label>
          <select
            value={form.duration}
            onChange={(e) => onChange({ duration: Number(e.target.value) })}
            className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {LESSON_DURATIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

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
          {errors.instrument && <p className="mt-1.5 text-xs text-red-600">{errors.instrument}</p>}
        </div>
      </div>

      {/* Topic */}
      <Input
        label="Tópico da aula"
        placeholder="Ex: Escalas maiores, Sonata em Dó…"
        value={form.topic}
        onChange={(e) => onChange({ topic: e.target.value })}
      />

      {/* Notes */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Observações</label>
        <textarea
          rows={2}
          placeholder="Anotações sobre a aula…"
          value={form.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          className="block w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm placeholder-gray-400 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Status */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Status</label>
        <select
          value={form.status}
          onChange={(e) => onChange({ status: e.target.value as LessonStatus })}
          className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {LESSON_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LessonsPage() {
  const { lessons, create, update, remove } = useLessons()
  const { students } = useStudents()

  const [tab, setTab] = useState<FilterTab>('proximas')
  const [search, setSearch] = useState('')

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Lesson | null>(null)
  const [form, setForm] = useState<FormState>(makeDefaultForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [conflictWarning, setConflictWarning] = useState<string | null>(null)

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null)

  // Student map for lookup
  const studentMap = useMemo(
    () => Object.fromEntries(students.map((s) => [s.id, s])),
    [students]
  )

  // ── Filter lessons ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const today = todayISO()
    const { start, end } = thisWeekRange()

    let base = lessons
    if (tab === 'hoje') base = lessons.filter((l) => l.date === today)
    else if (tab === 'semana') base = lessons.filter((l) => l.date >= start && l.date <= end)
    else if (tab === 'proximas') base = lessons.filter((l) => l.date >= today && l.status === 'agendada')

    if (search.trim()) {
      const q = search.toLowerCase()
      base = base.filter((l) => {
        const name = studentMap[l.studentId]?.name?.toLowerCase() ?? ''
        return name.includes(q) || l.instrument.toLowerCase().includes(q) || l.topic.toLowerCase().includes(q)
      })
    }

    return [...base].sort((a, b) =>
      a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)
    )
  }, [lessons, tab, search, studentMap])

  // ── Group by date ─────────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    const map: Record<string, Lesson[]> = {}
    filtered.forEach((l) => {
      if (!map[l.date]) map[l.date] = []
      map[l.date].push(l)
    })
    return map
  }, [filtered])
  const sortedDates = Object.keys(grouped).sort()

  // ── Tab counts ────────────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const today = todayISO()
    const { start, end } = thisWeekRange()
    return {
      hoje: lessons.filter((l) => l.date === today).length,
      semana: lessons.filter((l) => l.date >= start && l.date <= end).length,
      proximas: lessons.filter((l) => l.date >= today && l.status === 'agendada').length,
      todas: lessons.length,
    }
  }, [lessons])

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openNew = useCallback(() => {
    setEditing(null)
    setForm(makeDefaultForm())
    setErrors({})
    setConflictWarning(null)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((lesson: Lesson) => {
    setEditing(lesson)
    setForm({
      studentId: lesson.studentId,
      date: lesson.date,
      time: lesson.time,
      duration: lesson.duration,
      instrument: lesson.instrument,
      topic: lesson.topic,
      notes: lesson.notes,
      status: lesson.status,
    })
    setErrors({})
    setConflictWarning(null)
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
    // Conflict check
    const conflict = findConflict(lessons, form.date, form.time, form.duration, editing?.id)
    if (conflict) {
      const cName = studentMap[conflict.studentId]?.name ?? 'outro aluno'
      setConflictWarning(`Já existe uma aula nesse horário: ${cName} às ${formatTime(conflict.time)} (${formatDuration(conflict.duration)}).`)
      return
    }
    setConflictWarning(null)
    setSaving(true)
    try {
      const payload = {
        studentId: form.studentId,
        date: form.date,
        time: form.time,
        duration: form.duration,
        instrument: form.instrument,
        topic: form.topic.trim(),
        notes: form.notes.trim(),
        status: form.status,
      }
      if (editing) {
        update(editing.id, payload)
      } else {
        create(payload)
      }
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  function handleDelete() {
    if (!deleteTarget) return
    remove(deleteTarget.id)
    setDeleteTarget(null)
  }

  const studentDeleteName = deleteTarget
    ? (studentMap[deleteTarget.studentId]?.name ?? 'aluno desconhecido')
    : ''

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-8 animate-in">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aulas</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {lessons.length === 0
              ? 'Nenhuma aula cadastrada'
              : `${lessons.length} aula${lessons.length !== 1 ? 's' : ''} no total`}
          </p>
        </div>
        <Button variant="primary" onClick={openNew} disabled={students.length === 0}>
          <Plus className="h-4 w-4" /> Nova Aula
        </Button>
      </div>

      {students.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Cadastre alunos primeiro"
          description="Para criar aulas, você precisa ter pelo menos um aluno cadastrado."
        />
      ) : (
        <>
          {/* Tabs + search */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
              {TABS.map((t) => {
                const count = counts[t.id]
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                      tab === t.id
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    {t.label}
                    {count > 0 && (
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
                          tab === t.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="relative max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Buscar aluno ou tópico…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Lesson list */}
          {filtered.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title={
                tab === 'hoje'
                  ? 'Nenhuma aula hoje'
                  : tab === 'proximas'
                  ? 'Nenhuma aula próxima'
                  : 'Nenhuma aula encontrada'
              }
              description={
                search
                  ? `Nenhum resultado para "${search}".`
                  : tab === 'hoje'
                  ? 'Não há aulas agendadas para hoje.'
                  : tab === 'proximas'
                  ? 'Nenhuma aula futura agendada. Que tal criar uma?'
                  : 'Nenhuma aula nesta seleção.'
              }
              action={
                !search ? (
                  <Button variant="primary" onClick={openNew}>
                    <Plus className="h-4 w-4" /> Nova Aula
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-6">
              {sortedDates.map((date) => (
                <div key={date}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 capitalize">
                    {formatDateHeader(date)}
                  </h3>
                  <div className="space-y-2">
                    {grouped[date].map((lesson) => (
                      <LessonRow
                        key={lesson.id}
                        lesson={lesson}
                        studentName={studentMap[lesson.studentId]?.name ?? 'Aluno desconhecido'}
                        studentMeetLink={studentMap[lesson.studentId]?.meetLink || undefined}
                        onEdit={() => openEdit(lesson)}
                        onDelete={() => setDeleteTarget(lesson)}
                        onStatusChange={(status) => update(lesson.id, { status })}
                        onReschedule={(date, time) => update(lesson.id, { date, time })}
                        allLessons={lessons}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create / Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Aula' : 'Nova Aula'}
        size="md"
      >
        <LessonForm form={form} errors={errors} onChange={(p) => { patchForm(p); setConflictWarning(null) }} students={students} />
        {conflictWarning && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
            <span className="mt-0.5 text-yellow-600">⚠️</span>
            <p className="text-sm text-yellow-800">{conflictWarning}</p>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="outline" onClick={() => setModalOpen(false)}>
            Cancelar
          </Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>
            {editing ? 'Salvar alterações' : 'Agendar aula'}
          </Button>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir aula"
        description={`Tem certeza que deseja excluir a aula de ${studentDeleteName} no dia ${deleteTarget ? new Date(deleteTarget.date + 'T00:00:00').toLocaleDateString('pt-BR') : ''}? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir aula"
      />
    </div>
  )
}
