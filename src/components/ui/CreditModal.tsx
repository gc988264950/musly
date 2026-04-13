'use client'

import { Zap, Star, Crown, ExternalLink, ArrowUpRight } from 'lucide-react'
import { Modal }            from '@/components/ui/Modal'
import { CREDIT_PACKS }     from '@/lib/plans'
import { useSubscription }  from '@/contexts/SubscriptionContext'
import type { AICreditSummary } from '@/lib/db/aiCredits'
import { cn }               from '@/lib/utils'

// ─── Props ────────────────────────────────────────────────────────────────────

interface CreditModalProps {
  open:    boolean
  onClose: () => void
  credits: AICreditSummary | null
}

// ─── Pack icons ───────────────────────────────────────────────────────────────

const PACK_ICONS = [Zap, Star, Crown]

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreditModal({ open, onClose, credits }: CreditModalProps) {
  const { plan } = useSubscription()

  const pct = credits
    ? Math.min(100, Math.round((credits.used / credits.total) * 100))
    : 0

  return (
    <Modal isOpen={open} onClose={onClose} title="Créditos de IA" size="md">
      <div className="space-y-5">

        {/* Balance summary */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">Plano atual</p>
              <p className="font-semibold text-gray-900">{plan.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Disponíveis</p>
              <p className="text-2xl font-bold text-blue-600">
                {credits?.totalAvailable ?? 0}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Créditos mensais usados</span>
              <span>{credits?.used ?? 0} / {credits?.total ?? 0}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className={cn(
                  'h-2 rounded-full transition-all',
                  pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-blue-500'
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {(credits?.extra ?? 0) > 0 && (
            <p className="mt-2 text-xs text-purple-600 font-medium">
              + {credits!.extra} créditos extras acumulados
            </p>
          )}
        </div>

        {/* Credit cost reference */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Custo por ação
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Consulta',  cost: 1, color: 'text-blue-600'   },
              { label: 'Geração',   cost: 2, color: 'text-purple-600' },
              { label: 'Plano IA',  cost: 3, color: 'text-pink-600'   },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-gray-100 bg-white p-3 text-center">
                <p className={cn('text-lg font-bold', item.color)}>{item.cost}</p>
                <p className="text-xs text-gray-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Credit packs — real Cakto links */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Recarregar créditos
          </p>
          <div className="space-y-2">
            {CREDIT_PACKS.map((pack, idx) => {
              const Icon = PACK_ICONS[idx] ?? Zap
              return (
                <a
                  key={pack.id}
                  href={pack.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all',
                    pack.badge === 'Popular'
                      ? 'border-blue-200 bg-blue-50 hover:border-blue-400 hover:bg-blue-100'
                      : 'border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg',
                      pack.badge === 'Popular' ? 'bg-blue-200' : 'bg-blue-100'
                    )}>
                      <Icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{pack.credits} créditos</p>
                      {pack.badge && (
                        <p className="text-xs text-blue-600 font-medium">{pack.badge}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{pack.priceLabel}</p>
                      <p className="text-xs text-gray-400">
                        R$ {((pack.price / pack.credits) / 100).toFixed(2)}/créd.
                      </p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  </div>
                </a>
              )
            })}
          </div>
          <p className="mt-2 text-center text-[11px] text-gray-400">
            Abre o checkout seguro da Cakto em nova aba
          </p>
        </div>

        {/* Upgrade CTA */}
        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
          <p className="font-semibold text-sm">Quer mais créditos todo mês?</p>
          <p className="text-xs text-blue-100 mt-0.5 mb-3">
            Faça upgrade e ganhe créditos mensais que renovam automaticamente.
          </p>
          <a
            href="/plans"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
          >
            Ver planos <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

      </div>
    </Modal>
  )
}
