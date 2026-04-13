import { createClient } from '@/lib/supabase/client'
import type { UserSubscription, PlanId } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(r: any): UserSubscription {
  return {
    id:                   r.id,
    userId:               r.user_id,
    planId:               r.plan_id               ?? 'free',
    status:               r.status                ?? 'active',
    startedAt:            r.started_at,
    expiresAt:            r.expires_at            ?? null,
    renewedAt:            r.renewed_at            ?? null,
    billingProvider:      r.billing_provider      ?? null,
    caktoOrderId:         r.cakto_order_id        ?? null,
    caktoCustomerEmail:   r.cakto_customer_email  ?? null,
    updatedAt:            r.updated_at,
  }
}

export async function getSubscription(userId: string): Promise<UserSubscription | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select()
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data ? fromRow(data) : null
}

export interface BillingOptions {
  status?: UserSubscription['status']
  expiresAt?: string | null
  startedAt?: string
  renewedAt?: string | null
  billingProvider?: UserSubscription['billingProvider']
  caktoOrderId?: string | null
  caktoCustomerEmail?: string | null
}

export async function setSubscription(
  userId: string,
  planId: PlanId,
  billing?: BillingOptions,
): Promise<UserSubscription> {
  const supabase = createClient()
  const now = new Date().toISOString()

  const record = {
    user_id:              userId,
    plan_id:              planId,
    status:               billing?.status              ?? 'active',
    started_at:           billing?.startedAt           ?? now,
    expires_at:           billing?.expiresAt           ?? null,
    renewed_at:           billing?.renewedAt           ?? null,
    billing_provider:     billing?.billingProvider     ?? null,
    cakto_order_id:       billing?.caktoOrderId        ?? null,
    cakto_customer_email: billing?.caktoCustomerEmail  ?? null,
    updated_at:           now,
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .upsert(record, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) throw error
  return fromRow(data)
}
