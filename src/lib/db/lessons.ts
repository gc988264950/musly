import { readCollection, upsertItem, removeItem, removeManyWhere } from './storage'
import type { Lesson, CreateLessonInput, UpdateLessonInput } from './types'

const KEY = 'harmoniq_lessons'

// Normalize records that predate newer fields (backwards compatibility)
function normalize(l: Lesson): Lesson {
  const raw = l as unknown as Record<string, unknown>
  return {
    ...l,
    performanceTags: Array.isArray(raw.performanceTags) ? (raw.performanceTags as string[]) : [],
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
