'use client'

import { useState, useMemo, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, Video, VideoOff, User, Calendar, Clock, Music, FileText, Info } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { INSTRUMENTS, LESSON_DURATIONS } from '@/lib/db/types'
import type { Lesson, LessonStatus } from '@/lib/db/types'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const HOUR_START = 7
const HOUR_END = 22   // exclusive (shows 07:00 through 21:00)
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)

const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function toISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

function todayISO(): string {
  return toISO(new Date())
}

function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  const from = monday.toLocaleDateString('pt-BR', opts)
  const to = sunday.toLocaleDateString('pt-BR', opts)
  return `${from} – ${to}`
}

function padTime(h: number, m = 0): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentInfo {
  id: string
  name: string
  instrument: string
  color: string
  meetLink: string
}

interface CalendarLesson extends Lesson {
  studentName: string
  studentColor: string
  studentMeetLink: string
}

interface CreateFormState {
  studentId: string
  date: string
  time: string
  duration: number
  instrument: string
  topic: string
  notes: string
  status: LessonStatus
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SimpleWeeklyCalendarProps {
  lessons: Lesson[]
  students: StudentInfo[]
  onCreate: (data: CreateFormState) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  agendada: 'Agendada',
  concluída: 'Concluída',
  cancelada: 'Cancelada',
  falta: 'Falta',
}

const STATUS_COLORS: Record<string, string> = {
  agendada: 'bg-blue-100 text-blue-700',
  concluída: 'bg-green-100 text-green-700',
  cancelada: 'bg-gray-100 text-gray-500',
  falta: 'bg-red-100 text-red-600',
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}min`
}

export function SimpleWeeklyCalendar({ lessons, students, onCreate }: SimpleWeeklyCalendarProps) {
  const [monday, setMonday] = useState(() => getMonday(new Date()))
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<CreateFormState | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // Detail modal state
  const [detailLesson, setDetailLesson] = useState<CalendarLesson | null>(null)
  const [noMeetWarning, setNoMeetWarning] = useState(false)

  // Compute week days
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(monday, i)),
    [monday]
  )

  // Index lessons by date+hour
  const lessonsByCell = useMemo(() => {
    const map: Record<string, CalendarLesson[]> = {}
    lessons.forEach((l) => {
      const hour = parseInt(l.time.split(':')[0], 10)
      if (hour < HOUR_START || hour >= HOUR_END) return
      const key = `${l.date}-${hour}`
      const student = students.find((s) => s.id === l.studentId)
      const entry: CalendarLesson = {
        ...l,
        studentName: student?.name ?? 'Aluno',
        studentColor: student?.color ?? '#6366f1',
        studentMeetLink: student?.meetLink ?? '',
      }
      if (!map[key]) map[key] = []
      map[key].push(entry)
    })
    return map
  }, [lessons, students])

  const today = todayISO()

  const openCreateModal = useCallback(
    (date: string, hour: number) => {
      const firstStudent = students[0]
      setForm({
        studentId: firstStudent?.id ?? '',
        date,
        time: padTime(hour),
        duration: 60,
        instrument: firstStudent?.instrument ?? '',
        topic: '',
        notes: '',
        status: 'agendada',
      })
      setErrors({})
      setModalOpen(true)
    },
    [students]
  )

  function patchForm(patch: Partial<CreateFormState>) {
    setForm((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  function validate(f: CreateFormState): Record<string, string> {
    const e: Record<string, string> = {}
    if (!f.studentId) e.studentId = 'Selecione um aluno'
    if (!f.instrument) e.instrument = 'Selecione o instrumento'
    return e
  }

  function handleSave() {
    if (!form) return
    const e = validate(form)
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({})
    setSaving(true)
    try {
      onCreate(form)
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">Calendário Semanal</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{formatWeekRange(monday)}</span>
          <div className="flex gap-1">
            <button
              onClick={() => setMonday((m) => addDays(m, -7))}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label="Semana anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setMonday(getMonday(new Date()))}
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              Hoje
            </button>
            <button
              onClick={() => setMonday((m) => addDays(m, 7))}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label="Próxima semana"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-card">
        <div className="min-w-[640px]">
          {/* Day headers */}
          <div className="grid" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
            <div className="border-b border-gray-100 bg-gray-50" />
            {weekDays.map((day, i) => {
              const iso = toISO(day)
              const isToday = iso === today
              return (
                <div
                  key={iso}
                  className={cn(
                    'border-b border-l border-gray-100 bg-gray-50 py-2 text-center',
                    isToday && 'bg-blue-50'
                  )}
                >
                  <p className={cn('text-[11px] font-medium text-gray-400', isToday && 'text-blue-500')}>
                    {DAY_LABELS[i]}
                  </p>
                  <p className={cn('text-sm font-bold text-gray-700', isToday && 'text-blue-700')}>
                    {day.getDate()}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Time rows */}
          <div className="max-h-80 overflow-y-auto">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="grid"
                style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}
              >
                {/* Hour label */}
                <div className="flex items-start justify-end border-b border-gray-50 pr-2 pt-1.5">
                  <span className="text-[10px] text-gray-300">{padTime(hour)}</span>
                </div>

                {/* Day cells */}
                {weekDays.map((day) => {
                  const iso = toISO(day)
                  const key = `${iso}-${hour}`
                  const cellLessons = lessonsByCell[key] ?? []
                  const isToday = iso === today
                  const isPast = iso < today

                  return (
                    <div
                      key={iso}
                      onClick={() => !isPast && openCreateModal(iso, hour)}
                      className={cn(
                        'group relative min-h-[40px] border-b border-l border-gray-50 p-1 transition-colors',
                        isToday && 'bg-blue-50/30',
                        !isPast && cellLessons.length === 0 && 'cursor-pointer hover:bg-gray-50'
                      )}
                    >
                      {/* Add icon on hover when empty */}
                      {cellLessons.length === 0 && !isPast && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Plus size={12} className="text-gray-300" />
                        </div>
                      )}

                      {/* Lesson chips */}
                      {cellLessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            setNoMeetWarning(false)
                            setDetailLesson(lesson)
                          }}
                          className="mb-0.5 flex w-full items-center gap-1 rounded px-1.5 py-0.5 text-left text-[11px] font-medium text-white transition-opacity hover:opacity-85"
                          style={{ backgroundColor: lesson.studentColor }}
                          title={`${lesson.studentName} — ${lesson.time} (${lesson.duration}min)`}
                        >
                          <span className="truncate">{lesson.studentName}</span>
                          <span className="flex-shrink-0 opacity-75">{lesson.time}</span>
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lesson detail modal */}
      {detailLesson && (
        <Modal
          isOpen={!!detailLesson}
          onClose={() => { setDetailLesson(null); setNoMeetWarning(false) }}
          title="Detalhes da Aula"
          size="sm"
        >
          {/* Color bar */}
          <div className="mb-4 h-1 w-full rounded-full" style={{ backgroundColor: detailLesson.studentColor }} />

          {/* Info rows */}
          <dl className="space-y-3">
            <div className="flex items-start gap-3">
              <User size={15} className="mt-0.5 flex-shrink-0 text-gray-400" />
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Aluno</dt>
                <dd className="text-sm font-semibold text-gray-900">{detailLesson.studentName}</dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar size={15} className="mt-0.5 flex-shrink-0 text-gray-400" />
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Data</dt>
                <dd className="text-sm text-gray-800 capitalize">{formatDate(detailLesson.date)}</dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock size={15} className="mt-0.5 flex-shrink-0 text-gray-400" />
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Horário e duração</dt>
                <dd className="text-sm text-gray-800">
                  {detailLesson.time} &middot; {formatDuration(detailLesson.duration)}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Music size={15} className="mt-0.5 flex-shrink-0 text-gray-400" />
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Instrumento</dt>
                <dd className="text-sm text-gray-800">{detailLesson.instrument}</dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Info size={15} className="mt-0.5 flex-shrink-0 text-gray-400" />
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Status</dt>
                <dd>
                  <span className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    STATUS_COLORS[detailLesson.status] ?? 'bg-gray-100 text-gray-600'
                  )}>
                    {STATUS_LABELS[detailLesson.status] ?? detailLesson.status}
                  </span>
                </dd>
              </div>
            </div>

            {detailLesson.topic && (
              <div className="flex items-start gap-3">
                <FileText size={15} className="mt-0.5 flex-shrink-0 text-gray-400" />
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Tópico</dt>
                  <dd className="text-sm text-gray-800">{detailLesson.topic}</dd>
                </div>
              </div>
            )}

            {detailLesson.notes && (
              <div className="flex items-start gap-3">
                <FileText size={15} className="mt-0.5 flex-shrink-0 text-gray-400" />
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Observações</dt>
                  <dd className="text-sm text-gray-700 whitespace-pre-wrap">{detailLesson.notes}</dd>
                </div>
              </div>
            )}
          </dl>

          {/* No Meet warning */}
          {noMeetWarning && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <VideoOff size={15} className="flex-shrink-0" />
              Este aluno não possui link do Google Meet cadastrado.
            </div>
          )}

          {/* Footer actions */}
          <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
            <Button variant="outline" onClick={() => { setDetailLesson(null); setNoMeetWarning(false) }}>
              Fechar
            </Button>
            {detailLesson.studentMeetLink ? (
              <a
                href={detailLesson.studentMeetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
              >
                <Video size={15} />
                Entrar no Google Meet
              </a>
            ) : (
              <button
                onClick={() => setNoMeetWarning(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-200"
              >
                <Video size={15} />
                Entrar no Google Meet
              </button>
            )}
          </div>
        </Modal>
      )}

      {/* Create lesson modal */}
      {form && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Nova Aula"
          size="sm"
        >
          <div className="space-y-4">
            {/* Student */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Aluno *</label>
              <select
                value={form.studentId}
                onChange={(e) => {
                  const student = students.find((s) => s.id === e.target.value)
                  patchForm({ studentId: e.target.value, instrument: student?.instrument ?? form.instrument })
                }}
                className={cn(
                  'block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2',
                  errors.studentId
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                )}
              >
                <option value="">Selecione…</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {errors.studentId && <p className="mt-1 text-xs text-red-600">{errors.studentId}</p>}
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Data"
                type="date"
                value={form.date}
                onChange={(e) => patchForm({ date: e.target.value })}
              />
              <Input
                label="Horário"
                type="time"
                value={form.time}
                onChange={(e) => patchForm({ time: e.target.value })}
              />
            </div>

            {/* Duration */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Duração</label>
              <select
                value={form.duration}
                onChange={(e) => patchForm({ duration: Number(e.target.value) })}
                className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {LESSON_DURATIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            {/* Instrument */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Instrumento *</label>
              <select
                value={form.instrument}
                onChange={(e) => patchForm({ instrument: e.target.value })}
                className={cn(
                  'block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2',
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
              {errors.instrument && <p className="mt-1 text-xs text-red-600">{errors.instrument}</p>}
            </div>

            {/* Topic */}
            <Input
              label="Tópico"
              placeholder="Ex: Escalas maiores…"
              value={form.topic}
              onChange={(e) => patchForm({ topic: e.target.value })}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              Agendar aula
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}
