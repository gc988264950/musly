'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import * as db from '@/lib/db/students'
import type { Student, CreateStudentInput, UpdateStudentInput } from '@/lib/db/types'

export function useStudents() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await db.getStudents(user.id)
      setStudents(data)
    } catch (err) {
      console.error('[useStudents] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  /**
   * Creates a student record.
   * - Applies an optimistic update so the UI responds immediately.
   * - Awaits the DB write and rolls back if it fails.
   * - Throws on DB error so the caller (handleSave) can show a message.
   */
  const create = useCallback(
    async (data: Omit<CreateStudentInput, 'teacherId'>): Promise<Student> => {
      if (!user) throw new Error('Usuário não autenticado.')

      const student = db.buildStudent({ ...data, teacherId: user.id })

      // Optimistic: add to list immediately for snappy UX
      setStudents((prev) =>
        [...prev, student].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      )

      try {
        await db.createStudent(student)
        return student
      } catch (err) {
        console.error('[useStudents] create failed — rolling back optimistic update:', err)
        // Roll back so the student doesn't appear in the list without being saved
        setStudents((prev) => prev.filter((s) => s.id !== student.id))
        throw err   // propagate so the form can show the error
      }
    },
    [user],
  )

  const update = useCallback(
    async (id: string, data: UpdateStudentInput): Promise<Student> => {
      const existing = students.find((s) => s.id === id)
      if (!existing) throw new Error('Aluno não encontrado.')

      const updated = db.applyUpdate(existing, data)

      setStudents((prev) =>
        prev
          .map((s) => (s.id === id ? updated : s))
          .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      )

      try {
        await db.updateStudent(updated)
        return updated
      } catch (err) {
        console.error('[useStudents] update failed — rolling back:', err)
        setStudents((prev) => prev.map((s) => (s.id === id ? existing : s)))
        throw err
      }
    },
    [students],
  )

  const remove = useCallback(
    (id: string): void => {
      setStudents((prev) => prev.filter((s) => s.id !== id))
      db.deleteStudent(id).catch((err) => {
        console.error('[useStudents] delete failed:', err)
        load()
      })
    },
    [load],
  )

  return { students, loading, load, create, update, remove }
}
