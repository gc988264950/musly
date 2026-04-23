/**
 * POST /api/student/homework
 *
 * Persists homework_completed for a lesson on behalf of a student.
 *
 * Why a dedicated route?
 * The student Supabase auth UID ≠ the lessons.student_id (which is the
 * students-table row ID). Direct client-side updates fail the RLS check
 * because the student can't prove ownership via a plain UID match.
 * This route uses the server-side (cookie-based) Supabase client,
 * looks up the student's linkedStudentId from their auth metadata, then
 * verifies the lesson belongs to that student before updating.
 *
 * Body: { lessonId: string, completed: boolean }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Must be an authenticated student
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'aluno') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const linkedStudentId: string | undefined = user.user_metadata?.linkedStudentId
  if (!linkedStudentId) {
    return NextResponse.json({ error: 'Aluno não vinculado.' }, { status: 403 })
  }

  let body: { lessonId?: string; completed?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 })
  }

  const { lessonId, completed } = body
  if (typeof lessonId !== 'string' || typeof completed !== 'boolean') {
    return NextResponse.json({ error: 'lessonId e completed são obrigatórios.' }, { status: 400 })
  }

  // Verify lesson belongs to this student before updating
  const { data: lesson, error: fetchErr } = await supabase
    .from('lessons')
    .select('id, student_id')
    .eq('id', lessonId)
    .eq('student_id', linkedStudentId)
    .single()

  if (fetchErr || !lesson) {
    return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 })
  }

  const { error: updateErr } = await supabase
    .from('lessons')
    .update({ homework_completed: completed, updated_at: new Date().toISOString() })
    .eq('id', lessonId)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
