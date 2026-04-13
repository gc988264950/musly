import { createClient } from '@/lib/supabase/client'
import { PLANS }        from '@/lib/plans'
import type { PlanId }  from '@/lib/db/types'

// ─── Credit budget per plan ───────────────────────────────────────────────────

export const PLAN_CREDITS: Record<PlanId, number> = {
  free:   10,
  pro:    100,
  studio: 300,
}

// ─── Credit cost per action tier ─────────────────────────────────────────────

/** 1 = simple data lookup, 2 = generation/analysis, 3 = full plan/deep analysis */
export type CreditTier = 1 | 2 | 3

export const TIER_LABELS: Record<CreditTier, string> = {
  1: 'Consulta simples',
  2: 'Geração inteligente',
  3: 'Planejamento avançado',
}

// ─── Classify a user prompt into a credit tier ────────────────────────────────

export function classifyPrompt(prompt: string): CreditTier {
  const p = prompt.toLowerCase().trim()

  // Advanced (3 credits): full plans, complete lessons, deep history analysis
  const advanced = [
    'plano de aula', 'planejamento completo', 'planejamento mensal',
    'gerar aula completa', 'criar aula completa', 'criar aula',
    'analisar evolução', 'analisar histórico', 'analisar historico',
    'gerar planejamento', 'análise completa', 'analise completa',
    'semestre', 'módulo completo',
  ]
  if (advanced.some((kw) => p.includes(kw))) return 3

  // Medium (2 credits): exercises, task suggestions, student analysis
  const medium = [
    'exercício', 'exercicio', 'gerar exerc', 'sugerir exerc',
    'analisar aluno', 'analisar o aluno', 'análise do aluno',
    'sugerir', 'sugira', 'o que trabalhar', 'o que ensinar',
    'tarefa', 'dever de casa', 'recomendar', 'recomende',
    'ideia de aula', 'ideia para aula',
    'monte a', 'me ajude a montar',
  ]
  if (medium.some((kw) => p.includes(kw))) return 2

  // Simple (1 credit): all data-lookup queries
  return 1
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AICreditSummary {
  used:         number
  extra:        number   // purchased extra credits (don't reset monthly)
  total:        number   // monthly budget
  remaining:    number   // monthly remaining
  totalAvailable: number // remaining + extra
  month:        string
  planId:       PlanId
}

// ─── Current month helper ─────────────────────────────────────────────────────

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// ─── DB functions ─────────────────────────────────────────────────────────────

/** How many monthly credits the user has consumed this month */
export async function getCreditsUsed(userId: string): Promise<number> {
  const supabase = createClient()
  const { data } = await supabase
    .from('ai_credit_usage')
    .select('credits_used')
    .eq('user_id', userId)
    .eq('month', currentMonth())
    .maybeSingle()
  return data?.credits_used ?? 0
}

/** How many extra (purchased) credits the user has */
export async function getExtraCredits(userId: string): Promise<number> {
  const supabase = createClient()
  const { data } = await supabase
    .from('ai_credit_usage')
    .select('extra_credits')
    .eq('user_id', userId)
    .eq('month', currentMonth())
    .maybeSingle()
  return data?.extra_credits ?? 0
}

/** Full summary: used, extra, total, remaining, totalAvailable, month */
export async function getCreditSummary(userId: string, planId: PlanId): Promise<AICreditSummary> {
  const supabase = createClient()
  const month    = currentMonth()

  const { data } = await supabase
    .from('ai_credit_usage')
    .select('credits_used, extra_credits')
    .eq('user_id', userId)
    .eq('month', month)
    .maybeSingle()

  const used  = data?.credits_used  ?? 0
  const extra = data?.extra_credits ?? 0
  const total = PLAN_CREDITS[planId] ?? PLANS[planId]?.limits.aiCreditsPerMonth ?? 10

  return {
    used,
    extra,
    total,
    remaining:      Math.max(0, total - used),
    totalAvailable: Math.max(0, total - used) + extra,
    month,
    planId,
  }
}

/**
 * Deduct `amount` credits from this month's usage.
 * Uses monthly credits first; if exhausted, uses extra credits.
 */
export async function consumeCredits(userId: string, amount: number, planId: PlanId): Promise<void> {
  const supabase = createClient()
  const month    = currentMonth()
  const total    = PLAN_CREDITS[planId] ?? 10

  // Fetch current state
  const { data: existing } = await supabase
    .from('ai_credit_usage')
    .select('credits_used, extra_credits')
    .eq('user_id', userId)
    .eq('month', month)
    .maybeSingle()

  const usedNow  = existing?.credits_used  ?? 0
  const extraNow = existing?.extra_credits ?? 0
  const monthlyRemaining = Math.max(0, total - usedNow)

  let newUsed  = usedNow
  let newExtra = extraNow

  if (amount <= monthlyRemaining) {
    // All from monthly budget
    newUsed = usedNow + amount
  } else {
    // Exhaust monthly, then take from extra
    const fromExtra = amount - monthlyRemaining
    newUsed  = total
    newExtra = Math.max(0, extraNow - fromExtra)
  }

  if (existing) {
    await supabase
      .from('ai_credit_usage')
      .update({ credits_used: newUsed, extra_credits: newExtra, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('month', month)
  } else {
    await supabase
      .from('ai_credit_usage')
      .insert({ user_id: userId, month, credits_used: newUsed, extra_credits: newExtra })
  }

  // Log the usage transaction
  await supabase.from('credit_transactions').insert({
    user_id:     userId,
    type:        'extra_usage',
    amount:      -amount,
    description: `Uso de ${amount} crédito(s) de IA`,
  })
}

// ─── Transaction history ──────────────────────────────────────────────────────

export interface CreditTransaction {
  id:          string
  type:        'purchase' | 'extra_usage' | 'monthly_reset'
  amount:      number
  description: string | null
  created_at:  string
}

/** Recent credit transactions for the user (newest first, max 20) */
export async function getRecentTransactions(userId: string): Promise<CreditTransaction[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('credit_transactions')
    .select('id, type, amount, description, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  return (data ?? []) as CreditTransaction[]
}

/**
 * Add purchased credits to the user's extra balance.
 * Records a transaction for bookkeeping.
 */
export async function purchaseCredits(
  userId:      string,
  amount:      number,
  description: string,
): Promise<void> {
  const supabase = createClient()
  const month    = currentMonth()

  const { data: existing } = await supabase
    .from('ai_credit_usage')
    .select('extra_credits')
    .eq('user_id', userId)
    .eq('month', month)
    .maybeSingle()

  const currentExtra = existing?.extra_credits ?? 0

  if (existing) {
    await supabase
      .from('ai_credit_usage')
      .update({ extra_credits: currentExtra + amount, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('month', month)
  } else {
    await supabase
      .from('ai_credit_usage')
      .insert({ user_id: userId, month, credits_used: 0, extra_credits: amount })
  }

  // Log purchase transaction
  await supabase.from('credit_transactions').insert({
    user_id:     userId,
    type:        'purchase',
    amount,
    description,
  })
}
