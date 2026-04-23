/**
 * Credit tier helpers — pure functions with zero Supabase/browser dependencies.
 *
 * Extracted so they can be imported by both:
 *   - browser code  (ai-assistant page, SubscriptionContext display)
 *   - server routes (/api/ai/chat — authoritative deduction)
 *
 * The server is the single source of truth for how many credits any
 * request costs. The client may use classifyPrompt() for display purposes
 * only; it must never be trusted for the actual deduction.
 */

import type { PlanId } from '@/lib/db/types'

// ─── Monthly credit budget per plan ──────────────────────────────────────────

export const PLAN_CREDITS: Record<PlanId, number> = {
  free:   10,
  pro:    100,
  studio: 300,
}

// ─── Credit cost per request tier ────────────────────────────────────────────

/** 1 = simple lookup, 2 = generation/analysis, 3 = full plan / deep analysis */
export type CreditTier = 1 | 2 | 3

export const TIER_LABELS: Record<CreditTier, string> = {
  1: 'Consulta simples',
  2: 'Geração inteligente',
  3: 'Planejamento avançado',
}

/**
 * Classifies a user prompt and returns the credit cost.
 * This function runs on the SERVER inside /api/ai/chat and is
 * authoritative — the client cannot override the cost.
 */
export function classifyPrompt(prompt: string): CreditTier {
  const p = prompt.toLowerCase().trim()

  // Tier 3 — full plans, complete lessons, deep history analysis
  const advanced = [
    'plano de aula', 'planejamento completo', 'planejamento mensal',
    'gerar aula completa', 'criar aula completa', 'criar aula',
    'analisar evolução', 'analisar histórico', 'analisar historico',
    'gerar planejamento', 'análise completa', 'analise completa',
    'semestre', 'módulo completo',
  ]
  if (advanced.some((kw) => p.includes(kw))) return 3

  // Tier 2 — exercises, suggestions, student analysis
  const medium = [
    'exercício', 'exercicio', 'gerar exerc', 'sugerir exerc',
    'analisar aluno', 'analisar o aluno', 'análise do aluno',
    'sugerir', 'sugira', 'o que trabalhar', 'o que ensinar',
    'tarefa', 'dever de casa', 'recomendar', 'recomende',
    'ideia de aula', 'ideia para aula',
    'monte a', 'me ajude a montar',
  ]
  if (medium.some((kw) => p.includes(kw))) return 2

  // Tier 1 — all other queries
  return 1
}
