import { createClient } from '@/lib/supabase/client'
import type { LessonPlan, CreateLessonPlanInput, UpdateLessonPlanInput, LessonPlanSection } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(r: any): LessonPlan {
  return {
    id:                  r.id,
    studentId:           r.student_id,
    teacherId:           r.teacher_id,
    lessonId:            r.lesson_id            ?? '',
    duration:            r.duration             ?? 60,
    focus:               r.focus                ?? 'misto',
    level:               r.level                ?? 'Iniciante',
    difficulties:        r.difficulties         ?? [],
    objectives:          r.objectives           ?? '',
    teacherObservation:  r.teacher_observation  ?? '',
    title:               r.title                ?? '',
    summary:             r.summary              ?? '',
    sections:            (r.sections as LessonPlanSection[]) ?? [],
    planObjective:       r.plan_objective        ?? '',
    planContent:         r.plan_content          ?? '',
    planExercises:       r.plan_exercises        ?? '',
    planObservations:    r.plan_observations     ?? '',
    planPending:         r.plan_pending          ?? '',
    planNextLesson:      r.plan_next_lesson      ?? '',
    createdAt:           r.created_at,
    updatedAt:           r.updated_at,
  }
}

export async function getLessonPlansByStudent(studentId: string): Promise<LessonPlan[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lesson_plans')
    .select()
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function getLessonPlanByLessonId(lessonId: string): Promise<LessonPlan | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lesson_plans')
    .select()
    .eq('lesson_id', lessonId)
    .maybeSingle()
  if (error) throw error
  return data ? fromRow(data) : null
}

export async function getLessonPlanById(id: string): Promise<LessonPlan | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lesson_plans')
    .select()
    .eq('id', id)
    .single()
  if (error) return null
  return fromRow(data)
}

export async function createLessonPlan(plan: LessonPlan): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('lesson_plans').insert({
    id:                   plan.id,
    teacher_id:           plan.teacherId,
    student_id:           plan.studentId,
    lesson_id:            plan.lessonId,
    duration:             plan.duration,
    focus:                plan.focus,
    level:                plan.level,
    difficulties:         plan.difficulties,
    objectives:           plan.objectives,
    teacher_observation:  plan.teacherObservation,
    title:                plan.title,
    summary:              plan.summary,
    sections:             plan.sections,
    plan_objective:       plan.planObjective,
    plan_content:         plan.planContent,
    plan_exercises:       plan.planExercises,
    plan_observations:    plan.planObservations,
    plan_pending:         plan.planPending,
    plan_next_lesson:     plan.planNextLesson,
    created_at:           plan.createdAt,
    updated_at:           plan.updatedAt,
  })
  if (error) throw error
}

export async function updateLessonPlan(plan: LessonPlan): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('lesson_plans')
    .update({
      lesson_id:           plan.lessonId,
      duration:            plan.duration,
      focus:               plan.focus,
      level:               plan.level,
      difficulties:        plan.difficulties,
      objectives:          plan.objectives,
      teacher_observation: plan.teacherObservation,
      title:               plan.title,
      summary:             plan.summary,
      sections:            plan.sections,
      plan_objective:      plan.planObjective,
      plan_content:        plan.planContent,
      plan_exercises:      plan.planExercises,
      plan_observations:   plan.planObservations,
      plan_pending:        plan.planPending,
      plan_next_lesson:    plan.planNextLesson,
      updated_at:          new Date().toISOString(),
    })
    .eq('id', plan.id)
  if (error) throw error
}

export async function deleteLessonPlan(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('lesson_plans').delete().eq('id', id)
  if (error) throw error
}

// ─── Builders ─────────────────────────────────────────────────────────────────

export function buildLessonPlan(
  data: CreateLessonPlanInput,
  id = crypto.randomUUID(),
): LessonPlan {
  const now = new Date().toISOString()
  return {
    lessonId:         '',
    planObjective:    '',
    planContent:      '',
    planExercises:    '',
    planObservations: '',
    planPending:      '',
    planNextLesson:   '',
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  }
}

export function applyUpdate(existing: LessonPlan, data: UpdateLessonPlanInput): LessonPlan {
  return { ...existing, ...data, updatedAt: new Date().toISOString() }
}

export async function getAllLessonPlansByTeacher(teacherId: string): Promise<LessonPlan[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lesson_plans')
    .select()
    .eq('teacher_id', teacherId)
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function getOrCreateLessonPlan(params: {
  lessonId: string
  studentId: string
  teacherId: string
}): Promise<LessonPlan> {
  const existing = await getLessonPlanByLessonId(params.lessonId)
  if (existing) return existing
  const plan = buildLessonPlan({
    lessonId:           params.lessonId,
    studentId:          params.studentId,
    teacherId:          params.teacherId,
    duration:           60,
    focus:              'misto',
    level:              'Iniciante',
    difficulties:       [],
    objectives:         '',
    teacherObservation: '',
    title:              'Planejamento de aula',
    summary:            '',
    sections:           [],
  })
  await createLessonPlan(plan)
  return plan
}
