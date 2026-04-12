'use client'

import { useState } from 'react'
import { Check, Crown, Zap, Star, AlertCircle, X } from 'lucide-react'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { PLANS } from '@/lib/plans'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { PlanId } from '@/lib/db/types'

// ─── Plan icons ───────────────────────────────────────────────────────────────

const PlanIcon: Record<PlanId, React.ElementType> = {
  free: Star,
  pro: Zap,
  studio: Crown,
}

const planGradient: Record<PlanId, string> = {
  free: 'from-gray-400 to-gray-500',
  pro: 'from-[#1a7cfa] to-[#1468d6]',
  studio: 'from-[#1057b0] to-[#0d2d5e]',
}

// ─── Confirmation modal ───────────────────────────────────────────────────────

interface ConfirmModalProps {
  fromPlan: PlanId
  toPlan: PlanId
  onConfirm: () => void
  onClose: () => void
}

function ConfirmModal({ fromPlan, toPlan, onConfirm, onClose }: ConfirmModalProps) {
  const from = PLANS[fromPlan]
  const to = PLANS[toPlan]
  const isUpgrade = ['free', 'pro', 'studio'].indexOf(toPlan) > ['free', 'pro', 'studio'].indexOf(fromPlan)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X size={18} />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br', planGradient[toPlan])}>
            {(() => { const Icon = PlanIcon[toPlan]; return <Icon className="h-5 w-5 text-white" /> })()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {isUpgrade ? 'Fazer upgrade' : 'Alterar plano'} para {to.name}
            </h3>
            <p className="text-sm text-gray-500">{from.name} → {to.name}</p>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800">Simulação local</p>
              <p className="mt-0.5 text-xs text-amber-700">
                Esta é uma demonstração local. Nenhum pagamento será processado. Em produção, isso seria integrado ao Stripe ou Mercado Pago.
              </p>
            </div>
          </div>
        </div>

        <p className="mb-5 text-sm text-gray-600">
          Ao confirmar, seu plano será alterado de <strong>{from.name}</strong> para{' '}
          <strong>{to.name}</strong> ({to.priceLabel}).
          {!isUpgrade && ' Ao fazer downgrade, os limites do novo plano serão aplicados imediatamente.'}
        </p>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={onConfirm}>
            Confirmar — {to.name}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Success banner ───────────────────────────────────────────────────────────

function SuccessBanner({ planName, onClose }: { planName: string; onClose: () => void }) {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
        <Check className="h-4 w-4 text-white" />
      </div>
      <p className="flex-1 text-sm font-medium text-green-800">
        Plano alterado com sucesso para <strong>{planName}</strong>!
      </p>
      <button onClick={onClose} className="text-green-600 hover:text-green-800">
        <X size={16} />
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PLAN_ORDER: PlanId[] = ['free', 'pro', 'studio']

export default function PlansPage() {
  const { planId, changePlan, studentsCount, aiPlansThisMonth } = useSubscription()
  const [confirmTarget, setConfirmTarget] = useState<PlanId | null>(null)
  const [successPlan, setSuccessPlan] = useState<string | null>(null)

  function handleConfirm() {
    if (!confirmTarget) return
    changePlan(confirmTarget)
    setSuccessPlan(PLANS[confirmTarget].name)
    setConfirmTarget(null)
  }

  return (
    <div className="p-6 lg:p-8 animate-in">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
          <Crown size={13} />
          Planos Musly
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Escolha o plano ideal</h1>
        <p className="mt-2 text-gray-500">
          Comece gratuitamente e faça upgrade conforme sua turma cresce.
        </p>
      </div>

      {/* Success banner */}
      {successPlan && (
        <SuccessBanner planName={successPlan} onClose={() => setSuccessPlan(null)} />
      )}

      {/* Current usage */}
      {planId === 'free' && (
        <div className="mb-8 rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <p className="mb-3 text-sm font-medium text-gray-700">Uso atual — Plano Grátis</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 flex justify-between text-xs text-gray-500">
                <span>Alunos</span>
                <span className="font-medium text-gray-700">
                  {studentsCount} / {PLANS.free.limits.students}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    studentsCount >= (PLANS.free.limits.students ?? 0)
                      ? 'bg-red-500'
                      : 'bg-blue-500'
                  )}
                  style={{ width: `${Math.min(100, (studentsCount / (PLANS.free.limits.students ?? 1)) * 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex justify-between text-xs text-gray-500">
                <span>Planos IA este mês</span>
                <span className="font-medium text-gray-700">
                  {aiPlansThisMonth} / {PLANS.free.limits.aiPlansPerMonth}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    aiPlansThisMonth >= (PLANS.free.limits.aiPlansPerMonth ?? 0)
                      ? 'bg-red-500'
                      : 'bg-[#1a7cfa]'
                  )}
                  style={{ width: `${Math.min(100, (aiPlansThisMonth / (PLANS.free.limits.aiPlansPerMonth ?? 1)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {PLAN_ORDER.map((pid) => {
          const p = PLANS[pid]
          const Icon = PlanIcon[pid]
          const isCurrent = planId === pid
          const isHighlighted = p.highlighted

          return (
            <div
              key={pid}
              className={cn(
                'relative flex flex-col rounded-2xl border p-6 transition-all',
                isCurrent
                  ? 'border-blue-400 ring-2 ring-blue-400/30 shadow-card-hover'
                  : isHighlighted
                  ? 'border-blue-200 shadow-card'
                  : 'border-gray-200 shadow-card'
              )}
            >
              {/* Badge */}
              {isHighlighted && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-[#1a7cfa] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow">
                    Mais popular
                  </span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow">
                    Plano atual
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="mb-5">
                <div className={cn('mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br', planGradient[pid])}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{p.name}</h2>
                <p className="mt-0.5 text-sm text-gray-500">{p.description}</p>
                <p className="mt-3 text-2xl font-bold text-gray-900">{p.priceLabel}</p>
              </div>

              {/* Features */}
              <ul className="mb-6 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check
                      size={15}
                      className={cn(
                        'mt-0.5 flex-shrink-0',
                        pid === 'free' ? 'text-gray-500' : 'text-[#1a7cfa]'
                      )}
                    />
                    <span className="text-sm text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isCurrent ? (
                <button
                  disabled
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-sm font-semibold text-gray-500 cursor-default"
                >
                  Plano atual
                </button>
              ) : (
                <button
                  onClick={() => setConfirmTarget(pid)}
                  className={cn(
                    'w-full rounded-xl py-2.5 text-sm font-semibold transition-all',
                    isHighlighted
                      ? 'bg-[#1a7cfa] text-white shadow-sm hover:bg-[#1468d6]'
                      : pid === 'studio'
                      ? 'bg-[#1057b0] text-white shadow-sm hover:bg-[#0d4490]'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {['free', 'pro', 'studio'].indexOf(pid) > ['free', 'pro', 'studio'].indexOf(planId)
                    ? `Fazer upgrade para ${p.name}`
                    : `Alterar para ${p.name}`}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer note */}
      <p className="mt-8 text-center text-xs text-gray-400">
        Todos os planos são simulados localmente. Integração com gateway de pagamento (Stripe / Mercado Pago) disponível em breve.
      </p>

      {/* Confirm modal */}
      {confirmTarget && (
        <ConfirmModal
          fromPlan={planId}
          toPlan={confirmTarget}
          onConfirm={handleConfirm}
          onClose={() => setConfirmTarget(null)}
        />
      )}
    </div>
  )
}
