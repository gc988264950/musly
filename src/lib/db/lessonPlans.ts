// TODO (Supabase): replace localStorage helpers with async Supabase client calls

import { readCollection, upsertItem, removeItem, removeManyWhere } from './storage'
import type { LessonPlan, CreateLessonPlanInput, UpdateLessonPlanInput } from './types'

const KEY = 'harmoniq_lesson_plans'

function now() {
  return new Date().toISOString()
}

function normalize(p: LessonPlan): LessonPlan {
  const raw = p as unknown as Record<string, unknown>
  return {
    ...p,
    lessonId: typeof raw.lessonId === 'string' ? raw.lessonId : '',
    planObjective: typeof raw.planObjective === 'string' ? raw.planObjective : '',
    planContent: typeof raw.planContent === 'string' ? raw.planContent : '',
    planExercises: typeof raw.planExercises === 'string' ? raw.planExercises : '',
    planObservations: typeof raw.planObservations === 'string' ? raw.planObservations : '',
    planPending: typeof raw.planPending === 'string' ? raw.planPending : '',
    planNextLesson: typeof raw.planNextLesson === 'string' ? raw.planNextLesson : '',
  }
}

export function getLessonPlansByStudent(studentId: string): LessonPlan[] {
  // TODO (Supabase): SELECT * FROM lesson_plans WHERE student_id = $1 ORDER BY created_at DESC
  return readCollection<LessonPlan>(KEY)
    .filter((p) => p.studentId === studentId)
    .map(normalize)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getLessonPlanByLessonId(lessonId: string): LessonPlan | null {
  // TODO (Supabase): SELECT * FROM lesson_plans WHERE lesson_id = $1 LIMIT 1
  const found = readCollection<LessonPlan>(KEY).find((p) => normalize(p).lessonId === lessonId)
  return found ? normalize(found) : null
}

export function getOrCreateLessonPlan(data: {
  lessonId: string
  studentId: string
  teacherId: string
}): LessonPlan {
  const existing = getLessonPlanByLessonId(data.lessonId)
  if (existing) return existing
  return createLessonPlan({
    lessonId: data.lessonId,
    studentId: data.studentId,
    teacherId: data.teacherId,
    duration: 60,
    focus: 'misto',
    level: 'Iniciante',
    difficulties: [],
    objectives: '',
    teacherObservation: '',
    title: 'Planejamento de aula',
    summary: '',
    sections: [],
    planObjective: '',
    planContent: '',
    planExercises: '',
    planObservations: '',
    planPending: '',
    planNextLesson: '',
  })
}

export function getLessonPlanById(id: string): LessonPlan | null {
  // TODO (Supabase): SELECT * FROM lesson_plans WHERE id = $1 LIMIT 1
  const found = readCollection<LessonPlan>(KEY).find((p) => p.id === id)
  return found ? normalize(found) : null
}

export function createLessonPlan(data: CreateLessonPlanInput): LessonPlan {
  // TODO (Supabase): INSERT INTO lesson_plans (...) VALUES (...) RETURNING *
  const plan: LessonPlan = {
    lessonId: '',
    planObjective: '',
    planContent: '',
    planExercises: '',
    planObservations: '',
    planPending: '',
    planNextLesson: '',
    ...data,
    id: crypto.randomUUID(),
    createdAt: now(),
    updatedAt: now(),
  }
  return upsertItem<LessonPlan>(KEY, plan)
}

export function updateLessonPlan(id: string, data: UpdateLessonPlanInput): LessonPlan {
  // TODO (Supabase): UPDATE lesson_plans SET ... WHERE id = $1 RETURNING *
  const existing = readCollection<LessonPlan>(KEY).find((p) => p.id === id)
  if (!existing) throw new Error('Plano não encontrado.')
  const updated: LessonPlan = { ...existing, ...data, updatedAt: now() }
  return upsertItem<LessonPlan>(KEY, updated)
}

export function deleteLessonPlan(id: string): void {
  // TODO (Supabase): DELETE FROM lesson_plans WHERE id = $1
  removeItem<LessonPlan>(KEY, id)
}

export function deleteLessonPlansByStudent(studentId: string): void {
  // TODO (Supabase): DELETE FROM lesson_plans WHERE student_id = $1
  removeManyWhere<LessonPlan>(KEY, (p) => p.studentId === studentId)
}

export function getAllLessonPlansByTeacher(teacherId: string): LessonPlan[] {
  // TODO (Supabase): SELECT * FROM lesson_plans WHERE teacher_id = $1
  return readCollection<LessonPlan>(KEY).filter((p) => p.teacherId === teacherId)
}
