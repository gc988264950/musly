/**
 * GET /api/subscription/activate?email=professor@email.com
 *
 * Checks whether a Cakto payment activation is pending for the given email.
 * Called by the frontend (SubscriptionContext) on page load and after
 * returning from the Cakto checkout.
 *
 * ─── FLOW ────────────────────────────────────────────────────────────────────
 * 1. Webhook fires → activationStore.set(email, activation)
 * 2. Frontend loads → SubscriptionContext calls this endpoint
 * 3. If activation found → returns plan details + removes from store (one-time)
 * 4. Frontend calls setSubscription(userId, planId, options) → updates localStorage
 *
 * ─── TODO (Supabase) ─────────────────────────────────────────────────────────
 * Replace activationStore logic with:
 *   const { data } = await supabase
 *     .from('cakto_activations')
 *     .select('*')
 *     .eq('email', email)
 *     .order('activated_at', { ascending: false })
 *     .limit(1)
 *     .single()
 *   if (data) {
 *     await supabase.from('cakto_activations').delete().eq('id', data.id)
 *     return NextResponse.json(data)
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { activationStore } from '@/lib/billing/cakto'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const email = req.nextUrl.searchParams.get('email')?.toLowerCase().trim()

  if (!email) {
    return NextResponse.json({ error: 'email param required' }, { status: 400 })
  }

  // ⚠️  TODO (Supabase): read from DB instead of in-memory Map
  const activation = activationStore.get(email)

  if (!activation) {
    return NextResponse.json({ activation: null })
  }

  // Consume activation — prevents the same webhook event being applied twice
  activationStore.delete(email)

  return NextResponse.json({ activation })
}
