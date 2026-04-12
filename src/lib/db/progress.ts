// TODO (Supabase): replace localStorage helpers with async Supabase client calls

import { readCollection, upsertItem, removeManyWhere } from './storage'
import type { StudentProgress, UpsertProgressInput } from './types'

const KEY = 'harmoniq_progress'

function now() {
  return new Date().toISOString()
}

export function getProgressByStudent(studentId: string): StudentProgress | null {
  // TODO (Supabase): SELECT * FROM student_progress WHERE student_id = $1 LIMIT 1
  return readCollection<StudentProgress>(KEY).find((p) => p.studentId === studentId) ?? null
}

export function upsertProgress(data: UpsertProgressInput): StudentProgress {
  // TODO (Supabase): INSERT INTO student_progress (...) VALUES (...) ON CONFLICT (student_id) DO UPDATE SET ... RETURNING *
  const existing = getProgressByStudent(data.studentId)
  const record: StudentProgress = {
    id: existing?.id ?? crypto.randomUUID(),
    ...data,
    updatedAt: now(),
  }
  return upsertItem<StudentProgress>(KEY, record)
}

export function deleteProgressByStudent(studentId: string): void {
  // TODO (Supabase): DELETE FROM student_progress WHERE student_id = $1
  removeManyWhere<StudentProgress>(KEY, (p) => p.studentId === studentId)
}
