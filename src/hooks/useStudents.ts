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

  const create = useCallback(
    (data: Omit<CreateStudentInput, 'teacherId'>): Student => {
      if (!user) throw new Error('Usuário não autenticado.')
      const student = db.buildStudent({ ...data, teacherId: user.id })
      setStudents((prev) =>
        [...prev, student].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      )
      db.createStudent(student).catch(() => load())
      return student
    },
    [user, load]
  )

  const update = useCallback(
    (id: string, data: UpdateStudentInput): Student => {
      const existing = students.find((s) => s.id === id)
      if (!existing) throw new Error('Aluno não encontrado.')
      const updated = db.applyUpdate(existing, data)
      setStudents((prev) =>
        prev
          .map((s) => (s.id === id ? updated : s))
          .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      )
      db.updateStudent(updated).catch(() => load())
      return updated
    },
    [students, load]
  )

  const remove = useCallback(
    (id: string): void => {
      setStudents((prev) => prev.filter((s) => s.id !== id))
      // ON DELETE CASCADE in DB handles lessons, notes, progress, etc.
      db.deleteStudent(id).catch(() => load())
    },
    [load]
  )

  return { students, loading, load, create, update, remove }
}
