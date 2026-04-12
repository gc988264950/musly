'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, X, Clock, User, Music, Save, CalendarDays } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { LESSON_STATUSES, LESSON_DURATIONS } from '@/lib/db/types'
import type { Lesson, Student, LessonStatus, UpdateLessonInput } from '@/lib/db/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const HOUR_START = 8       // 08:00
const HOUR_END   = 22      // 22:00 (last row label = 22:00, lessons up to ~21:30+)
const TOTAL_HOURS = HOUR_END - HOUR_START   // 14
const ROW_H = 56           // px per hour
const GRID_H = TOTAL_HOURS * ROW_H          // 784px
const GUTTER_W = 52        // time label column width in px

const DAY_NAMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const DAY_NAMES_FULL = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

const STATUS_STYLE: Record<LessonStatus, { ring: string; opacity: string }> = {
  agendada:  { ring: 'ring-1 ring-inset ring-white/30', opacity: 'opacity-100' },
  concluída: { ring: 'ring-1 ring-inset ring-white/20', opacity: 'opacity-75' },
  cancelada: { ring: 'ring-1 ring-inset ring-white/20', opacity: 'opacity-40' },
  falta:     { ring: 'ring-1 ring-inset ring-white/20', opacity: 'opacity-50' },
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day   // Monday = 0 offset
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

function formatHeaderDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

function formatMonthYear(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6)
  const sm = weekStart.toLocaleDateString('pt-BR', { month: 'long' })
  const em = weekEnd.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  if (sm === weekEnd.toLocaleDateString('pt-BR', { month: 'long' })) {
    return weekStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }
  return `${sm.slice(0, 3)} – ${em}`
}

// ─── Lesson positioning ───────────────────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function lessonTop(time: string): number {
  const minutes = timeToMinutes(time) - HOUR_START * 60
  return (minutes / 60) * ROW_H
}

function lessonHeight(duration: number): number {
  return Math.max(24, (duration / 60) * ROW_H)
}

// ─── Color helpers ────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

function isDark(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) < 160
}

// ─── Lesson detail / quick-edit modal ────────────────────────────────────────

interface LessonModalProps {
  lesson: Lesson
  student: Student | undefined
  onClose: () => void
  onSave: (id: string, data: UpdateLessonInput) => void
}

