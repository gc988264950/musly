/**
 * Cakto Billing Integration — Configuration & Server-Side Activation Store
 *
 * ─── HOW TO CONFIGURE IN CAKTO ──────────────────────────────────────────────
 *
 * 1. Log in at https://app.cakto.com.br
 * 2. Create a product for each plan (Pro, Studio).
 * 3. In each product, create an "Oferta" (offer) with monthly/annual pricing.
 * 4. Copy the offer checkout link (e.g. https://pay.cakto.com.br/xxxxxxxx).
 * 5. Paste each link into .env.local (see NEXT_PUBLIC_CAKTO_LINK_PRO, etc.).
 *
 * ─── HOW TO SET UP THE WEBHOOK ──────────────────────────────────────────────
 *
 * 1. In Cakto dashboard, go to: Configurações → Integrações → Webhooks.
 * 2. Add a new webhook with URL:
 *      https://your-domain.com/api/webhook/cakto
 * 3. Select events:  "Compra aprovada" and "Reembolso".
 * 4. Copy the "Chave secreta" (webhook secret) to CAKTO_WEBHOOK_SECRET.
 * 5. Copy your API credentials to CAKTO_CLIENT_ID and CAKTO_CLIENT_SECRET.
 *
 * ─── OFFER → PLAN MAPPING ───────────────────────────────────────────────────
 *
 * After creating offers in Cakto, find the offer ID in the checkout link URL
 * (the last path segment, e.g. "abc123" in "pay.cakto.com.br/abc123").
 * Add each ID to CAKTO_OFFER_TO_PLAN below.
 *
 * ─── PRODUCTION NOTE ────────────────────────────────────────────────────────
 *
 * The activationStore Map below is in-memory and resets on server restart.
 * For production: replace with a Supabase table write in the webhook handler
 * and a SELECT in the activation endpoint.
 */

import type { PlanId } from '@/lib/db/types'

// ─── Environment config ───────────────────────────────────────────────────────
// All values come from environment variables — never hardcode credentials here.

export const CAKTO_CONFIG = {
  // ⬇ Set these in .env.local (server-side only — never exposed to browser)
  clientId:      process.env.CAKTO_CLIENT_ID      ?? '',
  clientSecret:  process.env.CAKTO_CLIENT_SECRET  ?? '',
  webhookSecret: process.env.CAKTO_WEBHOOK_SECRET ?? '',

  // ⬇ Set these in .env.local (NEXT_PUBLIC_ prefix → also available client-side)
  checkoutLinks: {
    pro:    process.env.NEXT_PUBLIC_CAKTO_LINK_PRO    ?? '',
    studio: process.env.NEXT_PUBLIC_CAKTO_LINK_STUDIO ?? '',
  },

  // Duration in days granted per plan after successful payment
  planDurationDays: {
    pro:    30,
    studio: 30,
  },
} as const

// ─── Offer → Plan mapping ─────────────────────────────────────────────────────
// After creating products/offers in Cakto, map each offer code to an internal PlanId.
// The offer code is the last segment of the checkout URL:
//   e.g.  https://pay.cakto.com.br/abc123def  →  'abc123def'
//
// TODO: fill in your real offer IDs after creating products in Cakto
export const CAKTO_OFFER_TO_PLAN: Record<string, Extract<PlanId, 'pro' | 'studio'>> = {
  // Full offer codes from checkout links (pay.cakto.com.br/<code>)
  '36wduu7_847737': 'pro',
  'cq3xw25_847738': 'studio',
  // Short variants (in case Cakto sends only the prefix before "_")
  '36wduu7': 'pro',
  'cq3xw25': 'studio',
}

// ─── Webhook payload types ────────────────────────────────────────────────────
// Based on Cakto's standard webhook schema.
// Verify against your Cakto dashboard → Integrações → Webhooks → "Ver payload exemplo".

export interface CaktoWebhookPayload {
  event: string           // "purchase.approved" | "purchase.refunded" | "purchase.chargeback"
  data: {
    id:     string        // Cakto order/transaction ID
    status: string        // "approved" | "refunded" | "chargeback" | "waiting_payment"
    total:  number        // amount in centavos (e.g. 4990 = R$49,90)
    customer: {
      email: string
      name:  string
      document?: string
    }
    offer?: {
      id:   string        // offer code — used to identify the plan
      name: string
    }
    product?: {
      id:   string
      name: string
    }
    external_reference?: string   // userId we passed in the checkout URL ?ref=
    created_at: string
    approved_at?: string
  }
}

// ─── Pending activation record ────────────────────────────────────────────────

export interface PendingActivation {
  email:         string
  userId:        string | null    // null if external_reference wasn't passed
  planId:        Extract<PlanId, 'pro' | 'studio'>
  caktoOrderId:  string
  activatedAt:   string
  expiresAt:     string
}

// ─── Server-side in-memory activation store ───────────────────────────────────
//
// ⚠️  DEVELOPMENT ONLY — resets on every server restart.
//
// How it works:
//   1. Webhook fires → activationStore.set(email, activation)
//   2. Frontend calls GET /api/subscription/activate?email=... → reads + deletes entry
//
// TODO (Supabase): Replace with:
//   - Webhook: INSERT INTO cakto_activations (email, plan_id, order_id, expires_at)
//   - Activate: SELECT + DELETE FROM cakto_activations WHERE email = $1

export const activationStore = new Map<string, PendingActivation>()

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build the Cakto checkout URL with pre-filled buyer email and userId reference. */
export function buildCheckoutUrl(
  planId: Extract<PlanId, 'pro' | 'studio'>,
  userEmail: string,
  userId: string,
  returnUrl: string,
): string {
  const base = CAKTO_CONFIG.checkoutLinks[planId]
  if (!base) return ''

  const url = new URL(base)
  // Pre-fill the buyer's email so it matches in the webhook
  url.searchParams.set('email', userEmail)
  // Pass userId as external reference so webhook can match without email lookup
  url.searchParams.set('ref', userId)
  // Where Cakto should redirect after successful payment
  url.searchParams.set('redirect_url', returnUrl)
  return url.toString()
}

/** Compute expiry date from activation time + plan duration. */
export function computeExpiry(planId: Extract<PlanId, 'pro' | 'studio'>, fromDate: Date = new Date()): string {
  const days = CAKTO_CONFIG.planDurationDays[planId]
  const d = new Date(fromDate)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

/** Validate Cakto webhook signature (HMAC-SHA256). */
export async function validateCaktoSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  if (!secret) return true // Skip validation if no secret configured (dev/test)
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
    const computed = Buffer.from(sig).toString('hex')
    // Cakto sends signature as "sha256=<hex>" or just "<hex>" — handle both
    const received = signatureHeader.startsWith('sha256=')
      ? signatureHeader.slice(7)
      : signatureHeader
    return computed === received
  } catch {
    return false
  }
}
