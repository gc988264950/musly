/**
 * POST /api/webhook/cakto
 *
 * Receives payment event notifications from Cakto.
 *
 * ─── WHAT THIS DOES ──────────────────────────────────────────────────────────
 * 1. Verifies the request signature (HMAC-SHA256) to confirm it came from Cakto.
 * 2. Parses the webhook payload.
 * 3. On a "purchase.approved" event, maps the offer to an internal plan.
 * 4. Stores a pending activation keyed by customer email.
 * 5. The frontend picks up the activation via GET /api/subscription/activate.
 *
 * ─── HOW TO CONFIGURE ────────────────────────────────────────────────────────
 * 1. Deploy this app so it has a public URL.
 * 2. In Cakto: Configurações → Integrações → Webhooks → Nova URL.
 *    URL: https://your-domain.com/api/webhook/cakto
 *    Events: Compra aprovada, Reembolso
 * 3. Copy the Cakto webhook secret to CAKTO_WEBHOOK_SECRET in .env.local.
 * 4. Fill CAKTO_OFFER_TO_PLAN in src/lib/billing/cakto.ts with your offer IDs.
 *
 * ─── TESTING ─────────────────────────────────────────────────────────────────
 * Use Cakto's "Testar webhook" feature in the dashboard, or send a test with:
 *   curl -X POST https://your-domain.com/api/webhook/cakto \
 *     -H "Content-Type: application/json" \
 *     -d '{"event":"purchase.approved","data":{"id":"test_1","status":"approved","total":4990,"customer":{"email":"professor@email.com","name":"Test"},"offer":{"id":"abc123def","name":"Pro"},"external_reference":"userId_here","created_at":"2024-01-01T00:00:00Z"}}'
 *
 * ─── TODO (Supabase) ─────────────────────────────────────────────────────────
 * Replace activationStore.set() with:
 *   await supabase.from('cakto_activations').upsert({
 *     email, user_id, plan_id, cakto_order_id, expires_at, activated_at
 *   })
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  activationStore,
  validateCaktoSignature,
  computeExpiry,
  CAKTO_OFFER_TO_PLAN,
  CAKTO_CONFIG,
  type CaktoWebhookPayload,
  type PendingActivation,
} from '@/lib/billing/cakto'

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
    // Offer not yet mapped — log and accept (don't return 4xx, or Cakto will retry)
    console.warn(
      `[Cakto webhook] Unknown offer ID "${offerId}" — add it to CAKTO_OFFER_TO_PLAN in src/lib/billing/cakto.ts`
    )
    return NextResponse.json({ ok: true, skipped: 'unknown_offer', offerId })
  }

  const activatedAt = approved_at ?? created_at ?? new Date().toISOString()
  const expiresAt   = computeExpiry(planId, new Date(activatedAt))

  const activation: PendingActivation = {
    email,
    userId:       external_reference ?? null,  // userId passed via ?ref= in checkout URL
    planId,
    caktoOrderId: id,
    activatedAt,
    expiresAt,
  }

  // Store pending activation — frontend will pick this up on next page load
  // ⚠️  TODO (Supabase): write to DB table instead of in-memory Map
  activationStore.set(email, activation)

  console.info(`[Cakto webhook] Plan "${planId}" activated for ${email} (order ${id})`)
  return NextResponse.json({ ok: true, planId, email })
}

// ─── Refund/chargeback handler ────────────────────────────────────────────────

function handleRefund(payload: CaktoWebhookPayload): NextResponse {
  const email = payload.data.customer?.email?.toLowerCase().trim()
  if (email) {
    // Remove any pending activation for this email
    activationStore.delete(email)
  }
  // NOTE: To downgrade the user's plan back to 'free', you would need a
  // server-side DB here. With localStorage-only, a server-side downgrade
  // is not possible — the user's plan stays until they log in again.
  //
  // TODO (Supabase): UPDATE subscriptions SET plan_id='free', status='cancelled'
  //   WHERE cakto_customer_email = $1
  console.info(`[Cakto webhook] Refund received for ${email ?? 'unknown'} — order ${payload.data.id}`)
  return NextResponse.json({ ok: true, event: payload.event })
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Read raw body for signature verification
  let rawBody: string
  try {
    rawBody = await req.text()
  } catch {
    return NextResponse.json({ error: 'Cannot read body' }, { status: 400 })
  }

  // Validate signature (only if CAKTO_WEBHOOK_SECRET is configured)
  const signature = req.headers.get('x-cakto-signature') ?? req.headers.get('x-signature') ?? ''
  const secret    = CAKTO_CONFIG.webhookSecret

  if (secret) {
    const valid = await validateCaktoSignature(rawBody, signature, secret)
    if (!valid) {
      console.warn('[Cakto webhook] Invalid signature — request rejected.')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  // Parse payload
  let payload: CaktoWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event = payload.event ?? ''
  console.info(`[Cakto webhook] Event received: "${event}"`)

  // Route by event type
  // Note: Cakto may use "purchase.approved", "order.approved", or similar.
  // Adjust these strings to match your Cakto product configuration.
  if (event === 'purchase.approved' || event === 'order.approved' || event === 'payment.approved') {
    return handleApproved(payload)
  }

  if (event === 'purchase.refunded' || event === 'order.refunded' || event === 'purchase.chargeback') {
    return handleRefund(payload)
  }

  // Unknown event — accept but ignore (don't return 4xx)
  return NextResponse.json({ ok: true, skipped: 'unknown_event', event })
}
