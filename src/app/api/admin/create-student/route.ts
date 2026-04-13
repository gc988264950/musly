/**
 * POST /api/admin/create-student
 *
 * Creates a Supabase Auth user for a student account.
 * Uses the service role key (server-side only) to bypass email confirmation.
 *
 * Body: { email, password, firstName, lastName, linkedStudentId, teacherId }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

// Admin client with service role — server-side only
function adminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  // Verify the caller is an authenticated teacher
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'professor') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const body = await req.json()
  const { email, password, firstName, lastName, linkedStudentId, teacherId } = body

  if (!email || !password || !firstName || !lastName || !linkedStudentId || !teacherId) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 })
  }

  if (teacherId !== user.id) {
    return NextResponse.json({ error: 'teacherId inválido.' }, { status: 403 })
  }

  const admin = adminClient()

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,   // bypass email confirmation for student accounts
    user_metadata: {
      firstName:       firstName.trim(),
      lastName:        lastName.trim(),
      role:            'aluno',
      teacherId,
      linkedStudentId,
    },
  })

  if (error) {
    const msg = error.message.includes('already been registered')
      ? 'Este e-mail já está em uso.'
      : error.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  return NextResponse.json({ ok: true, userId: data.user.id })
}
