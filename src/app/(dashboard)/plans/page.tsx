'use client'

/**
 * Plans page — shows Free / Pro / Studio plan cards.
 *
 * ─── HOW CHECKOUT WORKS ──────────────────────────────────────────────────────
 * 1. Teacher clicks "Assinar Pro" or "Assinar Studio".
 * 2. They are redirected to the Cakto checkout (NEXT_PUBLIC_CAKTO_LINK_*).
 *    The URL includes their email (pre-fill) and userId (external reference).
 * 3. After payment, Cakto redirects back to /plans?plan=pro&cakto=success.
 * 4. This page shows a "Verificando pagamento…" banner and calls the
 *    activate endpoint, which checks for the webhook-confirmed activation.
 * 5. If activation is found, the plan is applied and a success banner shows.
 *
 * ─── TO CONFIGURE ────────────────────────────────────────────────────────────
 * Set these in .env.local:
 *   NEXT_PUBLIC_CAKTO_LINK_PRO=https://pay.cakto.com.br/your-pro-offer
 *   NEXT_PUBLIC_CAKTO_LINK_STUDIO=https://pay.cakto.com.br/your-studio-offer
 * See .env.local.example for the full variable list.
 */

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, Crown, Zap, Star, ExternalLink, X, Loader2, AlertCircle } from 'lucide-react'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { useAuth } from '@/contexts/AuthContext'
import { setSubscription } from '@/lib/db/subscriptions'
import { PLANS } from '@/lib/plans'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { PlanId } from '@/lib/db/types'

// ─── Cakto checkout link config ───────────────────────────────────────────────
// These come from env vars — set in .env.local (see .env.local.example)

const CAKTO_LINKS: Partial<Record<PlanId, string>> = {
  pro:    process.env.NEXT_PUBLIC_CAKTO_LINK_PRO    ?? '',
  studio: process.env.NEXT_PUBLIC_CAKTO_LINK_STUDIO ?? '',
}

// ─── Plan icons ───────────────────────────────────────────────────────────────

const PlanIcon: Record<PlanId, React.ElementType> = {
  free:   Star,
  pro:    Zap,
  studio: Crown,
}

const planGradient: Record<PlanId, string> = {
  free:   'from-gray-400 to-gray-500',
  pro:    'from-[#1a7cfa] to-[#1468d6]',
  studio: 'from-[#1057b0] to-[#0d2d5e]',
}

// ─── Success banner ───────────────────────────────────────────────────────────

function SuccessBanner({ planName, onClose }: { planName: string; onClose: () => void }) {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
        <Check className="h-4 w-4 text-white" />
      </div>
      <p className="flex-1 text-sm font-medium text-green-800">
        Plano <strong>{planName}</strong> ativado com sucesso! Bem-vindo(a).
      </p>
      <button onClick={onClose} className="text-green-600 hover:text-green-800">
        <X size={16} />
      </button>
    </div>
  )
}

// ─── Checking banner ──────────────────────────────────────────────────────────

