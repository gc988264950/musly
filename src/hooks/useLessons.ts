'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import * as db from '@/lib/db/lessons'
import type { Lesson, CreateLessonInput, UpdateLessonInput } from '@/lib/db/types'

/**
 * Manages lesson data for the current teacher.
 *
 * Backed by localStorage now; swap the `db.*` calls inside this hook
 * for async Supabase queries when integrating the backend.
 */
export function useLessons() {
  const { user } = useAuth()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    if (!user) return
    setLessons(db.getLessons(user.id))
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  // ── Derived views (computed from state — no extra queries needed) ──────────

  const todayLessons = lessons
    .filter((l) => l.date === db.todayISO())
    .sort((a, b) => a.time.localeCompare(b.time))

  const thisWeekLessons = (() => {
    const { start, end } = db.thisWeekRange()
    return lessons.filter((l) => l.date >= start && l.date <= end)
  })()

  const upcomingLessons = lessons
    .filter((l) => l.date >= db.todayISO() && l.status === 'agendada')
    .sort((a, b) =>
      a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)
    )

  // ── Mutations ──────────────────────────────────────────────────────────────

  const create = useCallback(
    (data: Omit<CreateLessonInput, 'teacherId'>): Lesson => {
      if (!user) throw new Error('Usuário não autenticado.')
      const lesson = db.createLesson({ ...data, teacherId: user.id })
      setLessons((prev) => [...prev, lesson])
      return lesson
    },
    [user]
  )

  const update = useCallback((id: string, data: UpdateLessonInput): Lesson => {
    const lesson = db.updateLesson(id, data)
    setLessons((prev) => prev.map((l) => (l.id === id ? lesson : l)))
    return lesson
  }, [])

  const remove = useCallback((id: string): void => {
    db.deleteLesson(id)
    setLessons((prev) => prev.filter((l) => l.id !== id))
  }, [])

  return {
    lessons,
    loading,
    load,
    todayLessons,
    thisWeekLessons,
    upcomingLessons,
    create,
    update,
    remove,
  }
}
