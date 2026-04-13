/**
 * DELETE /api/admin/delete-student
 *
 * Body: { userId }
 * Deletes a student Supabase Auth user. Only the teacher who created them can delete.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'professor') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { userId } = await req.json()
  if (!userId) {
    return NextResponse.json({ error: 'userId obrigatório.' }, { status: 400 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Verify the target user belongs to this teacher before deleting
  const { data: { user: targetUser }, error: fetchError } = await admin.auth.admin.getUserById(userId)

  if (fetchError || !targetUser) {
    return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
  }

  if (targetUser.user_metadata?.teacherId !== user.id) {
    return NextResponse.json({ error: 'Você não tem permissão para deletar este aluno.' }, { status: 403 })
  }

  const { error } = await admin.auth.admin.deleteUser(userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
