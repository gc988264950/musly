'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import { useAuth }           from '@/contexts/AuthContext'
import { getSubscription }   from '@/lib/db/subscriptions'
import {
  getPlan,
  canAddStudent  as _canAddStudent,
  canGenerateAIPlan as _canGenerateAIPlan,
} from '@/lib/plans'
import { getCreditSummary }  from '@/lib/db/aiCredits'
import { createClient }      from '@/lib/supabase/client'
import type { PlanId }       from '@/lib/db/types'
import type { PlanConfig }   from '@/lib/plans'
import type { AICreditSummary } from '@/lib/db/aiCredits'

export type { PlanConfig }

function currentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

interface SubscriptionContextValue {
  planId:            PlanId
  plan:              ReturnType<typeof getPlan>
  studentsCount:     number
  aiPlansThisMonth:  number
  canAddStudent:     boolean
  canGenerateAIPlan: boolean
  aiCredits:         AICreditSummary | null
  changePlan:        (planId: PlanId) => void
  refresh:           () => void
  refreshCredits:    () => void
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [planId,           setPlanId]           = useState<PlanId>('free')
  const [studentsCount,    setStudentsCount]    = useState(0)
  const [aiPlansThisMonth, setAiPlansThisMonth] = useState(0)
  const [aiCredits,        setAiCredits]        = useState<AICreditSummary | null>(null)
  const [revision,         setRevision]         = useState(0)
  const [creditRevision,   setCreditRevision]   = useState(0)

  const refresh        = useCallback(() => setRevision((r) => r + 1), [])
  const refreshCredits = useCallback(() => setCreditRevision((r) => r + 1), [])

  // Load plan from Supabase
  useEffect(() => {
    if (!user) return
    getSubscription(user.id)
      .then((sub) => setPlanId(sub?.planId ?? 'free'))
      .catch(() => setPlanId('free'))
  }, [user, revision])

  // Load usage counts from Supabase
  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    const ym = currentYearMonth()

    Promise.all([
      supabase.from('students').select('id', { count: 'exact', head: true }).eq('teacher_id', user.id),
      supabase.from('lesson_plans').select('id', { count: 'exact', head: true })
        .eq('teacher_id', user.id)
        .gte('created_at', `${ym}-01`),
    ]).then(([studentsRes, plansRes]) => {
      setStudentsCount(studentsRes.count ?? 0)
      setAiPlansThisMonth(plansRes.count ?? 0)
    }).catch(() => {/* ignore */})
  }, [user, revision])

  // Load AI credit summary
  useEffect(() => {
    if (!user) return
    getCreditSummary(user.id, planId)
      .then(setAiCredits)
      .catch(() => setAiCredits(null))
  }, [user, planId, revision, creditRevision])

  // Cakto activation check on mount
  useEffect(() => {
    if (!user?.email) return
    const controller = new AbortController()

    fetch('/api/subscription/activate', {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then(async (body) => {
        const activation = body?.activation
        if (!activation?.planId) return
        refresh()
      })
      .catch(() => {/* ignore */})

    return () => controller.abort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email])

  const plan        = getPlan(planId)
  const canAdd      = _canAddStudent(planId, studentsCount)
  const canGenerate = _canGenerateAIPlan(planId, aiPlansThisMonth)

  const changePlan = useCallback(
    async (newPlanId: PlanId) => {
      if (!user) return
      const { setSubscription } = await import('@/lib/db/subscriptions')
      await setSubscription(user.id, newPlanId).catch(() => {/* ignore */})
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
        canAddStudent:     canAdd,
        canGenerateAIPlan: canGenerate,
        aiCredits,
        changePlan,
        refresh,
        refreshCredits,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) throw new Error('useSubscription must be used inside SubscriptionProvider')
  return ctx
}
