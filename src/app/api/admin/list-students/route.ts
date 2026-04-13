/**
 * GET /api/admin/list-students?teacherId=...
 *
 * Returns all Supabase Auth users with role='aluno' and the given teacherId.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'professor') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const teacherId = req.nextUrl.searchParams.get('teacherId')
  if (!teacherId || teacherId !== user.id) {
    return NextResponse.json({ error: 'teacherId inválido.' }, { status: 403 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // List all users — filter by teacherId in metadata
  // Note: Supabase admin.listUsers() is paginated (max 1000 per page)
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const students = data.users
    .filter((u) =>
      u.user_metadata?.role === 'aluno' &&
      u.user_metadata?.teacherId === teacherId
    )
    .map((u) => ({
      id:              u.id,
      email:           u.email ?? '',
      firstName:       u.user_metadata?.firstName ?? '',
      lastName:        u.user_metadata?.lastName  ?? '',
      linkedStudentId: u.user_metadata?.linkedStudentId ?? '',
      createdAt:       u.created_at,
    }))

  return NextResponse.json({ students })
}
