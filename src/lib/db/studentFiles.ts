// TODO (Supabase): Replace readCollection / upsertItem / removeItem with
// supabase.from('student_files').select / .insert / .delete
import { readCollection, upsertItem, removeItem, removeManyWhere } from './storage'
import type { StudentFile } from './types'

const KEY = 'harmoniq_student_files'

// ─── Queries ─────────────────────────────────────────────────────────────────

export function getStudentFiles(studentId: string): StudentFile[] {
  return readCollection<StudentFile>(KEY)
    .filter((f) => f.studentId === studentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getStudentFilesByTeacher(teacherId: string): StudentFile[] {
  return readCollection<StudentFile>(KEY).filter((f) => f.teacherId === teacherId)
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/** Create a new file metadata record (auto-generates id + createdAt). */
export function createStudentFile(
  data: Omit<StudentFile, 'id' | 'createdAt'>
): StudentFile {
  const file: StudentFile = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  return upsertItem(KEY, file)
}

/**
 * Save a fully-formed StudentFile record (caller provides id + createdAt).
 * Used when the ID must match an IndexedDB blob that was stored first.
 */
export function saveStudentFile(file: StudentFile): StudentFile {
  return upsertItem(KEY, file)
}

export function deleteStudentFile(id: string): void {
  removeItem<StudentFile>(KEY, id)
}

/** Cascade-delete all file metadata for a student (call deleteFileBlobsByIds separately for the blobs). */
export function deleteStudentFilesByStudent(studentId: string): string[] {
  const ids = readCollection<StudentFile>(KEY)
    .filter((f) => f.studentId === studentId)
    .map((f) => f.id)
  removeManyWhere<StudentFile>(KEY, (f) => f.studentId === studentId)
  return ids  // return IDs so caller can also clean up IndexedDB blobs
}
