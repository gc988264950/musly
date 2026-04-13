import { readCollection, upsertItem, removeItem } from './storage'
import type { Student, CreateStudentInput, UpdateStudentInput } from './types'

const KEY = 'harmoniq_students'

// Normalize records that predate newer fields (backwards compatibility)
function normalize(s: Student): Student {
  const raw = s as unknown as Record<string, unknown>
  return {
    ...s,
    objectives: typeof raw.objectives === 'string' ? raw.objectives : '',
    nextSteps: typeof raw.nextSteps === 'string' ? raw.nextSteps : '',
    color: typeof raw.color === 'string' ? raw.color : '#6366f1',
    needsAttention: typeof raw.needsAttention === 'boolean' ? raw.needsAttention : false,
    meetLink: typeof raw.meetLink === 'string' ? raw.meetLink : '',
    scheduleDays: Array.isArray(raw.scheduleDays) ? (raw.scheduleDays as number[]) : [],
    scheduleTime: typeof raw.scheduleTime === 'string' ? raw.scheduleTime : '',
    scheduleDuration: typeof raw.scheduleDuration === 'number' ? raw.scheduleDuration : 0,
    contractDuration: (raw.contractDuration as (1 | 3 | 6 | 12) | null) ?? null,
    contractEndDate: typeof raw.contractEndDate === 'string' ? raw.contractEndDate : '',
  }
}

// ─── Queries ─────────────────────────────────────────────────────────────────
// TODO (Supabase): Replace body with: supabase.from('students').select().eq('teacher_id', teacherId)

export function getStudents(teacherId: string): Student[] {
  return readCollection<Student>(KEY)
    .filter((s) => s.teacherId === teacherId)
    .map(normalize)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export function getStudentById(id: string): Student | null {
  const s = readCollection<Student>(KEY).find((s) => s.id === id)
  return s ? normalize(s) : null
}

// ─── Mutations ───────────────────────────────────────────────────────────────
// TODO (Supabase): Replace bodies with supabase.from('students').insert / .update / .delete

export function createStudent(data: CreateStudentInput): Student {
  const now = new Date().toISOString()
  const student: Student = { id: crypto.randomUUID(), ...data, createdAt: now, updatedAt: now }
  return upsertItem(KEY, student)
}

export function updateStudent(id: string, data: UpdateStudentInput): Student {
  const existing = readCollection<Student>(KEY).find((s) => s.id === id)
  if (!existing) throw new Error('Aluno não encontrado.')
  const updated: Student = { ...existing, ...data, updatedAt: new Date().toISOString() }
  return upsertItem(KEY, updated)
}

export function deleteStudent(id: string): void {
  removeItem<Student>(KEY, id)
}
