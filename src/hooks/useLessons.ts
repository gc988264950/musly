'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import * as db from '@/lib/db/lessons'
import type { Lesson, CreateLessonInput, UpdateLessonInput } from '@/lib/db/types'

export function useLessons() {
  const { user } = useAuth()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await db.getLessons(user.id)
      setLessons(data)
    } catch (err) {
      console.error('[useLessons] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  // ── Derived views ──────────────────────────────────────────────────────────

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
      const lesson = db.buildLesson({ ...data, teacherId: user.id })
      setLessons((prev) => [...prev, lesson])
      db.createLesson(lesson).catch(() => load())
      return lesson
    },
    [user, load]
  )

  const createMany = useCallback(
    (lessonList: Lesson[]): void => {
      setLessons((prev) => [...prev, ...lessonList])
      Promise.all(lessonList.map((l) => db.createLesson(l))).catch(() => load())
    },
    [load]
  )

  const update = useCallback(
    (id: string, data: UpdateLessonInput): Lesson => {
      const existing = lessons.find((l) => l.id === id)
      if (!existing) throw new Error('Aula não encontrada.')
      const updated = db.applyUpdate(existing, data)
      setLessons((prev) => prev.map((l) => (l.id === id ? updated : l)))
      db.updateLesson(updated).catch(() => load())
      return updated
    },
    [lessons, load]
  )

  const remove = useCallback(
    (id: string): void => {
      setLessons((prev) => prev.filter((l) => l.id !== id))
      db.deleteLesson(id).catch(() => load())
    },
    [load]
  )

  return {
    lessons,
    loading,
    load,
    todayLessons,
    thisWeekLessons,
    upcomingLessons,
    create,
    createMany,
    update,
    remove,
  }
}
