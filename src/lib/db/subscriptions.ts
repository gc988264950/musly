// TODO (Supabase): replace localStorage helpers with async Supabase client calls

import { readCollection, upsertItem } from './storage'
import type { UserSubscription, PlanId } from './types'

const KEY = 'harmoniq_subscriptions'

function now() {
  return new Date().toISOString()
}

export function getSubscription(userId: string): UserSubscription | null {
  // TODO (Supabase): SELECT * FROM subscriptions WHERE user_id = $1 LIMIT 1
  return readCollection<UserSubscription>(KEY).find((s) => s.userId === userId) ?? null
}

export function setSubscription(userId: string, planId: PlanId): UserSubscription {
  // TODO (Supabase): INSERT INTO subscriptions (...) ... ON CONFLICT (user_id) DO UPDATE SET ...
  const existing = getSubscription(userId)
  const record: UserSubscription = {
    id: existing?.id ?? crypto.randomUUID(),
    userId,
    planId,
    simulatedAt: now(),
    updatedAt: now(),
  }
  return upsertItem<UserSubscription>(KEY, record)
}
