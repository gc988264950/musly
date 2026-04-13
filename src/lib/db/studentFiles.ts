import { createClient } from '@/lib/supabase/client'
import type { StudentFile } from './types'

// ─── Row mapper ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(r: any): StudentFile {
  return {
    id:               r.id,
    studentId:        r.student_id,
    teacherId:        r.teacher_id,
    name:             r.name,
    mimeType:         r.mime_type,
    size:             r.size,
    storagePath:      r.storage_path,
    visibleToStudent: r.visible_to_student ?? false,
    createdAt:        r.created_at,
  }
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Returns all files for a student.
 * - Teacher session: returns all files (teacher_own policy).
 * - Student session: returns only visible_to_student=true (student_read_visible policy).
 */
export async function getStudentFiles(studentId: string): Promise<StudentFile[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('student_files')
    .select()
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []).map(fromRow)
}

export async function getStudentFilesByTeacher(teacherId: string): Promise<StudentFile[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('student_files')
    .select()
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []).map(fromRow)
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createStudentFile(file: StudentFile): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('student_files').insert({
    id:                 file.id,
    student_id:         file.studentId,
    teacher_id:         file.teacherId,
    name:               file.name,
    mime_type:          file.mimeType,
    size:               file.size,
    storage_path:       file.storagePath,
    visible_to_student: file.visibleToStudent,
    created_at:         file.createdAt,
  })
  if (error) throw error
}

export async function updateStudentFileVisibility(id: string, visibleToStudent: boolean): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('student_files')
    .update({ visible_to_student: visibleToStudent })
    .eq('id', id)
  if (error) throw error
}

export async function deleteStudentFile(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('student_files').delete().eq('id', id)
  if (error) throw error
}

/** Cascade-delete all files for a student. Returns storage paths for blob cleanup. */
export async function deleteStudentFilesByStudent(studentId: string): Promise<string[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('student_files')
    .select('storage_path')
    .eq('student_id', studentId)
  const paths = (data ?? []).map((r: { storage_path: string }) => r.storage_path)
  await supabase.from('student_files').delete().eq('student_id', studentId)
  return paths
}
