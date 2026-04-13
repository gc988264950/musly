/**
 * POST /api/webhook/cakto
 *
 * Receives payment event notifications from Cakto (CaktoBot/1.0).
 *
 * ─── SIGNATURE VALIDATION ────────────────────────────────────────────────────
 * Cakto sends its webhook secret as a plain token in a request header
 * (not HMAC-signed). Validation = simple constant-time comparison between
 * the configured secret and the header value.
 *
 * Candidate headers inspected (in order):
 *   1. x-cakto-signature
 *   2. x-cakto-token
 *   3. x-webhook-token
 *   4. x-token
 *   5. authorization  (stripped of "Bearer " prefix if present)
 *
 * ─── DEBUG BYPASS ────────────────────────────────────────────────────────────
 * Set CAKTO_WEBHOOK_DEBUG_BYPASS=true in Vercel env vars to skip signature
 * validation entirely. Use ONLY for temporary debugging — never leave on.
 *
 * ─── TODO (Supabase) ─────────────────────────────────────────────────────────
 * Replace activationStore.set() with:
 *   await supabase.from('cakto_activations').upsert({ ... })
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  computeExpiry,
  CAKTO_OFFER_TO_PLAN,
  CAKTO_OFFER_TO_CREDITS,
  CAKTO_CONFIG,
  type CaktoWebhookPayload,
} from '@/lib/billing/cakto'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// ─── Debug bypass (controlled by env var — off by default) ───────────────────
const DEBUG_BYPASS = process.env.CAKTO_WEBHOOK_DEBUG_BYPASS === 'true'

// ─── Candidate headers Cakto may use to carry the secret ─────────────────────
const SIGNATURE_HEADERS = [
  'x-cakto-signature',
  'x-cakto-token',
  'x-webhook-token',
  'x-token',
  'authorization',
] as const

// ─── Constant-time string comparison (prevents timing attacks) ────────────────
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

// ─── Truncate value for safe logging (never expose full secrets) ──────────────
function truncate(value: string, maxShow = 8): string {
  if (value.length <= maxShow) return value
  return `${value.slice(0, maxShow)}…(${value.length} chars total)`
}

// ─── Validate the incoming request against the configured secret ──────────────
// Cakto sends the secret inside the JSON body as { "secret": "..." }.
// Headers are also checked as a fallback for future Cakto versions.
function validateRequest(
  req: NextRequest,
  bodySecret: string | undefined,
): {
  valid: boolean
  reason: string
  matchedSource: string | null
  allHeaders: Record<string, string>
} {
  const secret = CAKTO_CONFIG.webhookSecret

  // Collect ALL headers for debug logging (values truncated for safety)
  const allHeaders: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    allHeaders[key] = truncate(value)
  })

  // ── Debug bypass ──────────────────────────────────────────────────────────
  if (DEBUG_BYPASS) {
    return { valid: true, reason: 'DEBUG_BYPASS=true — validation skipped', matchedSource: null, allHeaders }
  }

  // ── No secret configured → accept all (useful during initial setup) ───────
  if (!secret) {
    return { valid: true, reason: 'no secret configured — skipping validation', matchedSource: null, allHeaders }
  }

  // ── 1. Check body.secret (Cakto's actual format) ──────────────────────────
  if (bodySecret) {
    const matches = safeEqual(bodySecret, secret)
    console.info(
      `[Cakto webhook] Checking body.secret: present=true, length=${bodySecret.length}, ` +
      `secret_length=${secret.length}, match=${matches}`
    )
    if (matches) {
      return { valid: true, reason: 'matched body.secret', matchedSource: 'body.secret', allHeaders }
    }
  } else {
    console.info('[Cakto webhook] body.secret: (absent)')
  }

  // ── 2. Check headers as fallback ──────────────────────────────────────────
  for (const headerName of SIGNATURE_HEADERS) {
    let headerValue = req.headers.get(headerName) ?? ''

    if (headerName === 'authorization' && headerValue.toLowerCase().startsWith('bearer ')) {
      headerValue = headerValue.slice(7).trim()
    }

    if (!headerValue) continue

    const matches = safeEqual(headerValue, secret)
    console.info(
      `[Cakto webhook] Checking header "${headerName}": present=true, length=${headerValue.length}, ` +
      `secret_length=${secret.length}, match=${matches}`
    )
    if (matches) {
      return { valid: true, reason: `matched header "${headerName}"`, matchedSource: headerName, allHeaders }
    }
  }

  return { valid: false, reason: 'secret not found in body.secret or any known header', matchedSource: null, allHeaders }
}

// ─── Shared: resolve userId from payload ─────────────────────────────────────

async function resolveUserId(
  admin: ReturnType<typeof adminClient>,
  email: string,
  externalReference: string | undefined,
): Promise<string | null> {
  // Prefer explicit userId passed in checkout URL ?ref=<userId>
  if (externalReference) return externalReference

  // Fall back to email lookup
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 })
  return data?.users?.find((u) => u.email?.toLowerCase() === email)?.id ?? null
}

// ─── Credit purchase handler (NEW) ───────────────────────────────────────────

async function handleCreditPurchase(
  payload: CaktoWebhookPayload,
  creditAmount: number,
): Promise<NextResponse> {
  const { id, customer, external_reference, approved_at, created_at } = payload.data

  const email = customer?.email?.toLowerCase().trim()
  if (!email) {
    console.warn('[Cakto webhook] Credit purchase missing customer email — skipping.')
    return NextResponse.json({ ok: true, skipped: 'no_email' })
  }

  const admin    = adminClient()
  const orderId  = id
  const now      = approved_at ?? created_at ?? new Date().toISOString()
  const month    = now.slice(0, 7) // "YYYY-MM"

  // ── 1. Idempotency: reject if this order was already processed ───────────────
  const { data: existing } = await admin
    .from('credit_transactions')
    .select('id')
    .eq('cakto_order_id', orderId)
    .maybeSingle()

  if (existing) {
    console.info(`[Cakto webhook] ⚠️  Order "${orderId}" already processed — skipping duplicate.`)
    return NextResponse.json({ ok: true, skipped: 'duplicate_order', orderId })
  }

  // ── 2. Resolve user ──────────────────────────────────────────────────────────
  const userId = await resolveUserId(admin, email, external_reference)

  if (!userId) {
    console.warn(`[Cakto webhook] No user found for ${email} — cannot add credits.`)
    return NextResponse.json({ ok: true, skipped: 'user_not_found', email })
  }

  // ── 3. Add extra credits (never overwrite — always sum) ──────────────────────
  const { data: usage } = await admin
    .from('ai_credit_usage')
    .select('extra_credits')
    .eq('user_id', userId)
    .eq('month', month)
    .maybeSingle()

  const currentExtra = usage?.extra_credits ?? 0

  if (usage) {
    await admin
      .from('ai_credit_usage')
      .update({
        extra_credits: currentExtra + creditAmount,
        updated_at:    new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('month', month)
  } else {
    await admin
      .from('ai_credit_usage')
      .insert({
        user_id:       userId,
        month,
        credits_used:  0,
        extra_credits: creditAmount,
      })
  }

  // ── 4. Log transaction with order ID (guarantees idempotency on retry) ───────
  const { error: txError } = await admin
    .from('credit_transactions')
    .insert({
      user_id:        userId,
      type:           'purchase',
      amount:         creditAmount,
      description:    `Compra de ${creditAmount} créditos via Cakto`,
      cakto_order_id: orderId,
      created_at:     now,
    })

  if (txError) {
    // Unique constraint violation = duplicate webhook (race condition)
    if (txError.code === '23505') {
      console.info(`[Cakto webhook] ⚠️  Race-condition duplicate for order "${orderId}" — ignored.`)
      return NextResponse.json({ ok: true, skipped: 'duplicate_race', orderId })
    }
    console.error('[Cakto webhook] Credit transaction write error:', txError.message)
    return NextResponse.json({ error: txError.message }, { status: 500 })
  }

  console.info(
    `[Cakto webhook] ✅ +${creditAmount} credits added for ${email} (order ${orderId})`
  )
  return NextResponse.json({ ok: true, credits: creditAmount, email, orderId })
}

// ─── Plan purchase handler (unchanged logic, refactored) ─────────────────────

async function handlePlanPurchase(
  payload: CaktoWebhookPayload,
  planId: Extract<import('@/lib/db/types').PlanId, 'pro' | 'studio'>,
): Promise<NextResponse> {
  const { id, customer, offer: _offer, external_reference, approved_at, created_at } = payload.data

  const email = customer?.email?.toLowerCase().trim()
  if (!email) {
    console.warn('[Cakto webhook] Plan purchase missing customer email — skipping.')
    return NextResponse.json({ ok: true, skipped: 'no_email' })
  }

  const activatedAt = approved_at ?? created_at ?? new Date().toISOString()
  const expiresAt   = computeExpiry(planId, new Date(activatedAt))
  const admin       = adminClient()

  const userId = await resolveUserId(admin, email, external_reference)

  if (!userId) {
    console.warn(`[Cakto webhook] No Supabase user found for ${email} — cannot write subscription.`)
    return NextResponse.json({ ok: true, skipped: 'user_not_found', email })
  }

  const { error } = await admin.from('subscriptions').upsert({
    user_id:              userId,
    plan_id:              planId,
    status:               'active',
    started_at:           activatedAt,
    expires_at:           expiresAt,
    billing_provider:     'cakto',
    cakto_order_id:       id,
    cakto_customer_email: email,
    updated_at:           new Date().toISOString(),
  }, { onConflict: 'user_id' })

  if (error) {
    console.error('[Cakto webhook] DB write error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.info(`[Cakto webhook] ✅ Plan "${planId}" written to DB for ${email} (order ${id})`)
  return NextResponse.json({ ok: true, planId, email })
}

// ─── Approved-event dispatcher ────────────────────────────────────────────────

async function handleApproved(payload: CaktoWebhookPayload): Promise<NextResponse> {
  const offerId = payload.data.offer?.id ?? ''

  // ── Credit purchase? ──────────────────────────────────────────────────────
  const creditAmount = CAKTO_OFFER_TO_CREDITS[offerId]
  if (creditAmount !== undefined) {
    console.info(`[Cakto webhook] Detected credit purchase: +${creditAmount} credits (offer "${offerId}")`)
    return handleCreditPurchase(payload, creditAmount)
  }

  // ── Plan purchase? ────────────────────────────────────────────────────────
  const planId = CAKTO_OFFER_TO_PLAN[offerId]
  if (planId) {
    console.info(`[Cakto webhook] Detected plan purchase: "${planId}" (offer "${offerId}")`)
    return handlePlanPurchase(payload, planId)
  }

  // ── Unknown offer ─────────────────────────────────────────────────────────
  console.warn(`[Cakto webhook] Unknown offer ID "${offerId}" — not a plan or credit pack.`)
  return NextResponse.json({ ok: true, skipped: 'unknown_offer', offerId })
}

// ─── Refund/chargeback handler ────────────────────────────────────────────────

async function handleRefund(payload: CaktoWebhookPayload): Promise<NextResponse> {
  const email = payload.data.customer?.email?.toLowerCase().trim()
  if (email) {
    const admin = adminClient()
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const match = data?.users?.find((u) => u.email?.toLowerCase() === email)
    if (match) {
      await admin.from('subscriptions').upsert({
        user_id:    match.id,
        plan_id:    'free',
        status:     'cancelled',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
    }
  }
  console.info(`[Cakto webhook] Refund processed for ${email ?? 'unknown'} — order ${payload.data.id}`)
  return NextResponse.json({ ok: true, event: payload.event })
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = CAKTO_CONFIG.webhookSecret

  // ── 1. Secret presence check ────────────────────────────────────────────────
  console.info(
    `[Cakto webhook] ── Incoming request ──────────────────────────────────────`
  )
  console.info(
    `[Cakto webhook] Secret configured: ${secret
      ? `YES (${secret.length} chars, starts "${secret.slice(0, 4)}…")`
      : 'NO — validation will be skipped'
    }`
  )
  console.info(
    `[Cakto webhook] Debug bypass: ${DEBUG_BYPASS ? 'ENABLED ⚠️' : 'disabled'}`
  )

  // ── 2. Read raw body ─────────────────────────────────────────────────────────
  let rawBody: string
  try {
    rawBody = await req.text()
  } catch {
    console.error('[Cakto webhook] ❌ Failed to read request body.')
    return NextResponse.json({ error: 'Cannot read body' }, { status: 400 })
  }

  console.info(`[Cakto webhook] Body: ${rawBody.length} chars, starts: ${rawBody.slice(0, 60)}`)

  // ── 3. Parse payload (needed to extract body.secret before validation) ───────
  let payload: CaktoWebhookPayload & { secret?: string }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    console.error('[Cakto webhook] ❌ Body is not valid JSON.')
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // ── 4. Log headers + validate ─────────────────────────────────────────────
  const { valid, reason, matchedSource, allHeaders } = validateRequest(req, payload.secret)

  console.info(`[Cakto webhook] All headers received: ${JSON.stringify(allHeaders)}`)

  if (!valid) {
    console.warn(`[Cakto webhook] ❌ Rejected — ${reason}`)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  console.info(`[Cakto webhook] ✅ Accepted — ${reason} (source: ${matchedSource ?? 'none/bypass'})`)

  const event = payload.event ?? ''
  console.info(`[Cakto webhook] Event type: "${event}"`)

  // ── 5. Route by event type ───────────────────────────────────────────────────
  if (
    event === 'purchase.approved'  ||
    event === 'purchase_approved'  ||
    event === 'order.approved'     ||
    event === 'order_approved'     ||
    event === 'payment.approved'   ||
    event === 'payment_approved'   ||
    event === 'sale.approved'      ||
    event === 'sale_approved'
  ) {
    return handleApproved(payload)
  }

  if (
    event === 'purchase.refunded'   ||
    event === 'purchase_refunded'   ||
    event === 'order.refunded'      ||
    event === 'order_refunded'      ||
    event === 'purchase.chargeback' ||
    event === 'purchase_chargeback' ||
    event === 'sale.refunded'       ||
    event === 'sale_refunded'
  ) {
    return handleRefund(payload)
  }

  console.info(`[Cakto webhook] Unknown event "${event}" — accepted but ignored.`)
  return NextResponse.json({ ok: true, skipped: 'unknown_event', event })
}
