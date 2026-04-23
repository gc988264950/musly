/**
 * POST /api/admin/system/add-credits
 * Body: { userId: string, amount: number }
 * Adds extra credits to the user's current-month bucket.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../_auth'

function currentMonth() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.res
  const db = auth.db

  const { userId, amount } = await req.json()
  if (!userId || typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'userId e amount válido são obrigatórios.' }, { status: 400 })
  }

  const month = currentMonth()

  const { data: existing } = await db
    .from('ai_credit_usage')
    .select('extra_credits')
    .eq('user_id', userId)
    .eq('month', month)
    .maybeSingle()

  const currentExtra = existing?.extra_credits ?? 0

  let dbError
  if (existing) {
    const { error } = await db
      .from('ai_credit_usage')
      .update({ extra_credits: currentExtra + amount, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('month', month)
    dbError = error
  } else {
    const { error } = await db
      .from('ai_credit_usage')
      .insert({ user_id: userId, month, credits_used: 0, extra_credits: amount })
    dbError = error
  }

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  // Log transaction
  await db.from('credit_transactions').insert({
    user_id:     userId,
    type:        'purchase',
    amount,
    description: `Créditos adicionados pelo admin (+${amount})`,
  })

  return NextResponse.json({ ok: true })
}
