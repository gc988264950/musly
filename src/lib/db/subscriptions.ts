// TODO (Supabase): replace localStorage helpers with async Supabase client calls

import { readCollection, upsertItem } from './storage'
import type { UserSubscription, PlanId } from './types'

const KEY = 'harmoniq_subscriptions'

function now() {
  return new Date().toISOString()
}

// ─── Normalize ────────────────────────────────────────────────────────────────
// Ensures backward-compat when loading records that were saved before the new
// billing fields were added (they default to safe values).

function normalize(raw: Partial<UserSubscription> & Pick<UserSubscription, 'id' | 'userId' | 'planId'>): UserSubscription {
  const n = now()
  return {
    id:                  raw.id,
    userId:              raw.userId,
    planId:              raw.planId,
    status:              raw.status              ?? 'active',
    startedAt:           raw.startedAt           ?? raw.simulatedAt ?? n,
    expiresAt:           raw.expiresAt           ?? null,
    renewedAt:           raw.renewedAt           ?? null,
    billingProvider:     raw.billingProvider      ?? null,
    caktoOrderId:        raw.caktoOrderId        ?? null,
    caktoCustomerEmail:  raw.caktoCustomerEmail  ?? null,
    simulatedAt:         raw.simulatedAt,
    updatedAt:           raw.updatedAt           ?? n,
  }
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export function getSubscription(userId: string): UserSubscription | null {
  // TODO (Supabase): SELECT * FROM subscriptions WHERE user_id = $1 LIMIT 1
  const raw = readCollection<Partial<UserSubscription> & Pick<UserSubscription, 'id' | 'userId' | 'planId'>>(KEY)
    .find((s) => s.userId === userId)
  return raw ? normalize(raw) : null
}

// ─── Write ────────────────────────────────────────────────────────────────────

export interface BillingOptions {
  /** Subscription status. Defaults to 'active'. */
  status?: UserSubscription['status']
  /** ISO expiry date. null = no expiry. */
  expiresAt?: string | null
  /** ISO start date. Defaults to now(). */
  startedAt?: string
  /** Last renewal ISO date. */
  renewedAt?: string | null
  /** Which gateway processed the payment. */
  billingProvider?: UserSubscription['billingProvider']
  /** Cakto transaction ID. */
  caktoOrderId?: string | null
  /** Buyer email recorded at Cakto checkout. */
  caktoCustomerEmail?: string | null
}

export function setSubscription(
  userId: string,
  planId: PlanId,
  billing?: BillingOptions,
): UserSubscription {
  // TODO (Supabase): INSERT INTO subscriptions (...) ON CONFLICT (user_id) DO UPDATE SET ...
  const existing = getSubscription(userId)
  const n = now()

  const record = normalize({
    id:                 existing?.id ?? crypto.randomUUID(),
    userId,
    planId,
    status:             billing?.status             ?? 'active',
    startedAt:          billing?.startedAt          ?? n,
    expiresAt:          billing?.expiresAt          ?? null,
    renewedAt:          billing?.renewedAt          ?? null,
    billingProvider:    billing?.billingProvider    ?? existing?.billingProvider ?? null,
    caktoOrderId:       billing?.caktoOrderId       ?? existing?.caktoOrderId   ?? null,
    caktoCustomerEmail: billing?.caktoCustomerEmail ?? existing?.caktoCustomerEmail ?? null,
    // Keep legacy field for any existing code that reads simulatedAt
    simulatedAt:        existing?.simulatedAt ?? n,
    updatedAt:          n,
  })

  return upsertItem<UserSubscription>(KEY, record)
}