function LessonModal({ lesson, student, onClose, onSave }: LessonModalProps) {
  const [editing, setEditing] = useState(false)
  const [time, setTime] = useState(lesson.time)
  const [duration, setDuration] = useState(lesson.duration)
  const [status, setStatus] = useState<LessonStatus>(lesson.status)
  const [saving, setSaving] = useState(false)

  function handleSave() {
    setSaving(true)
    try {
      onSave(lesson.id, { time, duration, status })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const color = student?.color ?? '#6366f1'
  const [r, g, b] = hexToRgb(color)

  const dateLabel = new Date(lesson.date + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header strip */}
        <div
          className="px-5 py-4"
          style={{ backgroundColor: color }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className={cn('text-xs font-semibold uppercase tracking-wide', isDark(color) ? 'text-white/70' : 'text-black/60')}>
                {dateLabel}
              </p>
              <p className={cn('mt-0.5 text-xl font-bold', isDark(color) ? 'text-white' : 'text-gray-900')}>
                {student?.name ?? 'Aluno desconhecido'}
              </p>
              <p className={cn('text-sm', isDark(color) ? 'text-white/80' : 'text-black/70')}>
                {lesson.time} · {lesson.instrument}
              </p>
            </div>
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold', isDark(color) ? 'bg-white/20 text-white' : 'bg-black/10 text-gray-800')}>
              {getInitials(student?.name ?? '?')}
            </div>
          </div>
          <button
            onClick={onClose}
            className={cn('absolute right-3 top-3 rounded-lg p-1.5 transition-colors', isDark(color) ? 'text-white/60 hover:bg-white/20 hover:text-white' : 'text-black/40 hover:bg-black/10')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          {!editing ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Horário</p>
                  <p className="mt-0.5 text-sm font-medium text-gray-800">{lesson.time}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Duração</p>
                  <p className="mt-0.5 text-sm font-medium text-gray-800">
                    {lesson.duration < 60
                      ? `${lesson.duration} min`
                      : `${Math.floor(lesson.duration / 60)}h${lesson.duration % 60 ? ` ${lesson.duration % 60}min` : ''}`}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Status</p>
                  <p className="mt-0.5 text-sm font-medium text-gray-800 capitalize">{lesson.status}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Nível</p>
                  <p className="mt-0.5 text-sm font-medium text-gray-800">{student?.level ?? '—'}</p>
                </div>
              </div>
              {lesson.topic && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Tópico</p>
                  <p className="mt-0.5 text-sm text-gray-700">{lesson.topic}</p>
                </div>
              )}
              {lesson.notes && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Observações</p>
                  <p className="mt-0.5 text-sm text-gray-700">{lesson.notes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setEditing(true)}
                  className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Editar horário
                </button>
                <button
                  onClick={onClose}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-50"
                >
                  Fechar
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Horário</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Duração</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="block w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {LESSON_DURATIONS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LessonStatus)}
                  className="block w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {LESSON_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="primary" loading={saving} onClick={handleSave} className="flex-1">
                  <Save size={13} /> Salvar
                </Button>
                <button
                  onClick={() => setEditing(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Lesson block ─────────────────────────────────────────────────────────────

interface LessonBlockProps {
  lesson: Lesson
  student: Student | undefined
  colWidth: number
  onClick: () => void
}

function LessonBlock({ lesson, student, colWidth, onClick }: LessonBlockProps) {
  const color = student?.color ?? '#6366f1'
  const top = lessonTop(lesson.time)
  const height = lessonHeight(lesson.duration)
  const { ring, opacity } = STATUS_STYLE[lesson.status]
  const textColor = isDark(color) ? 'text-white' : 'text-gray-900'
  const subColor  = isDark(color) ? 'text-white/70' : 'text-black/60'
  const compact   = height < 48

  // Clamp so lesson doesn't overflow past HOUR_END
  const maxTop = (TOTAL_HOURS * ROW_H) - 20
  const clampedTop = Math.min(top, maxTop)

  return (
    <button
      onClick={onClick}
      className={cn(
        'absolute left-0.5 right-0.5 overflow-hidden rounded-lg px-1.5 text-left transition-all duration-150 hover:brightness-110 hover:shadow-md active:scale-[0.98]',
        ring,
        opacity
      )}
      style={{
        top: clampedTop,
        height,
        backgroundColor: color,
        zIndex: 10,
      }}
    >
      {compact ? (
        <p className={cn('truncate text-[10px] font-semibold leading-tight', textColor)}>
          {lesson.time} {student?.name ?? '?'}
        </p>
      ) : (
        <>
          <p className={cn('truncate text-[11px] font-bold leading-tight', textColor)}>
            {student?.name ?? 'Aluno'}
          </p>
          <p className={cn('truncate text-[10px] leading-tight', subColor)}>
            {lesson.time} · {lesson.duration < 60 ? `${lesson.duration}min` : `${lesson.duration / 60}h`}
          </p>
        </>
      )}
    </button>
  )
}

// ─── Main calendar component ──────────────────────────────────────────────────

interface WeeklyCalendarProps {
  lessons: Lesson[]
  students: Student[]
  onUpdate: (id: string, data: UpdateLessonInput) => void
}

export function WeeklyCalendar({ lessons, students, onUpdate }: WeeklyCalendarProps) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Build array of 7 dates for current week (Mon–Sun)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = todayISO()

  // Scroll to ~current time (or 8am) on mount
  useEffect(() => {
    if (!scrollRef.current) return
    const now = new Date()
    const h = now.getHours()
    const target = Math.max(0, (h - HOUR_START - 1) * ROW_H)
    scrollRef.current.scrollTop = target
  }, [])

  // Build student lookup map
  const studentMap = new Map<string, Student>(students.map((s) => [s.id, s]))

  // Filter lessons to current week, grouped by date string
  const lessonsByDate = new Map<string, Lesson[]>()
  weekDays.forEach((d) => lessonsByDate.set(toISO(d), []))
  lessons.forEach((l) => {
    if (lessonsByDate.has(l.date)) {
      lessonsByDate.get(l.date)!.push(l)
    }
  })

  function goToPrevWeek() {
    setWeekStart((d) => addDays(d, -7))
  }
  function goToNextWeek() {
    setWeekStart((d) => addDays(d, 7))
  }
  function goToThisWeek() {
    setWeekStart(getWeekStart(new Date()))
  }

  const isThisWeek = toISO(weekStart) === toISO(getWeekStart(new Date()))

  // Hour labels for the gutter
  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => HOUR_START + i)

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-card overflow-hidden">
      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Agenda semanal</h2>
          <span className="hidden text-sm text-gray-400 sm:inline capitalize">
            — {formatMonthYear(weekStart)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {!isThisWeek && (
            <button
              onClick={goToThisWeek}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
            >
              Hoje
            </button>
          )}
          <button
            onClick={goToPrevWeek}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100"
            aria-label="Semana anterior"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={goToNextWeek}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100"
            aria-label="Próxima semana"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* ── Day headers ────────────────────────────────────────────────────── */}
      <div
        className="grid border-b border-gray-100 bg-gray-50/50"
        style={{ gridTemplateColumns: `${GUTTER_W}px repeat(7, 1fr)` }}
      >
        {/* Empty gutter header */}
        <div className="border-r border-gray-100" />
        {weekDays.map((day, i) => {
          const iso = toISO(day)
          const isToday = iso === today
          const dayLessons = lessonsByDate.get(iso) ?? []
          return (
            <div
              key={iso}
              className={cn(
                'flex flex-col items-center py-2.5 text-center',
                i < 6 && 'border-r border-gray-100'
              )}
            >
              <p className={cn('text-[10px] font-semibold uppercase tracking-wide',
                isToday ? 'text-blue-600' : 'text-gray-400'
              )}>
                {DAY_NAMES[i]}
              </p>
              <div className={cn(
                'mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold transition-colors',
                isToday
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700'
              )}>
                {day.getDate()}
              </div>
              {dayLessons.length > 0 && (
                <span className={cn(
                  'mt-0.5 rounded-full px-1.5 text-[9px] font-bold',
                  isToday ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                )}>
                  {dayLessons.length}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Scrollable grid ─────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="overflow-y-auto"
        style={{ maxHeight: 480 }}
      >
        <div
          className="relative grid"
          style={{
            gridTemplateColumns: `${GUTTER_W}px repeat(7, 1fr)`,
            height: GRID_H,
          }}
        >
          {/* Hour lines (full-width background stripes) */}
          {hours.map((h) => (
            <div
              key={h}
              className="pointer-events-none absolute left-0 right-0 border-t border-gray-100"
              style={{ top: (h - HOUR_START) * ROW_H }}
            />
          ))}

          {/* Half-hour faint lines */}
          {hours.slice(0, -1).map((h) => (
            <div
              key={`${h}-half`}
              className="pointer-events-none absolute left-0 right-0 border-t border-gray-50"
              style={{ top: (h - HOUR_START) * ROW_H + ROW_H / 2 }}
            />
          ))}

          {/* Current time indicator */}
          {isThisWeek && (() => {
            const now = new Date()
            const nowMins = now.getHours() * 60 + now.getMinutes()
            const startMins = HOUR_START * 60
            const endMins = HOUR_END * 60
            if (nowMins < startMins || nowMins > endMins) return null
            const topPx = ((nowMins - startMins) / 60) * ROW_H
            const todayIndex = weekDays.findIndex((d) => toISO(d) === today)
            if (todayIndex < 0) return null
            return (
              <div
                className="pointer-events-none absolute z-20"
                style={{
                  top: topPx - 1,
                  left: `calc(${GUTTER_W}px + ${todayIndex} * (100% - ${GUTTER_W}px) / 7)`,
                  width: `calc((100% - ${GUTTER_W}px) / 7)`,
                }}
              >
                <div className="flex items-center">
                  <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-red-500 -ml-1.5" />
                  <div className="h-px flex-1 bg-red-400" />
                </div>
              </div>
            )
          })()}

          {/* Time gutter */}
          <div className="relative border-r border-gray-100">
            {hours.map((h) => (
              <div
                key={h}
                className="absolute right-2 text-[10px] font-medium text-gray-300"
                style={{ top: (h - HOUR_START) * ROW_H - 7 }}
              >
                {String(h).padStart(2, '0')}h
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, i) => {
            const iso = toISO(day)
            const isToday = iso === today
            const dayLessons = lessonsByDate.get(iso) ?? []

            return (
              <div
                key={iso}
                className={cn(
                  'relative',
                  i < 6 && 'border-r border-gray-100',
                  isToday && 'bg-blue-50/20'
                )}
              >
                {dayLessons
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((lesson) => (
                    <LessonBlock
                      key={lesson.id}
                      lesson={lesson}
                      student={studentMap.get(lesson.studentId)}
                      colWidth={0}
                      onClick={() => setSelectedLesson(lesson)}
                    />
                  ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Empty state */}
      {lessons.length === 0 && (
        <div className="flex flex-col items-center justify-center border-t border-gray-100 py-10 text-center">
          <CalendarDays className="mx-auto mb-2 h-8 w-8 text-gray-200" />
          <p className="text-sm text-gray-400">Nenhuma aula nesta semana</p>
          <p className="mt-0.5 text-xs text-gray-300">Agende aulas na seção "Aulas"</p>
        </div>
      )}

      {/* Lesson detail modal */}
      {selectedLesson && (
        <LessonModal
          lesson={selectedLesson}
          student={studentMap.get(selectedLesson.studentId)}
          onClose={() => setSelectedLesson(null)}
          onSave={(id, data) => {
            onUpdate(id, data)
            setSelectedLesson(null)
          }}
        />
      )}
    </div>
  )
}
