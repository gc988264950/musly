// TODO (Supabase): replace localStorage helpers with async Supabase client calls

import { readCollection, upsertItem, removeManyWhere } from './storage'
import type { StudentFinancial, CreateFinancialInput, UpdateFinancialInput } from './types'

const KEY = 'harmoniq_financial'

function now() {
  return new Date().toISOString()
}

export function getFinancialByStudent(studentId: string): StudentFinancial | null {
  // TODO (Supabase): SELECT * FROM student_financial WHERE student_id = $1 LIMIT 1
  return readCollection<StudentFinancial>(KEY).find((f) => f.studentId === studentId) ?? null
}

export function getAllFinancial(teacherId: string): StudentFinancial[] {
  // TODO (Supabase): SELECT * FROM student_financial WHERE teacher_id = $1
  return readCollection<StudentFinancial>(KEY).filter((f) => f.teacherId === teacherId)
}

export function upsertFinancial(data: CreateFinancialInput): StudentFinancial {
  // TODO (Supabase): INSERT INTO student_financial (...) ON CONFLICT (student_id) DO UPDATE SET ... RETURNING *
  const existing = getFinancialByStudent(data.studentId)
  const record: StudentFinancial = {
    id: existing?.id ?? crypto.randomUUID(),
    ...data,
    updatedAt: now(),
  }
  return upsertItem<StudentFinancial>(KEY, record)
}

export function updateFinancial(studentId: string, data: UpdateFinancialInput): StudentFinancial | null {
  // TODO (Supabase): UPDATE student_financial SET ... WHERE student_id = $1 RETURNING *
  const existing = getFinancialByStudent(studentId)
  if (!existing) return null
  const updated: StudentFinancial = { ...existing, ...data, updatedAt: now() }
  return upsertItem<StudentFinancial>(KEY, updated)
}

export function deleteFinancialByStudent(studentId: string): void {
  // TODO (Supabase): DELETE FROM student_financial WHERE student_id = $1
  removeManyWhere<StudentFinancial>(KEY, (f) => f.studentId === studentId)
}
