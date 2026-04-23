import { createClient } from '@/lib/supabase/client'
import type { Student, CreateStudentInput, UpdateStudentInput, StudentLevel } from './types'

// ─── Row mappers ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(r: any): Student {
  return {
    id:               r.id,
    teacherId:        r.teacher_id,
    name:             r.name,
    instrument:       r.instrument       ?? '',
    level:            r.level            ?? 'Iniciante' as StudentLevel,
    email:            r.email            ?? '',
    phone:            r.phone            ?? '',
    notes:            r.notes            ?? '',
    objectives:       r.objectives       ?? '',
    nextSteps:        r.next_steps       ?? '',
    color:            r.color            ?? '#6366f1',
    needsAttention:   r.needs_attention  ?? false,
    meetLink:         r.meet_link        ?? '',
    scheduleDays:     r.schedule_days    ?? [],
    scheduleTime:     r.schedule_time    ?? '',
    scheduleDuration: r.schedule_duration ?? 0,
    contractDuration:  r.contract_duration  ?? null,
    contractStartDate: r.contract_start_date ?? '',
    contractEndDate:   r.contract_end_date   ?? '',
    createdAt:         r.created_at,
    updatedAt:        r.updated_at,
  }
}

function toRow(s: Student) {
  return {
    id:                s.id,
    teacher_id:        s.teacherId,
    name:              s.name,
    instrument:        s.instrument,
    level:             s.level,
    email:             s.email,
    phone:             s.phone,
    notes:             s.notes,
    objectives:        s.objectives,
    next_steps:        s.nextSteps,
    color:             s.color,
    needs_attention:   s.needsAttention,
    meet_link:         s.meetLink,
    schedule_days:     s.scheduleDays,
    schedule_time:     s.scheduleTime,
    schedule_duration: s.scheduleDuration,
    contract_duration: s.contractDuration,
    // contract_start_date is tracked in UI state only until the DB column is added.
    // Run: ALTER TABLE students ADD COLUMN IF NOT EXISTS contract_start_date text DEFAULT '';
    contract_end_date: s.contractEndDate,
    created_at:        s.createdAt,
    updated_at:        s.updatedAt,
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getStudents(teacherId: string): Promise<Student[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('students')
    .select()
    .eq('teacher_id', teacherId)
    .order('name')
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function getStudentById(id: string): Promise<Student | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('students')
    .select()
    .eq('id', id)
    .single()
  if (error) return null
  return fromRow(data)
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createStudent(student: Student): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('students').insert(toRow(student))
  if (error) {
    console.error('[createStudent] DB error:', error.code, error.message)
    throw error
  }
}

export async function updateStudent(student: Student): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('students')
    .update({ ...toRow(student), updated_at: new Date().toISOString() })
    .eq('id', student.id)
  if (error) throw error
}

export async function deleteStudent(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('students').delete().eq('id', id)
  if (error) throw error
}

// ─── Legacy helpers (kept for compatibility) ──────────────────────────────────

export function buildStudent(
  data: CreateStudentInput,
  id = crypto.randomUUID(),
): Student {
  const now = new Date().toISOString()
  return {
    id,
    ...data,
    objectives:       data.objectives       ?? '',
    nextSteps:        data.nextSteps        ?? '',
    color:            data.color            ?? '#6366f1',
    needsAttention:   data.needsAttention   ?? false,
    meetLink:         data.meetLink         ?? '',
    scheduleDays:     data.scheduleDays     ?? [],
    scheduleTime:     data.scheduleTime     ?? '',
    scheduleDuration: data.scheduleDuration ?? 0,
    contractDuration:  data.contractDuration  ?? null,
    contractStartDate: data.contractStartDate ?? '',
    contractEndDate:   data.contractEndDate   ?? '',
    createdAt: now,
    updatedAt: now,
  }
}

export function applyUpdate(existing: Student, data: UpdateStudentInput): Student {
  return { ...existing, ...data, updatedAt: new Date().toISOString() }
}
