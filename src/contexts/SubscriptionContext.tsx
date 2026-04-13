'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getSubscription, setSubscription } from '@/lib/db/subscriptions'
import { getStudents } from '@/lib/db/students'
import { getAllLessonPlansByTeacher } from '@/lib/db/lessonPlans'
import {
  getPlan,
  canAddStudent as _canAddStudent,
  canGenerateAIPlan as _canGenerateAIPlan,
} from '@/lib/plans'
import type { PlanId } from '@/lib/db/types'
import type { PlanConfig } from '@/lib/plans'

// Re-export PlanConfig for consumers
export type { PlanConfig }

// ─── Helper ───────────────────────────────────────────────────────────────────

function currentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// ─── Context types ────────────────────────────────────────────────────────────

interface SubscriptionContextValue {
  planId: PlanId
  plan: ReturnType<typeof getPlan>
  studentsCount: number
  aiPlansThisMonth: number
  canAddStudent: boolean
  canGenerateAIPlan: boolean
  changePlan: (planId: PlanId) => void
  refresh: () => void
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [planId, setPlanId] = useState<PlanId>('free')
  const [revision, setRevision] = useState(0)

  const refresh = useCallback(() => setRevision((r) => r + 1), [])

  // Load plan from storage whenever user or revision changes
  useEffect(() => {
    if (!user) return
    const sub = getSubscription(user.id)
    setPlanId(sub?.planId ?? 'free')
  }, [user, revision])

  // ── Cakto activation check ─────────────────────────────────────────────────
  // On mount (and whenever the user changes), call the activation endpoint to
  // pick up any Cakto payment that was confirmed via webhook while the user
  // was at the checkout page. This runs silently in the background.
  useEffect(() => {
    if (!user?.email) return

    const controller = new AbortController()

    fetch(`/api/subscription/activate?email=${encodeURIComponent(user.email)}`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        const activation = body?.activation
        if (!activation?.planId) return   // no pending activation

        // Apply the Cakto activation to local subscription storage
        setSubscription(user.id, activation.planId, {
          status:             'active',
          startedAt:          activation.activatedAt,
          expiresAt:          activation.expiresAt,
          billingProvider:    'cakto',
          caktoOrderId:       activation.caktoOrderId,
          caktoCustomerEmail: activation.email,
        })
        setPlanId(activation.planId)
        refresh()
      })
      .catch(() => {
        // Ignore fetch errors (e.g. running locally without the API, or offline)
      })

    return () => controller.abort()
  // Only run once per user — not on every revision bump
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email])

  // Compute usage counts — re-runs when revision bumps (after student create/delete or plan save)
  const { studentsCount, aiPlansThisMonth } = useMemo(() => {
    if (!user) return { studentsCount: 0, aiPlansThisMonth: 0 }
    const students = getStudents(user.id)
    const ym = currentYearMonth()
    const allPlans = getAllLessonPlansByTeacher(user.id)
    const plansThisMonth = allPlans.filter((p) => p.createdAt.startsWith(ym)).length
    return { studentsCount: students.length, aiPlansThisMonth: plansThisMonth }
  }, [user, revision])

  const plan = getPlan(planId)
  const canAdd = _canAddStudent(planId, studentsCount)
  const canGenerate = _canGenerateAIPlan(planId, aiPlansThisMonth)

  const changePlan = useCallback(
    (newPlanId: PlanId) => {
      if (!user) return
      setSubscription(user.id, newPlanId)
      setPlanId(newPlanId)
      refresh()
    },
    [user, refresh]
  )

  return (
    <SubscriptionContext.Provider
      value={{
        planId,
        plan,
        studentsCount,
        aiPlansThisMonth,
        canAddStudent: canAdd,
        canGenerateAIPlan: canGenerate,
        changePlan,
        refresh,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSubscription() {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) throw new Error('useSubscription must be used inside SubscriptionProvider')
  return ctx
}
