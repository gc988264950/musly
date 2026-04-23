/**
 * POST /api/admin/system/block-user
 * Body: { userId: string, block: boolean }
 * Bans (block=true) or unbans (block=false) a Supabase Auth user.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../_auth'

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.res
  const db = auth.db

  const { userId, block } = await req.json()
  if (!userId || typeof block !== 'boolean') {
    return NextResponse.json({ error: 'userId e block são obrigatórios.' }, { status: 400 })
  }

  const { error } = await db.auth.admin.updateUserById(userId, {
    // Supabase ban_duration: '8760h' = 1 year; 'none' = unban
    ban_duration: block ? '8760h' : 'none',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
