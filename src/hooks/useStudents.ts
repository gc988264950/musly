'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import * as db from '@/lib/db/students'
import { deleteLessonsByStudent } from '@/lib/db/lessons'
import { deleteNotesByStudent } from '@/lib/db/notes'
import { deleteProgressByStudent } from '@/lib/db/progress'
import { deleteRepertoireByStudent } from '@/lib/db/repertoire'
import { deleteLessonPlansByStudent } from '@/lib/db/lessonPlans'
import { deleteFinancialByStudent } from '@/lib/db/financial'
import { deletePaymentsByStudent } from '@/lib/db/payments'
import type { Student, CreateStudentInput, UpdateStudentInput } from '@/lib/db/types'

/**
 * Manages student data for the current teacher.
 *
 * Backed by localStorage now; swap the `db.*` calls inside this hook
 * for async Supabase queries when integrating the backend.
 */
export function useStudents() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    if (!user) return
    setStudents(db.getStudents(user.id))
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const create = useCallback(
    (data: Omit<CreateStudentInput, 'teacherId'>): Student => {
      if (!user) throw new Error('Usuário não autenticado.')
      const student = db.createStudent({ ...data, teacherId: user.id })
      setStudents((prev) =>
        [...prev, student].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      )
      return student
    },
    [user]
  )

  const update = useCallback((id: string, data: UpdateStudentInput): Student => {
    const student = db.updateStudent(id, data)
    setStudents((prev) =>
      prev
        .map((s) => (s.id === id ? student : s))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    )
    return student
  }, [])

  const remove = useCallback((id: string): void => {
    db.deleteStudent(id)
    deleteLessonsByStudent(id)       // cascade
    deleteNotesByStudent(id)         // cascade
    deleteProgressByStudent(id)      // cascade
    deleteRepertoireByStudent(id)    // cascade
    deleteLessonPlansByStudent(id)   // cascade
    deleteFinancialByStudent(id)     // cascade
    deletePaymentsByStudent(id)      // cascade
    setStudents((prev) => prev.filter((s) => s.id !== id))
  }, [])

  return { students, loading, load, create, update, remove }
}
