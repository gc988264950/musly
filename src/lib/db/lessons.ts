import { createClient } from '@/lib/supabase/client'
import type { Lesson, CreateLessonInput, UpdateLessonInput } from './types'

// ─── Row mappers ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(r: any): Lesson {
  return {
    id:              r.id,
    teacherId:       r.teacher_id,
    studentId:       r.student_id,
    date:            r.date,
    time:            r.time,
    duration:        r.duration        ?? 60,
    instrument:      r.instrument      ?? '',
    topic:           r.topic           ?? '',
    notes:           r.notes           ?? '',
    status:          r.status          ?? 'agendada',
    performanceTags: r.performance_tags ?? [],
    homework:          r.homework           ?? '',
    homeworkSentAt:    r.homework_sent_at   ?? null,
    homeworkCompleted: r.homework_completed ?? false,
    scheduleGroupId: r.schedule_group_id ?? '',
    createdAt:       r.created_at,
    updatedAt:       r.updated_at,
  }
}

function toRow(l: Lesson) {
  return {
    id:                l.id,
    teacher_id:        l.teacherId,
    student_id:        l.studentId,
    date:              l.date,
    time:              l.time,
    duration:          l.duration,
    instrument:        l.instrument,
    topic:             l.topic,
    notes:             l.notes,
    status:            l.status,
    performance_tags:   l.performanceTags,
    homework:           l.homework,
    homework_sent_at:   l.homeworkSentAt,
    homework_completed: l.homeworkCompleted,
    schedule_group_id:  l.scheduleGroupId,
    created_at:        l.createdAt,
    updated_at:        l.updatedAt,
  }
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function thisWeekRange(): { start: string; end: string } {
  const now = new Date()
  const day = now.getDay()
  const daysFromMonday = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - daysFromMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    start: monday.toISOString().split('T')[0],
    end:   sunday.toISOString().split('T')[0],
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getLessons(teacherId: string): Promise<Lesson[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lessons')
    .select()
    .eq('teacher_id', teacherId)
    .order('date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function getLessonById(id: string): Promise<Lesson | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lessons')
    .select()
    .eq('id', id)
    .single()
  if (error) return null
  return fromRow(data)
}

export async function getLessonsByStudent(studentId: string): Promise<Lesson[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lessons')
    .select()
    .eq('student_id', studentId)
    .order('date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createLesson(lesson: Lesson): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('lessons').insert(toRow(lesson))
  if (error) throw error
}

export async function updateLesson(lesson: Lesson): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('lessons')
    .update({ ...toRow(lesson), updated_at: new Date().toISOString() })
    .eq('id', lesson.id)
  if (error) throw error
}

export async function updateHomeworkCompleted(id: string, completed: boolean): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('lessons')
    .update({ homework_completed: completed, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteLesson(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('lessons').delete().eq('id', id)
  if (error) throw error
}

// ─── Builders ─────────────────────────────────────────────────────────────────

export function buildLesson(
  data: CreateLessonInput,
  id = crypto.randomUUID(),
): Lesson {
  const now = new Date().toISOString()
  return {
    id,
    performanceTags:   [],
    homework:          '',
    homeworkSentAt:    null,
    homeworkCompleted: false,
    scheduleGroupId:   '',
    ...data,
    createdAt: now,
    updatedAt: now,
  }
}

export function applyUpdate(existing: Lesson, data: UpdateLessonInput): Lesson {
  return { ...existing, ...data, updatedAt: new Date().toISOString() }
}

export async function getNextLessonForStudent(studentId: string): Promise<import('./types').Lesson | null> {
  const today = todayISO()
  const lessons = await getLessonsByStudent(studentId)
  const upcoming = lessons.filter((l) => l.date >= today && l.status === 'agendada')
    .sort((a, b) => a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date))
  return upcoming[0] ?? null
}

/** Generate recurring lessons locally (no DB write — caller must createLesson for each). */
export function buildRecurringLessons(params: {
  teacherId: string
  studentId: string
  instrument: string
  days: number[]
  time: string
  duration: number
  startDate: string
  endDate: string
  scheduleGroupId: string
}): Lesson[] {
  if (params.days.length === 0 || !params.time || params.duration === 0) return []

  const lessons: Lesson[] = []
  const end    = new Date(params.endDate    + 'T00:00:00')
  const cursor = new Date(params.startDate  + 'T00:00:00')

  while (cursor <= end) {
    if (params.days.includes(cursor.getDay())) {
      lessons.push(buildLesson({
        teacherId:       params.teacherId,
        studentId:       params.studentId,
        date:            cursor.toISOString().split('T')[0],
        time:            params.time,
        duration:        params.duration,
        instrument:      params.instrument,
        topic:           '',
        notes:           '',
        status:          'agendada',
        scheduleGroupId: params.scheduleGroupId,
      }))
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return lessons
}
