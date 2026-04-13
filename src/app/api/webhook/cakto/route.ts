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
import {
  activationStore,
  computeExpiry,
  CAKTO_OFFER_TO_PLAN,
  CAKTO_CONFIG,
  type CaktoWebhookPayload,
  type PendingActivation,
} from '@/lib/billing/cakto'

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

// ─── Approved-event handler ───────────────────────────────────────────────────

function handleApproved(payload: CaktoWebhookPayload): NextResponse {
  const { id, customer, offer, external_reference, approved_at, created_at } = payload.data

  const email = customer?.email?.toLowerCase().trim()
  if (!email) {
    console.warn('[Cakto webhook] Approved event missing customer email — skipping.')
    return NextResponse.json({ ok: true, skipped: 'no_email' })
  }

  // Resolve plan from offer ID
  const offerId = offer?.id ?? ''
  const planId  = CAKTO_OFFER_TO_PLAN[offerId]

  if (!planId) {
    console.warn(
      `[Cakto webhook] Unknown offer ID "${offerId}" — add it to CAKTO_OFFER_TO_PLAN in src/lib/billing/cakto.ts`
    )
    return NextResponse.json({ ok: true, skipped: 'unknown_offer', offerId })
  }

  const activatedAt = approved_at ?? created_at ?? new Date().toISOString()
  const expiresAt   = computeExpiry(planId, new Date(activatedAt))

  const activation: PendingActivation = {
    email,
    userId:       external_reference ?? null,
    planId,
    caktoOrderId: id,
    activatedAt,
    expiresAt,
  }

  // ⚠️ TODO (Supabase): write to DB table instead of in-memory Map
  activationStore.set(email, activation)

  console.info(`[Cakto webhook] ✅ Plan "${planId}" activated for ${email} (order ${id})`)
  return NextResponse.json({ ok: true, planId, email })
}

// ─── Refund/chargeback handler ────────────────────────────────────────────────

function handleRefund(payload: CaktoWebhookPayload): NextResponse {
  const email = payload.data.customer?.email?.toLowerCase().trim()
  if (email) activationStore.delete(email)
  // TODO (Supabase): UPDATE subscriptions SET plan_id='free', status='cancelled'
  console.info(`[Cakto webhook] Refund received for ${email ?? 'unknown'} — order ${payload.data.id}`)
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
