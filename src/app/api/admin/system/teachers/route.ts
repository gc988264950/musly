/**
 * GET /api/admin/system/teachers
 * Returns the full teacher list enriched with plan, credit, and student data.
 */
import { NextResponse } from 'next/server'
import { requireAdmin }  from '../_auth'

export const dynamic = 'force-dynamic'

function currentMonth() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

const PLAN_CREDITS: Record<string, number> = { free: 10, pro: 100, studio: 300 }

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.res
  const db = auth.db

  const [
    { data: { users: allUsers } },
    { data: subs },
    { data: allStudents },
    { data: creditRows },
    { data: lessonRows },
  ] = await Promise.all([
    db.auth.admin.listUsers({ perPage: 1000 }),
    db.from('subscriptions').select('user_id, plan_id, status, started_at'),
    db.from('students').select('teacher_id'),
    db.from('ai_credit_usage').select('user_id, credits_used, extra_credits, month'),
    db.from('lessons').select('teacher_id'),
  ])

  // Build lookup maps
  const subsMap: Record<string, { plan: string; status: string; startedAt: string }> = {}
  subs?.forEach((s) => {
    subsMap[s.user_id] = { plan: s.plan_id, status: s.status, startedAt: s.started_at }
  })

  const studentsByTeacher: Record<string, number> = {}
  allStudents?.forEach((s) => {
    studentsByTeacher[s.teacher_id] = (studentsByTeacher[s.teacher_id] ?? 0) + 1
  })

  const lessonsByTeacher: Record<string, number> = {}
  lessonRows?.forEach((l) => {
    lessonsByTeacher[l.teacher_id] = (lessonsByTeacher[l.teacher_id] ?? 0) + 1
  })

  const cm = currentMonth()
  // Group credits by user: pick current month first, fallback all-time sum
  const creditsByUser: Record<string, { used: number; extra: number }> = {}
  creditRows?.forEach((c) => {
    if (!creditsByUser[c.user_id]) creditsByUser[c.user_id] = { used: 0, extra: 0 }
    creditsByUser[c.user_id].used  += c.credits_used  ?? 0
    if (c.month === cm) {
      // Current month used is what matters for display — replace cumulative with monthly
      creditsByUser[c.user_id].used  = c.credits_used  ?? 0
      creditsByUser[c.user_id].extra = c.extra_credits ?? 0
    }
  })

  const teachers = allUsers.filter((u) => u.user_metadata?.role !== 'aluno')

  const result = teachers.map((u) => {
    const sub   = subsMap[u.id]
    const plan  = sub?.plan ?? 'free'
    const cred  = creditsByUser[u.id] ?? { used: 0, extra: 0 }

    return {
      id:          u.id,
      email:       u.email ?? '',
      firstName:   u.user_metadata?.firstName ?? u.user_metadata?.given_name ?? '',
      lastName:    u.user_metadata?.lastName  ?? u.user_metadata?.family_name ?? '',
      plan,
      planStatus:  sub?.status ?? 'active',
      creditsUsed: cred.used,
      extraCredits: cred.extra,
      totalCredits: PLAN_CREDITS[plan] ?? 10,
      studentsCount: studentsByTeacher[u.id] ?? 0,
      lessonsCount:  lessonsByTeacher[u.id]  ?? 0,
      createdAt:   u.created_at,
      lastSignIn:  u.last_sign_in_at ?? null,
      banned:      !!u.banned_until,
    }
  })

  // Sort by createdAt desc
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json(result)
}
