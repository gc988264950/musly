'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLessons } from '@/hooks/useLessons'
import { useStudents } from '@/hooks/useStudents'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { INSTRUMENTS, LESSON_STATUSES, LESSON_DURATIONS } from '@/lib/db/types'
import type { Lesson, LessonStatus } from '@/lib/db/types'
import { todayISO } from '@/lib/db/lessons'
import { cn } from '@/lib/utils'
import {
  ChevronLeft, ChevronRight, Calendar, Clock, Music,
  BookOpen, Plus, Video, PlayCircle, Pencil, Trash2,
  ChevronDown, CheckCircle2, AlertCircle, X,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const HOUR_START = 6   // 6am
const HOUR_END = 22    // 10pm (exclusive slot at 22:00)
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)

const PT_WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const PT_WEEKDAYS_LONG = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const PT_MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const PT_MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

type ViewMode = 'dia' | 'semana' | 'mes' | 'ano'

const VIEW_TABS: { id: ViewMode; label: string }[] = [
  { id: 'dia', label: 'Dia' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes', label: 'Mês' },
  { id: 'ano', label: 'Ano' },
]

const statusStyle: Record<LessonStatus, { pill: string; dot: string; label: string; border: string }> = {
  agendada:  { pill: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500',  label: 'Agendada',  border: 'border-blue-300' },
  concluída: { pill: 'bg-green-100 text-green-700', dot: 'bg-green-500', label: 'Concluída', border: 'border-green-300' },
  cancelada: { pill: 'bg-gray-100 text-gray-500',   dot: 'bg-gray-400',  label: 'Cancelada', border: 'border-gray-300' },
  falta:     { pill: 'bg-red-100 text-red-600',     dot: 'bg-red-500',   label: 'Falta',     border: 'border-red-300' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISO(d: Date): string {
  return d.toISOString().split('T')[0]
}

function formatTime(time: string): string {
  const [h, m] = time.split(':')
  return `${h}h${m !== '00' ? m : ''}`
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h${m}min`
}

function startOfWeek(d: Date): Date {
  const day = d.getDay()
  const result = new Date(d)
  result.setDate(d.getDate() - day)
  result.setHours(0, 0, 0, 0)
  return result
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d)
  result.setDate(result.getDate() + n)
  return result
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/** Returns true if the date+time combination is in the past. */
function isPast(dateStr: string, timeStr: string): boolean {
  const now = new Date()
  const [h, m] = timeStr.split(':').map(Number)
  const dt = new Date(dateStr + 'T00:00:00')
  dt.setHours(h, m, 0, 0)
  return dt < now
}

function hourFromTime(time: string): number {
  return parseInt(time.split(':')[0], 10)
}

function minuteFromTime(time: string): number {
  return parseInt(time.split(':')[1], 10)
}

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

function makeDefaultForm(date?: string, time?: string): FormState {
  const now = new Date()
  const hh = String(now.getHours() + 1).padStart(2, '0')
  return {
    studentId: '',
    date: date ?? todayISO(),
    time: time ?? `${hh}:00`,
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

// ─── LessonFormFields ─────────────────────────────────────────────────────────

interface LessonFormFieldsProps {
  form: FormState
  errors: Record<string, string>
  onChange: (patch: Partial<FormState>) => void
  students: { id: string; name: string; instrument: string }[]
}

function LessonFormFields({ form, errors, onChange, students }: LessonFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Aluno *</label>
        <select
          value={form.studentId}
          onChange={(e) => {
            const student = students.find((s) => s.id === e.target.value)
            onChange({ studentId: e.target.value, instrument: student?.instrument ?? form.instrument })
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

      <div className="grid grid-cols-2 gap-3">
        <Input label="Data *" type="date" value={form.date} onChange={(e) => onChange({ date: e.target.value })} error={errors.date} />
        <Input label="Horário *" type="time" value={form.time} onChange={(e) => onChange({ time: e.target.value })} error={errors.time} />
      </div>

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

      <Input
        label="Tópico da aula"
        placeholder="Ex: Escalas maiores, Sonata em Dó…"
        value={form.topic}
        onChange={(e) => onChange({ topic: e.target.value })}
      />

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

// ─── Lesson detail card (used in modals) ──────────────────────────────────────

interface LessonDetailProps {
  lesson: Lesson
  studentName: string
  studentColor: string
  studentMeetLink: string
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (s: LessonStatus) => void
  onStartLesson: () => void
}

function LessonDetail({
  lesson, studentName, studentColor, studentMeetLink,
  onEdit, onDelete, onStatusChange, onStartLesson,
}: LessonDetailProps) {
  const [statusOpen, setStatusOpen] = useState(false)
  const style = statusStyle[lesson.status]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: studentColor }} />
        <div>
          <p className="text-lg font-bold text-gray-900">{studentName}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatTime(lesson.time)} · {formatDuration(lesson.duration)}</span>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Data</p>
          <p className="mt-0.5 text-sm font-medium text-gray-800">
            {new Date(lesson.date + 'T00:00:00').toLocaleDateString('pt-BR', {
              weekday: 'short', day: 'numeric', month: 'short',
            })}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Instrumento</p>
          <p className="mt-0.5 text-sm font-medium text-gray-800">{lesson.instrument}</p>
        </div>
        {lesson.topic && (
          <div className="col-span-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Tópico</p>
            <p className="mt-0.5 text-sm font-medium text-gray-800">{lesson.topic}</p>
          </div>
        )}
        {lesson.notes && (
          <div className="col-span-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Observações</p>
            <p className="mt-0.5 text-sm text-gray-700">{lesson.notes}</p>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="relative">
        <button
          onClick={() => setStatusOpen((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-80',
            style.pill
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
          {style.label}
          <ChevronDown className="h-3 w-3" />
        </button>
        {statusOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
            <div className="absolute left-0 top-full z-20 mt-1 min-w-[140px] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-card-hover">
              {LESSON_STATUSES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => { onStatusChange(s.value); setStatusOpen(false) }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors hover:bg-gray-50',
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

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        {lesson.status === 'agendada' && (
          <Button variant="primary" size="sm" onClick={onStartLesson}>
            <PlayCircle className="h-3.5 w-3.5" /> Iniciar aula
          </Button>
        )}
        {studentMeetLink && (
          <a
            href={studentMeetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700 transition-colors hover:bg-green-100"
          >
            <Video className="h-3.5 w-3.5" /> Entrar na aula
          </a>
        )}
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          <Pencil className="h-3.5 w-3.5" /> Editar
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" /> Excluir
        </button>
      </div>
    </div>
  )
}

// ─── Views ────────────────────────────────────────────────────────────────────

interface LessonBlock {
  lesson: Lesson
  student: { id: string; name: string; color: string; meetLink: string }
}

interface DayViewProps {
  dateStr: string
  blocks: LessonBlock[]
  onSlotClick: (date: string, time: string) => void
  onLessonClick: (lesson: Lesson) => void
}

function DayView({ dateStr, blocks, onSlotClick, onLessonClick }: DayViewProps) {
  const SLOT_HEIGHT = 48 // px per hour

  return (
    <div className="relative flex overflow-auto" style={{ maxHeight: '600px' }}>
      {/* Time axis */}
      <div className="flex-shrink-0 w-14 border-r border-gray-100">
        {HOURS.map((h) => (
          <div key={h} style={{ height: SLOT_HEIGHT }} className="flex items-start justify-end pr-3 pt-0.5">
            <span className="text-[10px] font-medium text-gray-400">{String(h).padStart(2, '0')}h</span>
          </div>
        ))}
      </div>

      {/* Day column */}
      <div className="relative flex-1">
        {/* Slot backgrounds */}
        {HOURS.map((h) => {
          const slotTime = `${String(h).padStart(2, '0')}:00`
          const past = isPast(dateStr, slotTime)
          return (
            <div
              key={h}
              onClick={() => {
                if (past) return
                onSlotClick(dateStr, slotTime)
              }}
              style={{ height: SLOT_HEIGHT }}
              className={cn(
                'border-b border-gray-50 transition-colors',
                past ? 'cursor-not-allowed bg-gray-50/60' : 'cursor-pointer hover:bg-[#eef5ff]/50'
              )}
            />
          )
        })}

        {/* Lesson blocks */}
        {blocks.map(({ lesson, student }) => {
          const h = hourFromTime(lesson.time)
          const m = minuteFromTime(lesson.time)
          if (h < HOUR_START || h >= HOUR_END) return null
          const top = (h - HOUR_START) * SLOT_HEIGHT + (m / 60) * SLOT_HEIGHT
          const height = Math.max((lesson.duration / 60) * SLOT_HEIGHT, 20)
          const style = statusStyle[lesson.status]

          return (
            <div
              key={lesson.id}
              onClick={() => onLessonClick(lesson)}
              className={cn(
                'absolute left-1 right-1 overflow-hidden rounded-lg border px-2 py-1 cursor-pointer transition-all hover:brightness-95 hover:shadow-md',
                style.border
              )}
              style={{
                top,
                height,
                backgroundColor: student.color + '22',
                borderColor: student.color + '88',
              }}
            >
              <p className="text-xs font-semibold leading-tight truncate" style={{ color: student.color }}>
                {formatTime(lesson.time)} {student.name}
              </p>
              {height > 28 && (
                <p className="text-[10px] leading-tight text-gray-600 truncate">{lesson.instrument}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface WeekViewProps {
  weekStart: Date
  lessonsByDate: Map<string, LessonBlock[]>
  onSlotClick: (date: string, time: string) => void
  onLessonClick: (lesson: Lesson) => void
}

function WeekView({ weekStart, lessonsByDate, onSlotClick, onLessonClick }: WeekViewProps) {
  const SLOT_HEIGHT = 40
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="flex overflow-auto" style={{ maxHeight: '600px' }}>
      {/* Time axis */}
      <div className="flex-shrink-0 w-12 border-r border-gray-100">
        <div style={{ height: 40 }} /> {/* header spacer */}
        {HOURS.map((h) => (
          <div key={h} style={{ height: SLOT_HEIGHT }} className="flex items-start justify-end pr-2 pt-0.5">
            <span className="text-[10px] font-medium text-gray-400">{String(h).padStart(2, '0')}h</span>
          </div>
        ))}
      </div>

      {/* Day columns */}
      <div className="flex flex-1 min-w-0">
        {days.map((day) => {
          const dayStr = toISO(day)
          const isToday = dayStr === todayISO()
          const blocks = lessonsByDate.get(dayStr) ?? []

          return (
            <div key={dayStr} className="flex-1 min-w-0 border-r border-gray-50 last:border-r-0">
              {/* Day header */}
              <div
                style={{ height: 40 }}
                className={cn(
                  'flex flex-col items-center justify-center border-b border-gray-100 text-center',
                  isToday && 'bg-[#eef5ff]'
                )}
              >
                <span className={cn('text-[10px] font-medium uppercase', isToday ? 'text-[#1a7cfa]' : 'text-gray-400')}>
                  {PT_WEEKDAYS_SHORT[day.getDay()]}
                </span>
                <span
                  className={cn(
                    'text-sm font-bold',
                    isToday
                      ? 'flex h-6 w-6 items-center justify-center rounded-full bg-[#1a7cfa] text-white'
                      : 'text-gray-700'
                  )}
                >
                  {day.getDate()}
                </span>
              </div>

              {/* Slots */}
              <div className="relative">
                {HOURS.map((h) => {
                  const slotTime = `${String(h).padStart(2, '0')}:00`
                  const past = isPast(dayStr, slotTime)
                  return (
                    <div
                      key={h}
                      onClick={() => { if (!past) onSlotClick(dayStr, slotTime) }}
                      style={{ height: SLOT_HEIGHT }}
                      className={cn(
                        'border-b border-gray-50 transition-colors',
                        past ? 'bg-gray-50/50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#eef5ff]/40'
                      )}
                    />
                  )
                })}

                {/* Lesson blocks */}
                {blocks.map(({ lesson, student }) => {
                  const h = hourFromTime(lesson.time)
                  const m = minuteFromTime(lesson.time)
                  if (h < HOUR_START || h >= HOUR_END) return null
                  const top = (h - HOUR_START) * SLOT_HEIGHT + (m / 60) * SLOT_HEIGHT
                  const height = Math.max((lesson.duration / 60) * SLOT_HEIGHT, 18)

                  return (
                    <div
                      key={lesson.id}
                      onClick={() => onLessonClick(lesson)}
                      className="absolute left-0.5 right-0.5 overflow-hidden rounded-md px-1 py-0.5 cursor-pointer transition-all hover:brightness-95 hover:shadow-sm"
                      style={{
                        top,
                        height,
                        backgroundColor: student.color + '33',
                        borderLeft: `2px solid ${student.color}`,
                      }}
                    >
                      <p className="text-[10px] font-semibold leading-tight truncate" style={{ color: student.color }}>
                        {formatTime(lesson.time)}
                      </p>
                      {height > 28 && (
                        <p className="text-[10px] leading-none truncate text-gray-700">{student.name}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface MonthViewProps {
  year: number
  month: number
  lessonsByDate: Map<string, LessonBlock[]>
  onDayClick: (date: string) => void
  onLessonClick: (lesson: Lesson) => void
}

function MonthView({ year, month, lessonsByDate, onDayClick, onLessonClick }: MonthViewProps) {
  const firstDay = new Date(year, month, 1).getDay()
  const totalDays = daysInMonth(year, month)
  const today = todayISO()

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  // Pad to complete weeks
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {PT_WEEKDAYS_SHORT.map((d) => (
          <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase text-gray-400">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) {
            return <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-gray-50 bg-gray-50/30 last:border-r-0" />
          }
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isToday = dateStr === today
          const isPastDay = dateStr < today
          const blocks = lessonsByDate.get(dateStr) ?? []

          return (
            <div
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={cn(
                'min-h-[80px] cursor-pointer border-b border-r border-gray-100 p-1.5 transition-colors last:border-r-0',
                isPastDay ? 'bg-gray-50/40 hover:bg-gray-50' : 'hover:bg-[#eef5ff]/40',
                (i + 1) % 7 === 0 && 'border-r-0'
              )}
            >
              <div className={cn(
                'mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                isToday ? 'bg-[#1a7cfa] text-white' : isPastDay ? 'text-gray-400' : 'text-gray-700'
              )}>
                {day}
              </div>
              <div className="space-y-0.5">
                {blocks.slice(0, 3).map(({ lesson, student }) => (
                  <div
                    key={lesson.id}
                    onClick={(e) => { e.stopPropagation(); onLessonClick(lesson) }}
                    className="truncate rounded px-1 py-0.5 text-[10px] font-medium cursor-pointer hover:brightness-95"
                    style={{ backgroundColor: student.color + '22', color: student.color }}
                  >
                    {formatTime(lesson.time)} {student.name}
                  </div>
                ))}
                {blocks.length > 3 && (
                  <p className="text-[10px] text-gray-400">+{blocks.length - 3} mais</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface YearViewProps {
  year: number
  lessonsByDate: Map<string, LessonBlock[]>
  onMonthClick: (month: number) => void
}

function YearView({ year, lessonsByDate, onMonthClick }: YearViewProps) {
  const today = todayISO()

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 12 }, (_, month) => {
        const totalDays = daysInMonth(year, month)
        const firstDay = new Date(year, month, 1).getDay()
        const cells: (number | null)[] = [
          ...Array(firstDay).fill(null),
          ...Array.from({ length: totalDays }, (_, i) => i + 1),
        ]
        while (cells.length % 7 !== 0) cells.push(null)

        // Count lessons in this month
        const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
        let lessonCount = 0
        Array.from(lessonsByDate.entries()).forEach(([date, blocks]) => {
          if (date.startsWith(monthStr)) lessonCount += blocks.length
        })

        return (
          <div
            key={month}
            onClick={() => onMonthClick(month)}
            className="cursor-pointer rounded-2xl border border-gray-100 p-3 transition-all hover:border-[#b0d2ff] hover:shadow-card"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-700">{PT_MONTHS_SHORT[month]}</p>
              {lessonCount > 0 && (
                <span className="rounded-full bg-[#eef5ff] px-1.5 py-0.5 text-[10px] font-bold text-[#1a7cfa]">
                  {lessonCount}
                </span>
              )}
            </div>

            {/* Mini calendar */}
            <div className="grid grid-cols-7 gap-px">
              {PT_WEEKDAYS_SHORT.map((d) => (
                <div key={d} className="text-center text-[8px] text-gray-300">{d[0]}</div>
              ))}
              {cells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const isToday = dateStr === today
                const hasLessons = (lessonsByDate.get(dateStr) ?? []).length > 0

                return (
                  <div
                    key={day}
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded-full text-[8px]',
                      isToday ? 'bg-[#1a7cfa] font-bold text-white' :
                      hasLessons ? 'bg-[#d6eaff] font-medium text-[#1a7cfa]' :
                      'text-gray-400'
                    )}
                  >
                    {day}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgendaPage() {
  const router = useRouter()
  const { lessons, loading: lessonsLoading, create, update, remove } = useLessons()
  const { students, loading: studentsLoading } = useStudents()

  const loading = lessonsLoading || studentsLoading

  // ── View state ────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('semana')
  const [currentDate, setCurrentDate] = useState(() => new Date())

  // ── Filter state ──────────────────────────────────────────────────────────
  const [filterStudent, setFilterStudent] = useState('')
  const [filterStatus, setFilterStatus] = useState<LessonStatus | ''>('')

  // ── Modal state ───────────────────────────────────────────────────────────
  type ModalMode = 'create' | 'view' | 'edit' | null
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [form, setForm] = useState<FormState>(makeDefaultForm())
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [pastSlotWarning, setPastSlotWarning] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null)

  // ── Helpers ───────────────────────────────────────────────────────────────
  const studentMap = useMemo(() => {
    const m = new Map<string, typeof students[0]>()
    students.forEach((s) => m.set(s.id, s))
    return m
  }, [students])

  const filteredLessons = useMemo(() => {
    return lessons.filter((l) => {
      if (filterStudent && l.studentId !== filterStudent) return false
      if (filterStatus && l.status !== filterStatus) return false
      return true
    })
  }, [lessons, filterStudent, filterStatus])

  const lessonsByDate = useMemo(() => {
    const m = new Map<string, LessonBlock[]>()
    filteredLessons.forEach((lesson) => {
      const student = studentMap.get(lesson.studentId)
      if (!student) return
      const block: LessonBlock = {
        lesson,
        student: {
          id: student.id,
          name: student.name,
          color: student.color,
          meetLink: student.meetLink ?? '',
        },
      }
      const existing = m.get(lesson.date) ?? []
      existing.push(block)
      m.set(lesson.date, existing)
    })
    // Sort by time within each day
    m.forEach((blocks) => blocks.sort((a, b) => a.lesson.time.localeCompare(b.lesson.time)))
    return m
  }, [filteredLessons, studentMap])

  // ── Navigation ────────────────────────────────────────────────────────────
  const navigate = useCallback((dir: -1 | 1) => {
    setCurrentDate((prev) => {
      const d = new Date(prev)
      if (viewMode === 'dia') d.setDate(d.getDate() + dir)
      else if (viewMode === 'semana') d.setDate(d.getDate() + dir * 7)
      else if (viewMode === 'mes') d.setMonth(d.getMonth() + dir)
      else d.setFullYear(d.getFullYear() + dir)
      return d
    })
  }, [viewMode])

  const goToToday = useCallback(() => setCurrentDate(new Date()), [])

  // ── Period label ──────────────────────────────────────────────────────────
  const periodLabel = useMemo(() => {
    if (viewMode === 'dia') {
      const isToday = toISO(currentDate) === todayISO()
      return isToday
        ? 'Hoje, ' + currentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
        : currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    }
    if (viewMode === 'semana') {
      const ws = startOfWeek(currentDate)
      const we = addDays(ws, 6)
      if (ws.getMonth() === we.getMonth()) {
        return `${ws.getDate()}–${we.getDate()} de ${PT_MONTHS[ws.getMonth()]} ${ws.getFullYear()}`
      }
      return `${ws.getDate()} ${PT_MONTHS_SHORT[ws.getMonth()]} – ${we.getDate()} ${PT_MONTHS_SHORT[we.getMonth()]} ${we.getFullYear()}`
    }
    if (viewMode === 'mes') {
      return `${PT_MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    }
    return String(currentDate.getFullYear())
  }, [viewMode, currentDate])

  // ── Slot click (create new lesson) ────────────────────────────────────────
  const handleSlotClick = useCallback((date: string, time: string) => {
    if (isPast(date, time)) {
      setPastSlotWarning(true)
      setTimeout(() => setPastSlotWarning(false), 3000)
      return
    }
    setForm(makeDefaultForm(date, time))
    setFormErrors({})
    setSelectedLesson(null)
    setModalMode('create')
  }, [])

  // ── Day click (month/year view) ───────────────────────────────────────────
  const handleDayClick = useCallback((dateStr: string) => {
    setCurrentDate(new Date(dateStr + 'T00:00:00'))
    setViewMode('dia')
  }, [])

  const handleMonthClick = useCallback((month: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), month, 1))
    setViewMode('mes')
  }, [currentDate])

  // ── Lesson click (view detail) ────────────────────────────────────────────
  const handleLessonClick = useCallback((lesson: Lesson) => {
    setSelectedLesson(lesson)
    setModalMode('view')
  }, [])

  // ── Edit ──────────────────────────────────────────────────────────────────
  const handleEdit = useCallback((lesson: Lesson) => {
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
    setFormErrors({})
    setModalMode('edit')
  }, [])

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const errors = validateForm(form)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    // Block creating lessons in past slots
    if (modalMode === 'create' && isPast(form.date, form.time)) {
      setPastSlotWarning(true)
      setTimeout(() => setPastSlotWarning(false), 3000)
      return
    }

    setSaving(true)
    try {
      if (modalMode === 'create') {
        create(form)
      } else if (modalMode === 'edit' && selectedLesson) {
        update(selectedLesson.id, form)
      }
      setModalMode(null)
    } finally {
      setSaving(false)
    }
  }, [form, modalMode, selectedLesson, create, update])

  // ── Status change ─────────────────────────────────────────────────────────
  const handleStatusChange = useCallback((lesson: Lesson, status: LessonStatus) => {
    update(lesson.id, { status })
    if (selectedLesson?.id === lesson.id) {
      setSelectedLesson({ ...lesson, status })
    }
  }, [update, selectedLesson])

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return
    remove(deleteTarget.id)
    setDeleteTarget(null)
    setModalMode(null)
    setSelectedLesson(null)
  }, [deleteTarget, remove])

  // ── Derived data for views ─────────────────────────────────────────────────
  const dayStr = toISO(currentDate)
  const weekStart = startOfWeek(currentDate)
  const dayBlocks = lessonsByDate.get(dayStr) ?? []

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a7cfa] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col p-6 lg:p-8 animate-in">
      {/* ── Header ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="mt-0.5 text-sm text-gray-500">Visualize e gerencie todas as suas aulas</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => handleSlotClick(todayISO(), `${String(new Date().getHours() + 1).padStart(2, '0')}:00`)}>
          <Plus className="h-3.5 w-3.5" /> Nova aula
        </Button>
      </div>

      {/* ── Past slot warning ── */}
      {pastSlotWarning && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            Não é possível criar uma aula em um horário que já passou.
          </p>
          <button onClick={() => setPastSlotWarning(false)} className="ml-auto text-amber-500 hover:text-amber-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Controls bar ── */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* View mode tabs */}
        <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-0.5">
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                viewMode === tab.id
                  ? 'bg-white text-[#1a7cfa] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goToToday}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
          >
            Hoje
          </button>
          <button
            onClick={() => navigate(1)}
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
            aria-label="Próximo"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Period label */}
        <p className="text-sm font-semibold text-gray-800 capitalize">{periodLabel}</p>

        {/* Filters (pushed right) */}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select
            value={filterStudent}
            onChange={(e) => setFilterStudent(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm focus:border-[#1a7cfa] focus:outline-none focus:ring-2 focus:ring-[#1a7cfa]/20"
          >
            <option value="">Todos os alunos</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as LessonStatus | '')}
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm focus:border-[#1a7cfa] focus:outline-none focus:ring-2 focus:ring-[#1a7cfa]/20"
          >
            <option value="">Todos os status</option>
            {LESSON_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Calendar view ── */}
      <div className="flex-1 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
        {viewMode === 'dia' && (
          <DayView
            dateStr={dayStr}
            blocks={dayBlocks}
            onSlotClick={handleSlotClick}
            onLessonClick={handleLessonClick}
          />
        )}
        {viewMode === 'semana' && (
          <WeekView
            weekStart={weekStart}
            lessonsByDate={lessonsByDate}
            onSlotClick={handleSlotClick}
            onLessonClick={handleLessonClick}
          />
        )}
        {viewMode === 'mes' && (
          <MonthView
            year={currentDate.getFullYear()}
            month={currentDate.getMonth()}
            lessonsByDate={lessonsByDate}
            onDayClick={handleDayClick}
            onLessonClick={handleLessonClick}
          />
        )}
        {viewMode === 'ano' && (
          <div className="p-4">
            <YearView
              year={currentDate.getFullYear()}
              lessonsByDate={lessonsByDate}
              onMonthClick={handleMonthClick}
            />
          </div>
        )}
      </div>

      {/* ── Create / Edit modal ── */}
      <Modal
        isOpen={modalMode === 'create' || modalMode === 'edit'}
        onClose={() => setModalMode(null)}
        title={modalMode === 'create' ? 'Nova aula' : 'Editar aula'}
      >
        <LessonFormFields
          form={form}
          errors={formErrors}
          onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
          students={students.map((s) => ({ id: s.id, name: s.name, instrument: s.instrument }))}
        />
        <div className="mt-5 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="outline" onClick={() => setModalMode(null)}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando…' : modalMode === 'create' ? 'Agendar aula' : 'Salvar alterações'}
          </Button>
        </div>
      </Modal>

      {/* ── Lesson detail modal ── */}
      {selectedLesson && (
        <Modal
          isOpen={modalMode === 'view'}
          onClose={() => setModalMode(null)}
          title="Detalhes da aula"
        >
          {(() => {
            const student = studentMap.get(selectedLesson.studentId)
            if (!student) return null
            return (
              <LessonDetail
                lesson={selectedLesson}
                studentName={student.name}
                studentColor={student.color}
                studentMeetLink={student.meetLink ?? ''}
                onEdit={() => handleEdit(selectedLesson)}
                onDelete={() => { setDeleteTarget(selectedLesson); setModalMode(null) }}
                onStatusChange={(s) => handleStatusChange(selectedLesson, s)}
                onStartLesson={() => router.push(`/lesson-mode/${selectedLesson.id}`)}
              />
            )
          })()}
        </Modal>
      )}

      {/* ── Delete confirmation ── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir aula"
        description="Tem certeza que deseja excluir esta aula? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
      />
    </div>
  )
}
