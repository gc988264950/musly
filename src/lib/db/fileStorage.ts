/**
 * Supabase Storage wrapper for student file blobs.
 *
 * Metadata lives in the student_files table (studentFiles.ts).
 * Binary data lives here in the 'student-files' Supabase Storage bucket.
 *
 * Path format in bucket: '{teacherId}/{fileId}'
 * This matches the storage RLS policy which grants teacher access when
 * the first path segment equals auth.uid().
 */

import { createClient } from '@/lib/supabase/client'

const BUCKET = 'student-files'

/** Upload a file to Supabase Storage. storagePath = '{teacherId}/{fileId}' */
export async function saveFileBlob(storagePath: string, file: File): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
}

/** Download a file blob from Supabase Storage. Returns null if not found. */
export async function getFileBlob(storagePath: string): Promise<Blob | null> {
  const supabase = createClient()
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath)
  if (error) return null
  return data
}

/** Delete a single file from Supabase Storage. */
export async function deleteFileBlob(storagePath: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath])
  if (error) throw error
}

/** Delete multiple files from Supabase Storage (used for cascade deletes). */
export async function deleteFileBlobsByIds(storagePaths: string[]): Promise<void> {
  if (storagePaths.length === 0) return
  const supabase = createClient()
  const { error } = await supabase.storage.from(BUCKET).remove(storagePaths)
  if (error) throw error
}
