/**
 * POST /api/admin/system/change-plan
 * Body: { userId: string, planId: 'free' | 'pro' | 'studio' }
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../_auth'

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.res
  const db = auth.db

  const { userId, planId } = await req.json()
  if (!userId || !planId) {
    return NextResponse.json({ error: 'userId e planId são obrigatórios.' }, { status: 400 })
  }
  if (!['free', 'pro', 'studio'].includes(planId)) {
    return NextResponse.json({ error: 'planId inválido.' }, { status: 400 })
  }

  const { error } = await db.from('subscriptions').upsert({
    user_id:          userId,
    plan_id:          planId,
    status:           'active',
    billing_provider: 'manual',
    updated_at:       new Date().toISOString(),
  }, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
