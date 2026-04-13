/**
 * POST /api/admin/reset-student-password
 *
 * Allows a teacher to set a new password for one of their student accounts.
 * Uses the service role key to bypass standard auth checks.
 *
 * Body: { userId, newPassword }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  // Verify the caller is an authenticated teacher (not a student)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role === 'aluno') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { userId, newPassword } = await req.json()

  if (!userId || !newPassword) {
    return NextResponse.json({ error: 'userId e newPassword são obrigatórios.' }, { status: 400 })
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'A senha deve ter pelo menos 8 caracteres.' }, { status: 400 })
  }

  const admin = adminClient()

  // Verify the target user belongs to this teacher
  const { data: { user: targetUser }, error: fetchError } = await admin.auth.admin.getUserById(userId)

  if (fetchError || !targetUser) {
    return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
  }

  if (targetUser.user_metadata?.teacherId !== user.id) {
    return NextResponse.json({ error: 'Você não tem permissão para alterar a senha deste aluno.' }, { status: 403 })
  }

  const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
