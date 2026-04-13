'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import * as studentsDb   from '@/lib/db/students'
import * as lessonsDb    from '@/lib/db/lessons'
import * as notesDb      from '@/lib/db/notes'
import * as progressDb   from '@/lib/db/progress'
import * as repertoireDb from '@/lib/db/repertoire'
import * as plansDb      from '@/lib/db/lessonPlans'
import * as financialDb  from '@/lib/db/financial'
import * as paymentsDb   from '@/lib/db/payments'
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

export function useStudentProfile(studentId: string) {
  const { user } = useAuth()

  const [student,     setStudent]     = useState<Student | null>(null)
  const [lessons,     setLessons]     = useState<Lesson[]>([])
  const [notes,       setNotes]       = useState<StudentNote[]>([])
  const [progress,    setProgress]    = useState<StudentProgress | null>(null)
  const [repertoire,  setRepertoire]  = useState<RepertoireItem[]>([])
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([])
  const [financial,   setFinancial]   = useState<StudentFinancial | null>(null)
  const [payments,    setPayments]    = useState<Payment[]>([])
  const [loading,     setLoading]     = useState(true)
  const [notFound,    setNotFound]    = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, les, nts, prg, rep, pls, fin, pays] = await Promise.all([
        studentsDb.getStudentById(studentId),
        lessonsDb.getLessonsByStudent(studentId),
        notesDb.getNotesByStudent(studentId),
        progressDb.getProgressByStudent(studentId),
        repertoireDb.getRepertoireByStudent(studentId),
        plansDb.getLessonPlansByStudent(studentId),
        financialDb.getFinancialByStudent(studentId),
        paymentsDb.getPaymentsByStudent(studentId),
      ])
      if (!s) { setNotFound(true); return }
      setStudent(s)
      setLessons(les.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)))
      setNotes(nts)
      setProgress(prg)
      setRepertoire(rep)
      setLessonPlans(pls)
      setFinancial(fin)
      setPayments(pays)
    } catch (err) {
      console.error('[useStudentProfile] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => { load() }, [load])

  // ── Student ───────────────────────────────────────────────────────────────

  const updateStudent = useCallback((data: UpdateStudentInput): Student => {
    if (!student) throw new Error('Aluno não carregado.')
    const updated = studentsDb.applyUpdate(student, data)
    setStudent(updated)
    studentsDb.updateStudent(updated).catch(() => load())
    return updated
  }, [student, load])

  // ── Lessons ───────────────────────────────────────────────────────────────

  const updateLesson = useCallback((id: string, data: UpdateLessonInput): Lesson => {
    const existing = lessons.find((l) => l.id === id)
    if (!existing) throw new Error('Aula não encontrada.')
    const updated = lessonsDb.applyUpdate(existing, data)
    setLessons((prev) => prev.map((l) => (l.id === id ? updated : l)))
    lessonsDb.updateLesson(updated).catch(() => load())
    return updated
  }, [lessons, load])

  // ── Notes ─────────────────────────────────────────────────────────────────

  const addNote = useCallback((content: string): StudentNote => {
    if (!user) throw new Error('Usuário não autenticado.')
    const note = notesDb.buildNote({ studentId, teacherId: user.id, content })
    setNotes((prev) => [note, ...prev])
    notesDb.createNote(note).catch(() => load())
    return note
  }, [studentId, user, load])

  const updateNote = useCallback((id: string, data: UpdateNoteInput): StudentNote => {
    const existing = notes.find((n) => n.id === id)
    if (!existing) throw new Error('Anotação não encontrada.')
    const updated = notesDb.applyUpdate(existing, data)
    setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)))
    notesDb.updateNote(updated).catch(() => load())
    return updated
  }, [notes, load])

  const deleteNote = useCallback((id: string): void => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    notesDb.deleteNote(id).catch(() => load())
  }, [load])

  // ── Progress ──────────────────────────────────────────────────────────────

  const saveProgress = useCallback(
    (data: Omit<UpsertProgressInput, 'studentId' | 'teacherId'>): StudentProgress => {
      if (!user) throw new Error('Usuário não autenticado.')
      const updated = progressDb.buildProgress(
        { ...data, studentId, teacherId: user.id },
        progress?.id,
      )
      setProgress(updated)
      progressDb.upsertProgress(updated).catch(() => load())
      return updated
    },
    [studentId, user, progress, load]
  )

  // ── Repertoire ────────────────────────────────────────────────────────────

  const addRepertoireItem = useCallback(
    (data: Omit<CreateRepertoireInput, 'studentId' | 'teacherId'>): RepertoireItem => {
      if (!user) throw new Error('Usuário não autenticado.')
      const item = repertoireDb.buildRepertoireItem({ ...data, studentId, teacherId: user.id })
      setRepertoire((prev) => [item, ...prev])
      repertoireDb.createRepertoireItem(item).catch(() => load())
      return item
    },
    [studentId, user, load]
  )

  const updateRepertoireItem = useCallback(
    (id: string, data: UpdateRepertoireInput): RepertoireItem => {
      const existing = repertoire.find((r) => r.id === id)
      if (!existing) throw new Error('Item não encontrado.')
      const updated = repertoireDb.applyUpdate(existing, data)
      setRepertoire((prev) => prev.map((r) => (r.id === id ? updated : r)))
      repertoireDb.updateRepertoireItem(updated).catch(() => load())
      return updated
    },
    [repertoire, load]
  )

  const deleteRepertoireItem = useCallback((id: string): void => {
    setRepertoire((prev) => prev.filter((r) => r.id !== id))
    repertoireDb.deleteRepertoireItem(id).catch(() => load())
  }, [load])

  // ── Lesson Plans ──────────────────────────────────────────────────────────

  const saveLessonPlan = useCallback(
    (data: Omit<CreateLessonPlanInput, 'studentId' | 'teacherId'>): LessonPlan => {
      if (!user) throw new Error('Usuário não autenticado.')
      const plan = plansDb.buildLessonPlan({ ...data, studentId, teacherId: user.id })
      setLessonPlans((prev) => [plan, ...prev])
      plansDb.createLessonPlan(plan).catch(() => load())
      return plan
    },
    [studentId, user, load]
  )

  const updateLessonPlan = useCallback((id: string, data: UpdateLessonPlanInput): LessonPlan => {
    const existing = lessonPlans.find((p) => p.id === id)
    if (!existing) throw new Error('Plano não encontrado.')
    const updated = plansDb.applyUpdate(existing, data)
    setLessonPlans((prev) => prev.map((p) => (p.id === id ? updated : p)))
    plansDb.updateLessonPlan(updated).catch(() => load())
    return updated
  }, [lessonPlans, load])

  const deleteLessonPlan = useCallback((id: string): void => {
    setLessonPlans((prev) => prev.filter((p) => p.id !== id))
    plansDb.deleteLessonPlan(id).catch(() => load())
  }, [load])

  // ── Financial ─────────────────────────────────────────────────────────────

  const saveFinancial = useCallback(
    (data: Omit<CreateFinancialInput, 'studentId' | 'teacherId'>): StudentFinancial => {
      if (!user) throw new Error('Usuário não autenticado.')
      const record = financialDb.buildFinancial(
        { ...data, studentId, teacherId: user.id },
        financial?.id,
      )
      setFinancial(record)
      financialDb.upsertFinancial(record).catch(() => load())
      return record
    },
    [studentId, user, financial, load]
  )

  const addPayment = useCallback(
    (data: Omit<CreatePaymentInput, 'studentId' | 'teacherId'>): Payment => {
      if (!user) throw new Error('Usuário não autenticado.')
      const existing = payments.find((p) => p.referenceMonth === data.referenceMonth)
      if (existing) {
        const updated = paymentsDb.applyUpdate(existing, {
          paidAt: data.paidAt,
          amount: data.amount,
          notes:  data.notes,
          dueDate: data.dueDate,
        })
        setPayments((prev) => prev.map((p) => (p.id === existing.id ? updated : p)))
        paymentsDb.updatePayment(updated).catch(() => load())
        return updated
      }
      const payment = paymentsDb.buildPayment({ ...data, studentId, teacherId: user.id })
      setPayments((prev) => [payment, ...prev])
      paymentsDb.createPayment(payment).catch(() => load())
      return payment
    },
    [studentId, user, payments, load]
  )

  const editPayment = useCallback((id: string, data: UpdatePaymentInput): Payment => {
    const existing = payments.find((p) => p.id === id)
    if (!existing) throw new Error('Pagamento não encontrado.')
    const updated = paymentsDb.applyUpdate(existing, data)
    setPayments((prev) => prev.map((p) => (p.id === id ? updated : p)))
    paymentsDb.updatePayment(updated).catch(() => load())
    return updated
  }, [payments, load])

  const removePayment = useCallback((id: string): void => {
    setPayments((prev) => prev.filter((p) => p.id !== id))
    paymentsDb.deletePayment(id).catch(() => load())
  }, [load])

  return {
    student, lessons, notes, progress, repertoire, lessonPlans, financial, payments,
    loading, notFound, load,
    updateStudent, updateLesson,
    addNote, updateNote, deleteNote,
    saveProgress,
    addRepertoireItem, updateRepertoireItem, deleteRepertoireItem,
    saveLessonPlan, updateLessonPlan, deleteLessonPlan,
    saveFinancial, addPayment, editPayment, removePayment,
  }
}
