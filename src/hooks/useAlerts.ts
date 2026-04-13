'use client'

/**
 * useAlerts — Smart alert generator.
 *
 * Runs once per calendar day per user and creates notification records for:
 *   1. Students marked as "needs attention"
 *   2. Students without lessons in 14+ days
 *   3. Students with repeated difficulties (progress record + 3+ lesson plans)
 *   4. Upcoming lessons within the next 60 minutes
 *
 * Uses a dedicated localStorage key to prevent duplicate alerts within the same day.
 * Dispatches `harmoniq:notifications-updated` so every `useNotifications` instance
 * re-loads and shows the new badge count immediately.
 */

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useStudents } from '@/hooks/useStudents'
import { useLessons } from '@/hooks/useLessons'
import * as db from '@/lib/db/notifications'
import { getProgressByStudent } from '@/lib/db/progress'
import { getLessonPlansByStudent } from '@/lib/db/lessonPlans'

// ─── Alert state (dedup) ──────────────────────────────────────────────────────

interface AlertState {
  date: string                      // "YYYY-MM-DD"
  generated: Record<string, true>   // key: "type_entityId"
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function loadState(userId: string): AlertState {
  try {
    const raw = localStorage.getItem(`harmoniq_alert_state_${userId}`)
    if (raw) {
      const parsed = JSON.parse(raw) as AlertState
      if (parsed.date === todayStr()) return parsed
    }
  } catch {
    // ignore parse errors
  }
  return { date: todayStr(), generated: {} }
}

function saveState(userId: string, state: AlertState): void {
  localStorage.setItem(`harmoniq_alert_state_${userId}`, JSON.stringify(state))
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAlerts(): void {
  const { user } = useAuth()
  const { students } = useStudents()
  const { lessons } = useLessons()

  useEffect(() => {
    if (!user || students.length === 0) return

    const run = async () => {
    const state = loadState(user.id)
    const today = new Date()
    const todayIso = todayStr()

    // Fresh day — reset generated set
    if (state.date !== todayIso) {
      state.date = todayIso
      state.generated = {}
    }

    const needsAlert = (key: string) => !state.generated[key]
    const mark = (key: string) => { state.generated[key] = true }

    let generated = 0

    // ── 1. Students needing attention ─────────────────────────────────────────
    for (const student of students) {
      if (student.needsAttention) {
        const key = `needs_attention_${student.id}`
        if (needsAlert(key)) {
          db.createNotification(
            user.id,
            'needs_attention',
            `Aluno "${student.name}" está marcado como precisa de atenção especial.`,
            student.id
          )
          mark(key)
          generated++
        }
      }
    }

    // ── 2. Students without lessons in 14+ days ───────────────────────────────
    for (const student of students) {
      const studentLessons = lessons
        .filter((l) => l.studentId === student.id && l.status !== 'cancelada')
        .sort((a, b) => b.date.localeCompare(a.date))

      const key = `no_lesson_days_${student.id}`
      if (!needsAlert(key)) continue

      if (studentLessons.length === 0) {
        db.createNotification(
          user.id,
          'no_lesson_days',
          `Aluno "${student.name}" ainda não tem nenhuma aula registrada.`,
          student.id
        )
        mark(key)
        generated++
      } else {
        const lastDate = new Date(studentLessons[0].date + 'T00:00:00')
        const daysDiff = Math.floor(
          (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysDiff >= 14) {
          db.createNotification(
            user.id,
            'no_lesson_days',
            `Aluno "${student.name}" está há ${daysDiff} dias sem aulas.`,
            student.id
          )
          mark(key)
          generated++
        }
      }
    }

    // ── 3. Repeated difficulties (progress record + 3+ lesson plans) ──────────
    for (const student of students) {
      const progress = await getProgressByStudent(student.id).catch(() => null)
      if (!progress || progress.identifiedDifficulties.length === 0) continue

      const plans = await getLessonPlansByStudent(student.id).catch(() => [] as import('@/lib/db/types').LessonPlan[])
      if (plans.length < 3) continue

      const key = `repeated_difficulty_${student.id}`
      if (!needsAlert(key)) continue

      const diffText = progress.identifiedDifficulties.slice(0, 2).join(', ')
      db.createNotification(
        user.id,
        'repeated_difficulty',
        `Aluno "${student.name}" apresenta dificuldades recorrentes: ${diffText}.`,
        student.id
      )
      mark(key)
      generated++
    }

    // ── 4. Upcoming lessons (within next 60 minutes) ──────────────────────────
    const nowMs = today.getTime()
    const upcomingLessons = lessons.filter((l) => {
      if (l.status !== 'agendada' || l.date !== todayIso) return false
      const [h, m] = l.time.split(':').map(Number)
      const lessonMs = new Date(
        today.getFullYear(), today.getMonth(), today.getDate(), h, m
      ).getTime()
      const diffMins = (lessonMs - nowMs) / 60_000
      return diffMins >= 0 && diffMins <= 60
    })

    for (const lesson of upcomingLessons) {
      const student = students.find((s) => s.id === lesson.studentId)
      if (!student) continue
      const key = `upcoming_lesson_${lesson.id}`
      if (!needsAlert(key)) continue

      const [h, m] = lesson.time.split(':')
      db.createNotification(
        user.id,
        'upcoming_lesson',
        `Aula de "${student.name}" começa em breve às ${h}h${m !== '00' ? m : ''}.`,
        lesson.id
      )
      mark(key)
      generated++
    }

    saveState(user.id, state)

    // Notify all useNotifications instances to reload
    if (generated > 0) {
      window.dispatchEvent(new CustomEvent('harmoniq:notifications-updated'))
    }
    }

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, students.length, lessons.length])
}
