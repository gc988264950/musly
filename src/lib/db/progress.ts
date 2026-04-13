import { createClient } from '@/lib/supabase/client'
import type { StudentProgress, UpsertProgressInput } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(r: any): StudentProgress {
  return {
    id:                      r.id,
    studentId:               r.student_id,
    teacherId:               r.teacher_id,
    evolution:               r.evolution               ?? '',
    lessonFrequency:         r.lesson_frequency        ?? '',
    identifiedDifficulties:  r.identified_difficulties ?? [],
    developedSkills:         r.developed_skills        ?? [],
    updatedAt:               r.updated_at,
  }
}

export async function getProgressByStudent(studentId: string): Promise<StudentProgress | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('student_progress')
    .select()
    .eq('student_id', studentId)
    .maybeSingle()
  if (error) throw error
  return data ? fromRow(data) : null
}

export async function upsertProgress(progress: StudentProgress): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('student_progress').upsert({
    id:                      progress.id,
    teacher_id:              progress.teacherId,
    student_id:              progress.studentId,
    evolution:               progress.evolution,
    lesson_frequency:        progress.lessonFrequency,
    identified_difficulties: progress.identifiedDifficulties,
    developed_skills:        progress.developedSkills,
    updated_at:              new Date().toISOString(),
  }, { onConflict: 'student_id' })
  if (error) throw error
}

// ─── Builder ──────────────────────────────────────────────────────────────────

export function buildProgress(
  data: UpsertProgressInput,
  existingId?: string,
): StudentProgress {
  return {
    id:        existingId ?? crypto.randomUUID(),
    ...data,
    updatedAt: new Date().toISOString(),
  }
}
