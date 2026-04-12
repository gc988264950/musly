'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import * as studentsDb from '@/lib/db/students'
import * as lessonsDb from '@/lib/db/lessons'
import * as notesDb from '@/lib/db/notes'
import * as progressDb from '@/lib/db/progress'
import * as repertoireDb from '@/lib/db/repertoire'
import * as lessonPlansDb from '@/lib/db/lessonPlans'
import * as financialDb from '@/lib/db/financial'
import * as paymentsDb from '@/lib/db/payments'
import type {
  Student,
  UpdateStudentInput,
  Lesson,
  UpdateLessonInput,
  StudentNote,
  UpdateNoteInput,
  StudentProgress,
  UpsertProgressInput,
  RepertoireItem,
  CreateRepertoireInput,
  UpdateRepertoireInput,
  LessonPlan,
  CreateLessonPlanInput,
  UpdateLessonPlanInput,
  StudentFinancial,
  CreateFinancialInput,
  UpdateFinancialInput,
  Payment,
  CreatePaymentInput,
  UpdatePaymentInput,
} from '@/lib/db/types'

/**
 * Manages all data for a single student profile page.
 *
 * Backed by localStorage now; swap `db.*` calls for async Supabase queries
 * when integrating the backend.
 */
export function useStudentProfile(studentId: string) {
  const { user } = useAuth()

  const [student, setStudent] = useState<Student | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [notes, setNotes] = useState<StudentNote[]>([])
  const [progress, setProgress] = useState<StudentProgress | null>(null)
  const [repertoire, setRepertoire] = useState<RepertoireItem[]>([])
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([])
  const [financial, setFinancial] = useState<StudentFinancial | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(() => {
    const s = studentsDb.getStudentById(studentId)
    if (!s) { setNotFound(true); setLoading(false); return }
    setStudent(s)
    setLessons(
      lessonsDb
        .getLessonsByStudent(studentId)
        .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
    )
    setNotes(notesDb.getNotesByStudent(studentId))
    setProgress(progressDb.getProgressByStudent(studentId))
    setRepertoire(repertoireDb.getRepertoireByStudent(studentId))
    setLessonPlans(lessonPlansDb.getLessonPlansByStudent(studentId))
    setFinancial(financialDb.getFinancialByStudent(studentId))
    setPayments(paymentsDb.getPaymentsByStudent(studentId))
    setLoading(false)
  }, [studentId])

  useEffect(() => {
    load()
  }, [load])

  // ── Student ───────────────────────────────────────────────────────────────

  const updateStudent = useCallback((data: UpdateStudentInput): Student => {
    const updated = studentsDb.updateStudent(studentId, data)
    setStudent(updated)
    return updated
  }, [studentId])

  // ── Lessons ───────────────────────────────────────────────────────────────

  const updateLesson = useCallback((id: string, data: UpdateLessonInput): Lesson => {
    const updated = lessonsDb.updateLesson(id, data)
    setLessons((prev) => prev.map((l) => (l.id === id ? updated : l)))
    return updated
  }, [])

  // ── Notes ─────────────────────────────────────────────────────────────────

  const addNote = useCallback((content: string): StudentNote => {
    if (!user) throw new Error('Usuário não autenticado.')
    const note = notesDb.createNote({ studentId, teacherId: user.id, content })
    setNotes((prev) => [note, ...prev])
    return note
  }, [studentId, user])

  const updateNote = useCallback((id: string, data: UpdateNoteInput): StudentNote => {
    const updated = notesDb.updateNote(id, data)
    setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)))
    return updated
  }, [])

  const deleteNote = useCallback((id: string): void => {
    notesDb.deleteNote(id)
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }, [])

  // ── Progress ──────────────────────────────────────────────────────────────

  const saveProgress = useCallback(
    (data: Omit<UpsertProgressInput, 'studentId' | 'teacherId'>): StudentProgress => {
      if (!user) throw new Error('Usuário não autenticado.')
      const updated = progressDb.upsertProgress({ ...data, studentId, teacherId: user.id })
      setProgress(updated)
      return updated
    },
    [studentId, user]
  )

  // ── Repertoire ────────────────────────────────────────────────────────────

  const addRepertoireItem = useCallback(
    (data: Omit<CreateRepertoireInput, 'studentId' | 'teacherId'>): RepertoireItem => {
      if (!user) throw new Error('Usuário não autenticado.')
      const item = repertoireDb.createRepertoireItem({ ...data, studentId, teacherId: user.id })
      setRepertoire((prev) => [item, ...prev])
      return item
    },
    [studentId, user]
  )

  const updateRepertoireItem = useCallback((id: string, data: UpdateRepertoireInput): RepertoireItem => {
    const updated = repertoireDb.updateRepertoireItem(id, data)
    setRepertoire((prev) => prev.map((r) => (r.id === id ? updated : r)))
    return updated
  }, [])

  const deleteRepertoireItem = useCallback((id: string): void => {
    repertoireDb.deleteRepertoireItem(id)
    setRepertoire((prev) => prev.filter((r) => r.id !== id))
  }, [])

  // ── Lesson Plans (AI) ─────────────────────────────────────────────────────

  const saveLessonPlan = useCallback(
    (data: Omit<CreateLessonPlanInput, 'studentId' | 'teacherId'>): LessonPlan => {
      if (!user) throw new Error('Usuário não autenticado.')
      const plan = lessonPlansDb.createLessonPlan({ ...data, studentId, teacherId: user.id })
      setLessonPlans((prev) => [plan, ...prev])
      return plan
    },
    [studentId, user]
  )

  const updateLessonPlan = useCallback((id: string, data: UpdateLessonPlanInput): LessonPlan => {
    const updated = lessonPlansDb.updateLessonPlan(id, data)
    setLessonPlans((prev) => prev.map((p) => (p.id === id ? updated : p)))
    return updated
  }, [])

  const deleteLessonPlan = useCallback((id: string): void => {
    lessonPlansDb.deleteLessonPlan(id)
    setLessonPlans((prev) => prev.filter((p) => p.id !== id))
  }, [])

  // ── Financial ─────────────────────────────────────────────────────────────

  const saveFinancial = useCallback(
    (data: Omit<CreateFinancialInput, 'studentId' | 'teacherId'>): StudentFinancial => {
      if (!user) throw new Error('Usuário não autenticado.')
      const record = financialDb.upsertFinancial({ ...data, studentId, teacherId: user.id })
      setFinancial(record)
      return record
    },
    [studentId, user]
  )

  const addPayment = useCallback(
    (data: Omit<CreatePaymentInput, 'studentId' | 'teacherId'>): Payment => {
      if (!user) throw new Error('Usuário não autenticado.')
      // One payment per student-month: update if exists, create if not
      const existing = payments.find(
        (p) => p.referenceMonth === data.referenceMonth
      )
      let payment: Payment
      if (existing) {
        payment = paymentsDb.updatePayment(existing.id, {
          paidAt: data.paidAt,
          amount: data.amount,
          notes: data.notes,
          dueDate: data.dueDate,
        })
        setPayments((prev) => prev.map((p) => (p.id === existing.id ? payment : p)))
      } else {
        payment = paymentsDb.createPayment({ ...data, studentId, teacherId: user.id })
        setPayments((prev) => [payment, ...prev])
      }
      return payment
    },
    [studentId, user, payments]
  )

  const editPayment = useCallback((id: string, data: UpdatePaymentInput): Payment => {
    const updated = paymentsDb.updatePayment(id, data)
    setPayments((prev) => prev.map((p) => (p.id === id ? updated : p)))
    return updated
  }, [])

  const removePayment = useCallback((id: string): void => {
    paymentsDb.deletePayment(id)
    setPayments((prev) => prev.filter((p) => p.id !== id))
  }, [])

  return {
    student,
    lessons,
    notes,
    progress,
    repertoire,
    lessonPlans,
    financial,
    payments,
    loading,
    notFound,
    load,
    updateStudent,
    updateLesson,
    addNote,
    updateNote,
    deleteNote,
    saveProgress,
    addRepertoireItem,
    updateRepertoireItem,
    deleteRepertoireItem,
    saveLessonPlan,
    updateLessonPlan,
    deleteLessonPlan,
    saveFinancial,
    addPayment,
    editPayment,
    removePayment,
  }
}
