import type { PlanId } from '@/lib/db/types'

// ─── Plan configuration ───────────────────────────────────────────────────────

export interface PlanLimits {
  students:         number | null  // null = unlimited
  lessonsPerMonth:  number | null  // null = unlimited
  aiCreditsPerMonth: number        // monthly AI credit budget
}

export interface PlanConfig {
  id: PlanId
  name: string
  priceLabel: string
  description: string
  badgeColor: string
  badgeBg: string
  limits: PlanLimits
  features: string[]
  highlighted: boolean
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Grátis',
    priceLabel: 'R$ 0/mês',
    description: 'Para professores que estão começando',
    badgeColor: 'text-gray-600',
    badgeBg: 'bg-gray-100',
    limits: {
      students: 3,
      lessonsPerMonth: 5,
      aiCreditsPerMonth: 10,
    },
    features: [
      'Até 3 alunos',
      'Até 5 aulas por mês',
      '10 créditos de IA por mês',
      'Histórico de aulas',
      'Anotações por aluno',
    ],
    highlighted: false,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceLabel: 'R$ 49,90/mês',
    description: 'Para professores ativos com muitos alunos',
    badgeColor: 'text-blue-700',
    badgeBg: 'bg-blue-100',
    limits: {
      students: 10,
      lessonsPerMonth: null,
      aiCreditsPerMonth: 100,
    },
    features: [
      'Até 10 alunos',
      'Aulas ilimitadas',
      '100 créditos de IA por mês',
      'Perfil pedagógico completo',
      'Repertório e progresso por aluno',
      'Financeiro completo com histórico',
      'Exportação de relatórios (em breve)',
    ],
    highlighted: true,
  },
  studio: {
    id: 'studio',
    name: 'Studio',
    priceLabel: 'R$ 99,90/mês',
    description: 'Para escolas e professores com múltiplas turmas',
    badgeColor: 'text-purple-700',
    badgeBg: 'bg-purple-100',
    limits: {
      students: null,
      lessonsPerMonth: null,
      aiCreditsPerMonth: 300,
    },
    features: [
      'Alunos ilimitados',
      'Aulas ilimitadas',
      '300 créditos de IA por mês',
      'IA avançada (GPT-4o)',
      'Múltiplos professores (em breve)',
      'Relatórios avançados (em breve)',
      'Suporte prioritário',
    ],
    highlighted: false,
  },
}

// ─── Credit packs (avulso) ────────────────────────────────────────────────────

export interface CreditPack {
  id: string
  credits: number
  price: number
  priceLabel: string
  badge?: string
  checkoutUrl: string  // real Cakto external checkout link
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id:          'pack_100',
    credits:     100,
    price:       1990,
    priceLabel:  'R$ 19,90',
    // Reads from NEXT_PUBLIC_CAKTO_LINK_CREDITS_100 (set in Vercel + .env.local)
    // Falls back to the raw Cakto link if the env var is not yet set
    checkoutUrl: process.env.NEXT_PUBLIC_CAKTO_LINK_CREDITS_100 ?? 'https://pay.cakto.com.br/3cpthxs_848464',
  },
  {
    id:          'pack_300',
    credits:     300,
    price:       3990,
    priceLabel:  'R$ 39,90',
    badge:       'Popular',
    checkoutUrl: process.env.NEXT_PUBLIC_CAKTO_LINK_CREDITS_300 ?? 'https://pay.cakto.com.br/39d9pis',
  },
  {
    id:          'pack_500',
    credits:     500,
    price:       5990,
    priceLabel:  'R$ 59,90',
    badge:       'Melhor valor',
    checkoutUrl: process.env.NEXT_PUBLIC_CAKTO_LINK_CREDITS_500 ?? 'https://pay.cakto.com.br/4wzvusx',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getPlan(planId: PlanId): PlanConfig {
  return PLANS[planId]
}

export function canAddStudent(planId: PlanId, currentCount: number): boolean {
  const limit = PLANS[planId].limits.students
  if (limit === null) return true
  return currentCount < limit
}

export function canAddLesson(planId: PlanId, lessonsThisMonth: number): boolean {
  const limit = PLANS[planId].limits.lessonsPerMonth
  if (limit === null) return true
  return lessonsThisMonth < limit
}

/** @deprecated use aiCredits system instead */
export function canGenerateAIPlan(planId: PlanId, plansThisMonth: number): boolean {
  const limit = PLANS[planId].limits.aiCreditsPerMonth
  return plansThisMonth < limit
}

export function formatLimit(value: number | null, unit: string): string {
  if (value === null) return `Ilimitado${unit ? ' ' + unit : ''}`
  return `${value} ${unit}`
}
