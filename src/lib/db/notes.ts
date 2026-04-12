// TODO (Supabase): replace localStorage helpers with async Supabase client calls

import { readCollection, upsertItem, removeItem, removeManyWhere } from './storage'
import type { StudentNote, CreateNoteInput, UpdateNoteInput } from './types'

const KEY = 'harmoniq_notes'

function now() {
  return new Date().toISOString()
}

export function getNotesByStudent(studentId: string): StudentNote[] {
  // TODO (Supabase): SELECT * FROM student_notes WHERE student_id = studentId ORDER BY created_at DESC
  return readCollection<StudentNote>(KEY)
    .filter((n) => n.studentId === studentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function createNote(data: CreateNoteInput): StudentNote {
  // TODO (Supabase): INSERT INTO student_notes (...) VALUES (...) RETURNING *
  const note: StudentNote = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: now(),
    updatedAt: now(),
  }
  return upsertItem<StudentNote>(KEY, note)
}

export function updateNote(id: string, data: UpdateNoteInput): StudentNote {
  // TODO (Supabase): UPDATE student_notes SET content = $1, updated_at = NOW() WHERE id = $2 RETURNING *
  const notes = readCollection<StudentNote>(KEY)
  const existing = notes.find((n) => n.id === id)
  if (!existing) throw new Error('Anotação não encontrada.')
  const updated: StudentNote = { ...existing, ...data, updatedAt: now() }
  return upsertItem<StudentNote>(KEY, updated)
}

export function deleteNote(id: string): void {
  // TODO (Supabase): DELETE FROM student_notes WHERE id = $1
  removeItem<StudentNote>(KEY, id)
}

export function deleteNotesByStudent(studentId: string): void {
  // TODO (Supabase): DELETE FROM student_notes WHERE student_id = $1
  removeManyWhere<StudentNote>(KEY, (n) => n.studentId === studentId)
}
