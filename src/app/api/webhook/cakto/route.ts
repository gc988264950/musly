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
 * Debug logs (safe for production — no full secrets exposed):
 *   [Cakto webhook] shows which header matched and basic request info.
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

// ─── Validate the incoming request against the configured secret ──────────────
function validateRequest(req: NextRequest): {
  valid: boolean
  matchedHeader: string | null
  debugInfo: Record<string, string>
} {
  const secret = CAKTO_CONFIG.webhookSecret

  // Build a safe debug map: header name → truncated value (never expose full secret)
  const debugInfo: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    debugInfo[key] = value.length > 24
      ? `${value.slice(0, 8)}…(${value.length} chars)`
      : value
  })

  if (!secret) {
    // No secret configured → skip validation (useful during initial setup)
    return { valid: true, matchedHeader: null, debugInfo }
  }

  for (const headerName of SIGNATURE_HEADERS) {
    let headerValue = req.headers.get(headerName) ?? ''

    // Strip "Bearer " prefix if present (handles Authorization header)
    if (headerName === 'authorization' && headerValue.toLowerCase().startsWith('bearer ')) {
      headerValue = headerValue.slice(7).trim()
    }

    if (!headerValue) continue

    if (safeEqual(headerValue, secret)) {
      return { valid: true, matchedHeader: headerName, debugInfo }
    }
  }

  return { valid: false, matchedHeader: null, debugInfo }
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

  // ── Debug: secret presence (never log the full value) ──────────────────────
  console.info(
    `[Cakto webhook] Incoming request — secret configured: ${secret ? `yes (${secret.length} chars, starts "${secret.slice(0, 4)}…")` : 'NO — skipping validation'}`
  )

  // ── Read raw body BEFORE any other processing ───────────────────────────────
  // (body must be read as text; once consumed it cannot be re-read)
  let rawBody: string
  try {
    rawBody = await req.text()
  } catch {
    console.error('[Cakto webhook] Failed to read request body.')
    return NextResponse.json({ error: 'Cannot read body' }, { status: 400 })
  }

  console.info(`[Cakto webhook] Body length: ${rawBody.length} chars`)

  // ── Validate signature ──────────────────────────────────────────────────────
  const { valid, matchedHeader, debugInfo } = validateRequest(req)

  // Log header names + truncated values (safe for production)
  console.info('[Cakto webhook] Request headers:', JSON.stringify(debugInfo))

  if (!valid) {
    console.warn(
      `[Cakto webhook] ❌ Signature invalid — none of [${SIGNATURE_HEADERS.join(', ')}] matched the secret.`
    )
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  if (matchedHeader) {
    console.info(`[Cakto webhook] ✅ Signature valid — matched via header "${matchedHeader}"`)
  } else {
    console.info('[Cakto webhook] ✅ Signature check skipped (no secret configured)')
  }

  // ── Parse payload ───────────────────────────────────────────────────────────
  let payload: CaktoWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    console.error('[Cakto webhook] Body is not valid JSON.')
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event = payload.event ?? ''
  console.info(`[Cakto webhook] Event type: "${event}"`)

  // ── Route by event type ─────────────────────────────────────────────────────
  // Covers all known Cakto event naming conventions
  if (
    event === 'purchase.approved' ||
    event === 'order.approved'    ||
    event === 'payment.approved'  ||
    event === 'sale.approved'
  ) {
    return handleApproved(payload)
  }

  if (
    event === 'purchase.refunded'   ||
    event === 'order.refunded'      ||
    event === 'purchase.chargeback' ||
    event === 'sale.refunded'
  ) {
    return handleRefund(payload)
  }

  console.info(`[Cakto webhook] Unknown event "${event}" — accepted but ignored.`)
  return NextResponse.json({ ok: true, skipped: 'unknown_event', event })
}
