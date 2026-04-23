/**
 * GET /api/admin/system/overview
 * Returns aggregate stats for the admin dashboard.
 */
import { NextResponse } from 'next/server'
import { requireAdmin }  from '../_auth'

export const dynamic = 'force-dynamic'

function currentMonth() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.res
  const db = auth.db

  // ── 1. Auth users ────────────────────────────────────────────────────────────
  const { data: { users: allUsers } } = await db.auth.admin.listUsers({ perPage: 1000 })

  const teachers = allUsers.filter(
    (u) => u.user_metadata?.role !== 'aluno' && !u.banned_until,
  )
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const active7d = teachers.filter(
    (u) => u.last_sign_in_at && new Date(u.last_sign_in_at) >= sevenDaysAgo,
  ).length

  // ── 2. Subscriptions ─────────────────────────────────────────────────────────
  const { data: subs } = await db.from('subscriptions').select('user_id, plan_id, status')
  const planMap: Record<string, string> = {}
  subs?.forEach((s) => { planMap[s.user_id] = s.plan_id })

  const byPlan = { free: 0, pro: 0, studio: 0 } as Record<string, number>
  teachers.forEach((t) => {
    const p = planMap[t.id] ?? 'free'
    byPlan[p] = (byPlan[p] ?? 0) + 1
  })

  // ── 3. Students ──────────────────────────────────────────────────────────────
  const { count: totalStudents } = await db
    .from('students')
    .select('*', { count: 'exact', head: true })

  // ── 4. Revenue ───────────────────────────────────────────────────────────────
  const { data: payments } = await db
    .from('payments')
    .select('amount, paid_at')
    .not('paid_at', 'is', null)

  const totalRevenue = payments?.reduce((s, p) => s + (p.amount ?? 0), 0) ?? 0

  // Monthly revenue for chart (last 6 months)
  const monthlyRevenue: Record<string, number> = {}
  payments?.forEach((p) => {
    if (!p.paid_at) return
    const m = (p.paid_at as string).substring(0, 7)
    monthlyRevenue[m] = (monthlyRevenue[m] ?? 0) + (p.amount ?? 0)
  })

  // This month's revenue
  const cm = currentMonth()
  const revenueThisMonth = monthlyRevenue[cm] ?? 0

  // Build ordered array for chart (last 6 months)
  const monthlyChart = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { month: key, amount: monthlyRevenue[key] ?? 0 }
  })

  // ── 5. AI credits ────────────────────────────────────────────────────────────
  const { data: creditRows } = await db
    .from('ai_credit_usage')
    .select('credits_used, month')

  const totalCredits = creditRows?.reduce((s, c) => s + (c.credits_used ?? 0), 0) ?? 0
  const creditsThisMonth = creditRows
    ?.filter((c) => c.month === cm)
    .reduce((s, c) => s + (c.credits_used ?? 0), 0) ?? 0

  // Monthly credits for chart
  const monthlyCredits: Record<string, number> = {}
  creditRows?.forEach((c) => {
    monthlyCredits[c.month] = (monthlyCredits[c.month] ?? 0) + (c.credits_used ?? 0)
  })
  const creditsChart = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { month: key, used: monthlyCredits[key] ?? 0 }
  })

  return NextResponse.json({
    teachers: {
      total:    teachers.length,
      active7d,
      byPlan,
    },
    students: {
      total: totalStudents ?? 0,
      avgPerTeacher: teachers.length
        ? Math.round((totalStudents ?? 0) / teachers.length * 10) / 10
        : 0,
    },
    revenue: {
      total:        totalRevenue,
      thisMonth:    revenueThisMonth,
      monthlyChart,
    },
    ai: {
      total:        totalCredits,
      thisMonth:    creditsThisMonth,
      creditsChart,
    },
  })
}
