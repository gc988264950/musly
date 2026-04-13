import { readCollection, upsertItem, removeItem, removeManyWhere } from './storage'
import type { Lesson, CreateLessonInput, UpdateLessonInput } from './types'

const KEY = 'harmoniq_lessons'

// Normalize records that predate newer fields (backwards compatibility)
function normalize(l: Lesson): Lesson {
  const raw = l as unknown as Record<string, unknown>
  return {
    ...l,
    performanceTags: Array.isArray(raw.performanceTags) ? (raw.performanceTags as string[]) : [],
    homework: typeof raw.homework === 'string' ? raw.homework : '',
    homeworkSentAt: (raw.homeworkSentAt as string | null) ?? null,
    scheduleGroupId: typeof raw.scheduleGroupId === 'string' ? raw.scheduleGroupId : '',
  }
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

/** Monday–Sunday of the current week (Brazilian convention). */
export function thisWeekRange(): { start: string; end: string } {
  const now = new Date()
  const day = now.getDay() // 0 = Sunday
  const daysFromMonday = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - daysFromMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  }
}

// ─── Queries ─────────────────────────────────────────────────────────────────
// TODO (Supabase): Replace bodies with supabase.from('lessons').select(...)

export function getLessons(teacherId: string): Lesson[] {
  return readCollection<Lesson>(KEY).filter((l) => l.teacherId === teacherId).map(normalize)
}

export function getLessonById(id: string): Lesson | null {
  const l = readCollection<Lesson>(KEY).find((l) => l.id === id)
  return l ? normalize(l) : null
}

export function getTodayLessons(teacherId: string): Lesson[] {
  const today = todayISO()
  return getLessons(teacherId)
    .filter((l) => l.date === today)
    .sort((a, b) => a.time.localeCompare(b.time))
}

export function getThisWeekLessons(teacherId: string): Lesson[] {
  const { start, end } = thisWeekRange()
  return getLessons(teacherId).filter((l) => l.date >= start && l.date <= end)
}

export function getUpcomingLessons(teacherId: string): Lesson[] {
  const today = todayISO()
  return getLessons(teacherId)
    .filter((l) => l.date >= today && l.status === 'agendada')
    .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)))
}

export function getLessonsByStudent(studentId: string): Lesson[] {
  return readCollection<Lesson>(KEY).filter((l) => l.studentId === studentId)
}

/** Returns the next upcoming lesson date for a student (for the student card). */
export function getNextLessonForStudent(studentId: string): Lesson | null {
  const today = todayISO()
  const upcoming = readCollection<Lesson>(KEY)
    .filter((l) => l.studentId === studentId && l.date >= today && l.status === 'agendada')
    .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)))
  return upcoming[0] ?? null
}

// ─── Mutations ───────────────────────────────────────────────────────────────
// TODO (Supabase): Replace bodies with supabase.from('lessons').insert / .update / .delete

export function createLesson(data: CreateLessonInput): Lesson {
  const now = new Date().toISOString()
  const lesson: Lesson = {
    performanceTags: [],
    homework: '',
    homeworkSentAt: null,
    scheduleGroupId: '',
    ...data,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }
  return upsertItem(KEY, lesson)
}

export function updateLesson(id: string, data: UpdateLessonInput): Lesson {
  const existing = readCollection<Lesson>(KEY).find((l) => l.id === id)
  if (!existing) throw new Error('Aula não encontrada.')
  const updated: Lesson = { ...existing, ...data, updatedAt: new Date().toISOString() }
  return upsertItem(KEY, updated)
}

export function deleteLesson(id: string): void {
  removeItem<Lesson>(KEY, id)
}

/** Cascade-delete all lessons for a student (called when deleting a student). */
export function deleteLessonsByStudent(studentId: string): void {
  removeManyWhere<Lesson>(KEY, (l) => l.studentId === studentId)
}

/**
 * Generate recurring lessons for a new student with a schedule.
 * @param days  Array of weekday numbers (0=Sun, 1=Mon … 6=Sat)
 * @param startDate  "YYYY-MM-DD" — first possible lesson date (usually today)
 * @param endDate    "YYYY-MM-DD" — last possible lesson date (contract end)
 * @returns number of lessons created
 */
export function generateRecurringLessons(data: {
  teacherId: string
  studentId: string
  instrument: string
  days: number[]
  time: string
  duration: number
  startDate: string
  endDate: string
  scheduleGroupId: string
}): number {
  if (data.days.length === 0 || !data.time || data.duration === 0) return 0

  const end = new Date(data.endDate + 'T00:00:00')
  let count = 0
  const cursor = new Date(data.startDate + 'T00:00:00')

  while (cursor <= end) {
    if (data.days.includes(cursor.getDay())) {
      createLesson({
        teacherId: data.teacherId,
        studentId: data.studentId,
        date: cursor.toISOString().split('T')[0],
        time: data.time,
        duration: data.duration,
        instrument: data.instrument,
        topic: '',
        notes: '',
        status: 'agendada',
        scheduleGroupId: data.scheduleGroupId,
      })
      count++
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
}
