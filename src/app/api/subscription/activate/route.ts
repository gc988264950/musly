/**
 * GET /api/subscription/activate?email=professor@email.com
 *
 * Checks whether a Cakto payment has been recorded for the given email.
 * Called by the frontend (SubscriptionContext) on page load and after
 * returning from the Cakto checkout.
 *
 * ─── FLOW ────────────────────────────────────────────────────────────────────
 * 1. Webhook fires → writes to subscriptions table in Supabase
 * 2. Frontend loads → SubscriptionContext calls this endpoint
 * 3. If an active non-free subscription exists → returns plan details
 * 4. Frontend calls refresh() to reload plan from DB
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const email = req.nextUrl.searchParams.get('email')?.toLowerCase().trim()

  if (!email) {
    return NextResponse.json({ error: 'email param required' }, { status: 400 })
  }

  const admin = adminClient()

  // Look up the Supabase user by email
  const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const user = usersData?.users?.find((u) => u.email?.toLowerCase() === email)

  if (!user) {
    return NextResponse.json({ activation: null })
  }

  // Check for an active paid subscription
  const { data: sub } = await admin
    .from('subscriptions')
    .select('plan_id, status, started_at, expires_at')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .neq('plan_id', 'free')
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (!sub) {
    return NextResponse.json({ activation: null })
  }

  return NextResponse.json({
    activation: {
      planId:    sub.plan_id,
      status:    sub.status,
      startedAt: sub.started_at,
      expiresAt: sub.expires_at,
    },
  })
}
