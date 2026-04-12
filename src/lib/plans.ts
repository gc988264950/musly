import type { PlanId } from '@/lib/db/types'

// ─── Plan configuration ───────────────────────────────────────────────────────

export interface PlanLimits {
  students: number | null        // null = unlimited
  aiPlansPerMonth: number | null // null = unlimited
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
      aiPlansPerMonth: 5,
    },
    features: [
      'Até 3 alunos',
      'Até 5 planos de aula por IA por mês',
      'Histórico de aulas',
      'Anotações por aluno',
      'Painel financeiro básico',
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
      students: null,
      aiPlansPerMonth: null,
    },
    features: [
      'Alunos ilimitados',
      'Planos de aula por IA ilimitados',
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
      aiPlansPerMonth: null,
    },
    features: [
      'Tudo do plano Pro',
      'Múltiplos professores (em breve)',
      'Relatórios avançados (em breve)',
      'Suporte prioritário',
      'Personalização da plataforma (em breve)',
    ],
    highlighted: false,
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getPlan(planId: PlanId): PlanConfig {
  return PLANS[planId]
}

export function canAddStudent(planId: PlanId, currentCount: number): boolean {
  const limit = PLANS[planId].limits.students
  if (limit === null) return true
  return currentCount < limit
}

export function canGenerateAIPlan(planId: PlanId, plansThisMonth: number): boolean {
  const limit = PLANS[planId].limits.aiPlansPerMonth
  if (limit === null) return true
  return plansThisMonth < limit
}

export function formatLimit(value: number | null, unit: string): string {
  if (value === null) return `Ilimitado${unit ? ' ' + unit : ''}`
  return `${value} ${unit}`
}