function CheckingBanner() {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
      <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-blue-500" />
      <p className="text-sm font-medium text-blue-800">
        Verificando pagamento… aguarde um instante.
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PLAN_ORDER: PlanId[] = ['free', 'pro', 'studio']

export default function PlansPage() {
  const { user }                                          = useAuth()
  const { planId, changePlan, studentsCount, aiPlansThisMonth, refresh } = useSubscription()
  const searchParams                                      = useSearchParams()
  const [successPlan,  setSuccessPlan]  = useState<string | null>(null)
  const [checking,     setChecking]     = useState(false)

  // ── Handle return from Cakto checkout ──────────────────────────────────────
  // Cakto redirects to /plans?plan=pro&cakto=success after successful payment.
  // Configure this URL in your Cakto product's "URL de redirecionamento" field.
  useEffect(() => {
    const caktoStatus = searchParams.get('cakto')
    const returnPlan  = searchParams.get('plan') as PlanId | null

    if (caktoStatus !== 'success' || !returnPlan || !user) return

    setChecking(true)

    // Poll the activation endpoint — gives webhook time to arrive (up to 8s)
    let attempts = 0
    const MAX_ATTEMPTS = 4
    const INTERVAL_MS  = 2000

    const poll = async () => {
      attempts++
      try {
        const res  = await fetch(`/api/subscription/activate?email=${encodeURIComponent(user.email)}`)
        const body = res.ok ? await res.json() : null
        const act  = body?.activation

        if (act?.planId) {
          // Apply activation from webhook
          setSubscription(user.id, act.planId, {
            status:             'active',
            startedAt:          act.activatedAt,
            expiresAt:          act.expiresAt,
            billingProvider:    'cakto',
            caktoOrderId:       act.caktoOrderId,
            caktoCustomerEmail: act.email,
          })
          refresh()
          setChecking(false)
          const resolvedPlan = act.planId as PlanId
          setSuccessPlan(PLANS[resolvedPlan]?.name ?? resolvedPlan)
          return
        }
      } catch { /* network error — keep trying */ }

      if (attempts < MAX_ATTEMPTS) {
        setTimeout(poll, INTERVAL_MS)
      } else {
        // Webhook hasn't arrived yet — activate optimistically from the URL param
        // (the webhook will update the server record when it arrives)
        if (returnPlan && returnPlan !== 'free') {
          changePlan(returnPlan)
          setSuccessPlan(PLANS[returnPlan]?.name ?? returnPlan)
        }
        setChecking(false)
      }
    }

    // Small initial delay to give the webhook time to arrive
    setTimeout(poll, 1500)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run once on mount

  // ── Build Cakto checkout URL ───────────────────────────────────────────────
  function getCheckoutUrl(pid: Extract<PlanId, 'pro' | 'studio'>): string {
    const base = CAKTO_LINKS[pid]
    if (!base || !user) return ''
    try {
      const url = new URL(base)
      // Pre-fill buyer email so Cakto webhook can match the user
      url.searchParams.set('email', user.email)
      // Pass userId as external reference for webhook matching
      url.searchParams.set('ref', user.id)
      // Return URL after successful payment — Cakto uses "redirect_url" param
      const returnUrl = `${window.location.origin}/plans?plan=${pid}&cakto=success`
      url.searchParams.set('redirect_url', returnUrl)
      return url.toString()
    } catch {
      return base // fallback: just use the base link
    }
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

      {/* Banners */}
      {checking && <CheckingBanner />}
      {!checking && successPlan && (
        <SuccessBanner planName={successPlan} onClose={() => setSuccessPlan(null)} />
      )}

      {/* Current usage bar (free plan only) */}
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
                    studentsCount >= (PLANS.free.limits.students ?? 0) ? 'bg-red-500' : 'bg-blue-500'
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
                    aiPlansThisMonth >= (PLANS.free.limits.aiPlansPerMonth ?? 0) ? 'bg-red-500' : 'bg-[#1a7cfa]'
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
          const p           = PLANS[pid]
          const Icon        = PlanIcon[pid]
          const isCurrent   = planId === pid
          const isHighlight = p.highlighted
          const isPaid      = pid === 'pro' || pid === 'studio'
          const checkoutUrl = isPaid ? getCheckoutUrl(pid as 'pro' | 'studio') : ''
          const linkMissing = isPaid && !checkoutUrl

          return (
            <div
              key={pid}
              className={cn(
                'relative flex flex-col rounded-2xl border p-6 transition-all',
                isCurrent
                  ? 'border-blue-400 ring-2 ring-blue-400/30 shadow-card-hover'
                  : isHighlight
                  ? 'border-blue-200 shadow-card'
                  : 'border-gray-200 shadow-card'
              )}
            >
              {/* Top badge */}
              {isHighlight && !isCurrent && (
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

              {/* Plan header */}
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
                      className={cn('mt-0.5 flex-shrink-0', pid === 'free' ? 'text-gray-500' : 'text-[#1a7cfa]')}
                    />
                    <span className="text-sm text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              {isCurrent ? (
                /* ── Current plan ── */
                <button
                  disabled
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-sm font-semibold text-gray-500 cursor-default"
                >
                  Plano atual
                </button>

              ) : pid === 'free' ? (
                /* ── Downgrade to free (simulated) ── */
                <button
                  onClick={() => { changePlan('free'); setSuccessPlan('Grátis') }}
                  className="w-full rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Usar plano Grátis
                </button>

              ) : linkMissing ? (
                /* ── Cakto link not configured yet ── */
                <div className="space-y-2">
                  <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                    <p className="text-xs text-amber-700">
                      Configure <code className="font-mono font-bold">NEXT_PUBLIC_CAKTO_LINK_{pid.toUpperCase()}</code> em{' '}
                      <code className="font-mono font-bold">.env.local</code> para ativar este botão.
                    </p>
                  </div>
                  <button
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-400"
                  >
                    Assinar {p.name}
                  </button>
                </div>

              ) : (
                /* ── Paid plan: redirect to Cakto checkout ── */
                <a
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all',
                    isHighlight
                      ? 'bg-[#1a7cfa] text-white shadow-sm hover:bg-[#1468d6]'
                      : 'bg-[#1057b0] text-white shadow-sm hover:bg-[#0d4490]'
                  )}
                >
                  Assinar {p.name}
                  <ExternalLink size={14} className="opacity-70" />
                </a>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-8 space-y-1 text-center text-xs text-gray-400">
        <p>Pagamentos processados com segurança pela <strong>Cakto</strong>.</p>
        <p>Após o pagamento, seu plano é ativado automaticamente em instantes.</p>
      </div>
    </div>
  )
}
