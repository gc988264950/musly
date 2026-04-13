'use client'

import { useEffect, useState }  from 'react'
import Link                      from 'next/link'
import {
  Zap, Star, Crown, ExternalLink, ArrowUpRight,
  TrendingDown, TrendingUp, Clock, RefreshCw,
} from 'lucide-react'
import { useAuth }              from '@/contexts/AuthContext'
import { useSubscription }      from '@/contexts/SubscriptionContext'
import { getRecentTransactions, type CreditTransaction } from '@/lib/db/aiCredits'
import { CREDIT_PACKS, PLANS }  from '@/lib/plans'
import { Card }                 from '@/components/ui/Card'
import { cn }                   from '@/lib/utils'

// ─── Pack icons ───────────────────────────────────────────────────────────────

const PACK_ICONS = [Zap, Star, Crown]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function txLabel(tx: CreditTransaction): string {
  if (tx.description) return tx.description
  if (tx.type === 'purchase')      return 'Compra de créditos'
  if (tx.type === 'monthly_reset') return 'Renovação mensal'
  return 'Uso de créditos de IA'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreditsPage() {
  const { user }                       = useAuth()
  const { planId, plan, aiCredits, refreshCredits } = useSubscription()
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [txLoading,    setTxLoading]    = useState(true)

  useEffect(() => {
    if (!user) return
    setTxLoading(true)
    getRecentTransactions(user.id)
      .then(setTransactions)
      .catch(() => setTransactions([]))
      .finally(() => setTxLoading(false))
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const pct = aiCredits
    ? Math.min(100, Math.round((aiCredits.used / aiCredits.total) * 100))
    : 0

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-in max-w-4xl">

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
          <Zap size={13} />
          Créditos de IA
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Seus créditos</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gerencie e recarregue seus créditos de IA a qualquer momento.
        </p>
      </div>

      {/* ── Balance hero ── */}
      <Card className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-6 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-blue-200">Créditos disponíveis</p>
              <p className="mt-1 text-5xl font-bold">
                {aiCredits?.totalAvailable ?? 0}
              </p>
              <p className="mt-1 text-sm text-blue-200">
                Plano <span className="font-semibold text-white">{plan.name}</span>
                {' '}· {aiCredits?.total ?? PLANS[planId].limits.aiCreditsPerMonth} créditos/mês
              </p>
            </div>

            {/* Quick recharge CTA */}
            <a
              href={CREDIT_PACKS[1].checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 self-start rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow transition-all hover:bg-blue-50 sm:self-auto"
            >
              <Zap className="h-4 w-4" />
              Recarregar agora
              <ExternalLink className="h-3.5 w-3.5 opacity-60" />
            </a>
          </div>
        </div>

        {/* Breakdown bar */}
        <div className="grid divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0 px-0">
          <div className="flex items-center gap-3 px-6 py-4">
            <div className="rounded-xl bg-blue-50 p-2.5">
              <TrendingDown className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Usados este mês</p>
              <p className="font-bold text-gray-900">{aiCredits?.used ?? 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 py-4">
            <div className="rounded-xl bg-green-50 p-2.5">
              <RefreshCw className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Mensais restantes</p>
              <p className="font-bold text-gray-900">{aiCredits?.remaining ?? 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 py-4">
            <div className="rounded-xl bg-purple-50 p-2.5">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Créditos extras</p>
              <p className="font-bold text-gray-900">{aiCredits?.extra ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Progress bar footer */}
        <div className="border-t border-gray-100 px-6 py-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Uso mensal de créditos</span>
            <span>{aiCredits?.used ?? 0} / {aiCredits?.total ?? PLANS[planId].limits.aiCreditsPerMonth}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={cn(
                'h-2 rounded-full transition-all',
                pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-blue-500'
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Os créditos mensais renovam automaticamente no início de cada mês.
          </p>
        </div>
      </Card>

      {/* ── Credit cost reference ── */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Custo por tipo de ação</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Consulta simples',     cost: 1, color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100',   example: 'Próxima aula, pagamentos' },
            { label: 'Geração inteligente',  cost: 2, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', example: 'Exercícios, análise de aluno' },
            { label: 'Planejamento avançado', cost: 3, color: 'text-pink-600',  bg: 'bg-pink-50',   border: 'border-pink-100',   example: 'Plano de aula completo' },
          ].map((item) => (
            <Card key={item.label} className={cn('border p-4 text-center', item.border)}>
              <div className={cn('mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl', item.bg)}>
                <Zap className={cn('h-5 w-5', item.color)} />
              </div>
              <p className={cn('text-2xl font-bold', item.color)}>{item.cost}</p>
              <p className="mt-0.5 text-xs font-medium text-gray-700">{item.label}</p>
              <p className="mt-1 text-[10px] text-gray-400">{item.example}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Recharge packs ── */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Recarregar créditos</h2>
          <span className="text-xs text-gray-400">Checkout seguro via Cakto</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {CREDIT_PACKS.map((pack, idx) => {
            const Icon = PACK_ICONS[idx] ?? Zap
            const isPopular = pack.badge === 'Popular'
            return (
              <a
                key={pack.id}
                href={pack.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'relative flex flex-col items-center rounded-2xl border p-5 text-center transition-all hover:-translate-y-0.5 hover:shadow-md',
                  isPopular
                    ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200'
                    : 'border-gray-200 bg-white hover:border-blue-200'
                )}
              >
                {pack.badge && (
                  <span className={cn(
                    'absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                    isPopular ? 'bg-blue-600 text-white' : 'bg-purple-100 text-purple-700'
                  )}>
                    {pack.badge}
                  </span>
                )}

                <div className={cn(
                  'mb-3 flex h-12 w-12 items-center justify-center rounded-2xl',
                  isPopular ? 'bg-blue-200' : 'bg-blue-100'
                )}>
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>

                <p className="text-2xl font-bold text-gray-900">{pack.credits}</p>
                <p className="text-xs text-gray-500">créditos</p>

                <div className="my-3 w-full border-t border-gray-100" />

                <p className="text-lg font-bold text-gray-900">{pack.priceLabel}</p>
                <p className="text-xs text-gray-400">
                  R$ {((pack.price / pack.credits) / 100).toFixed(2)} por crédito
                </p>

                <div className={cn(
                  'mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-colors',
                  isPopular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-blue-600 hover:text-white'
                )}>
                  Comprar
                  <ExternalLink className="h-3.5 w-3.5" />
                </div>
              </a>
            )
          })}
        </div>
        <p className="mt-3 text-center text-xs text-gray-400">
          Ao clicar em "Comprar" você será redirecionado para o checkout seguro da Cakto.
          Após a confirmação do pagamento, seus créditos serão ativados automaticamente.
        </p>
      </div>

      {/* ── Upgrade plan ── */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-purple-700 p-6 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Prefere créditos que renovam todo mês?</p>
            <p className="mt-1 text-sm text-blue-200">
              Plano Pro: 100 créditos/mês · Plano Studio: 300 créditos/mês
            </p>
          </div>
          <Link
            href="/plans"
            className="flex flex-shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
          >
            Ver planos <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* ── Transaction history ── */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Histórico recente</h2>
        <Card className="overflow-hidden">
          {txLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-10 text-center">
              <Clock className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-400">Nenhuma transação registrada ainda.</p>
              <p className="mt-0.5 text-xs text-gray-400">
                As transações aparecerão aqui conforme você usa a IA.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {transactions.map((tx) => {
                const isPositive = tx.amount > 0
                return (
                  <div key={tx.id} className="flex items-center gap-4 px-6 py-3.5">
                    <div className={cn(
                      'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                      isPositive ? 'bg-green-100' : 'bg-blue-100'
                    )}>
                      {isPositive
                        ? <TrendingUp className="h-4 w-4 text-green-600" />
                        : <Zap className="h-4 w-4 text-blue-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{txLabel(tx)}</p>
                      <p className="text-xs text-gray-400">{formatDate(tx.created_at)}</p>
                    </div>
                    <span className={cn(
                      'flex-shrink-0 text-sm font-bold',
                      isPositive ? 'text-green-600' : 'text-gray-600'
                    )}>
                      {isPositive ? '+' : ''}{tx.amount}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

    </div>
  )
}
