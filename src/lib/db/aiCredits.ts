import { createClient } from '@/lib/supabase/client'
import type { PlanId } from '@/lib/db/types'

// ─── Credit budget per plan ───────────────────────────────────────────────────

export const PLAN_CREDITS: Record<PlanId, number> = {
  free:   5,
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
  used:      number
  total:     number
  remaining: number
  month:     string
  planId:    PlanId
}

// ─── Current month helper ─────────────────────────────────────────────────────

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// ─── DB functions ─────────────────────────────────────────────────────────────

/** How many credits the user has consumed this month */
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

/** Full summary: used, total, remaining, month */
export async function getCreditSummary(userId: string, planId: PlanId): Promise<AICreditSummary> {
  const used  = await getCreditsUsed(userId)
  const total = PLAN_CREDITS[planId] ?? 5
  return {
    used,
    total,
    remaining: Math.max(0, total - used),
    month: currentMonth(),
    planId,
  }
}

/**
 * Deduct `amount` credits from this month's usage.
 * Uses upsert so the row is created if it doesn't yet exist.
 */
export async function consumeCredits(userId: string, amount: number): Promise<void> {
  const supabase = createClient()
  const month    = currentMonth()

  // Upsert: if row exists increment; if not, create with this amount
  const { error } = await supabase.rpc('increment_ai_credits', {
    p_user_id: userId,
    p_month:   month,
    p_amount:  amount,
  })

  // Fallback if the RPC doesn't exist yet: manual upsert approach
  if (error) {
    const { data: existing } = await supabase
      .from('ai_credit_usage')
      .select('credits_used')
      .eq('user_id', userId)
      .eq('month', month)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('ai_credit_usage')
        .update({ credits_used: existing.credits_used + amount, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('month', month)
    } else {
      await supabase
        .from('ai_credit_usage')
        .insert({ user_id: userId, month, credits_used: amount })
    }
  }
}
