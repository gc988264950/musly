/**
 * GET /api/subscription/activate
 *
 * Checks whether an active paid subscription exists for the authenticated user.
 * Called by SubscriptionContext on page load and after returning from checkout.
 *
 * SECURITY CHANGES (hardening):
 * - Requires authentication — unauthenticated callers receive 401.
 * - Uses the authenticated user's own ID directly instead of an email lookup
 *   over all users (eliminates email enumeration and unnecessary service-role
 *   exposure for a user-scoped query).
 * - No longer accepts an ?email= parameter from the client.
 *
 * ─── FLOW ────────────────────────────────────────────────────────────────────
 * 1. Webhook fires → writes to subscriptions table in Supabase
 * 2. Frontend loads → SubscriptionContext calls this endpoint (authenticated)
 * 3. If an active non-free subscription exists → returns plan details
 * 4. Frontend calls refresh() to reload plan from DB
 */

import { NextResponse } from 'next/server'
import { createClient as createServiceRole } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function adminClient() {
  return createServiceRole(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET(): Promise<NextResponse> {
  // ── Require authentication ─────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  // ── Query subscription for this user only ──────────────────────────────────
  // Uses the authenticated user's ID directly — no client-controlled input.
  const admin = adminClient()
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
