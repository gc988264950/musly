import { createClient } from '@/lib/supabase/client'
import type { StudentNote, CreateNoteInput, UpdateNoteInput } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(r: any): StudentNote {
  return {
    id:        r.id,
    studentId: r.student_id,
    teacherId: r.teacher_id,
    content:   r.content   ?? '',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export async function getNotesByStudent(studentId: string): Promise<StudentNote[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('student_notes')
    .select()
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function createNote(note: StudentNote): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('student_notes').insert({
    id:         note.id,
    teacher_id: note.teacherId,
    student_id: note.studentId,
    content:    note.content,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
  })
  if (error) throw error
}

export async function updateNote(note: StudentNote): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('student_notes')
    .update({ content: note.content, updated_at: new Date().toISOString() })
    .eq('id', note.id)
  if (error) throw error
}

export async function deleteNote(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('student_notes').delete().eq('id', id)
  if (error) throw error
}

// ─── Builders ─────────────────────────────────────────────────────────────────

export function buildNote(data: CreateNoteInput, id = crypto.randomUUID()): StudentNote {
  const now = new Date().toISOString()
  return { id, ...data, createdAt: now, updatedAt: now }
}

export function applyUpdate(existing: StudentNote, data: UpdateNoteInput): StudentNote {
  return { ...existing, ...data, updatedAt: new Date().toISOString() }
}
