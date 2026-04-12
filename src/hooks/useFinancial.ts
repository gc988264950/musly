'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useStudents } from '@/hooks/useStudents'
import * as financialDb from '@/lib/db/financial'
import * as paymentsDb from '@/lib/db/payments'
import type {
  StudentFinancial,
  Payment,
  PaymentStatus,
  CreatePaymentInput,
  UpdatePaymentInput,
  CreateFinancialInput,
  UpdateFinancialInput,
  Student,
} from '@/lib/db/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function currentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function addMonths(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function formatMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const label = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudentFinancialRow {
  student: Student
  financial: StudentFinancial | null
  currentPayment: Payment | null     // payment record for the selected month
  status: PaymentStatus | null        // null when no financial settings
  dueDate: string | null              // "YYYY-MM-DD" for selected month
}

export interface FinancialSummary {
  revenue: number         // total paid in selected month
  forecast: number        // total monthly fees for all students with settings
  paidCount: number
  pendingCount: number
  overdueCount: number
  totalWithSettings: number
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Aggregates financial data across all students for the billing dashboard.
 *
 * Backed by localStorage now; swap `db.*` calls for async Supabase queries
 * when integrating the backend.
 */
export function useFinancial() {
  const { user } = useAuth()
  const { students, loading: studentsLoading } = useStudents()

  const [allFinancial, setAllFinancial] = useState<StudentFinancial[]>([])
  const [allPayments, setAllPayments] = useState<Payment[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth())
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    if (!user) return
    setAllFinancial(financialDb.getAllFinancial(user.id))
    setAllPayments(paymentsDb.getAllPayments(user.id))
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (!studentsLoading) load()
  }, [load, studentsLoading])

  // ── Per-student view for selected month ───────────────────────────────────

  const rows = useMemo<StudentFinancialRow[]>(() => {
    return students.map((student) => {
      const financial = allFinancial.find((f) => f.studentId === student.id) ?? null
      const currentPayment =
        allPayments.find(
          (p) => p.studentId === student.id && p.referenceMonth === selectedMonth
        ) ?? null

      if (!financial) {
        return { student, financial: null, currentPayment: null, status: null, dueDate: null }
      }

      const dueDate = paymentsDb.getDueDateForMonth(financial.dueDayOfMonth, selectedMonth)
      const status = paymentsDb.computeStatusForMonth(financial, currentPayment, selectedMonth)
      return { student, financial, currentPayment, status, dueDate }
    })
  }, [students, allFinancial, allPayments, selectedMonth])

  // ── Summary statistics ────────────────────────────────────────────────────

  const summary = useMemo<FinancialSummary>(() => {
    const withSettings = rows.filter((r) => r.financial !== null)
    const paid = withSettings.filter((r) => r.status === 'pago')
    const pending = withSettings.filter((r) => r.status === 'pendente')
    const overdue = withSettings.filter((r) => r.status === 'atrasado')

    const revenue = paid.reduce((sum, r) => {
      return sum + (r.currentPayment?.amount ?? r.financial!.monthlyFee)
    }, 0)

    const forecast = withSettings.reduce((sum, r) => sum + r.financial!.monthlyFee, 0)

    return {
      revenue,
      forecast,
      paidCount: paid.length,
      pendingCount: pending.length,
      overdueCount: overdue.length,
      totalWithSettings: withSettings.length,
    }
  }, [rows])

  // ── Payment actions ───────────────────────────────────────────────────────

  const registerPayment = useCallback(
    (data: Omit<CreatePaymentInput, 'teacherId'>): Payment => {
      if (!user) throw new Error('Usuário não autenticado.')
      // Check for existing payment for this student+month and replace it
      const existing = allPayments.find(
        (p) => p.studentId === data.studentId && p.referenceMonth === data.referenceMonth
      )
      let payment: Payment
      if (existing) {
        payment = paymentsDb.updatePayment(existing.id, {
          paidAt: data.paidAt,
          amount: data.amount,
          notes: data.notes,
          dueDate: data.dueDate,
        })
        setAllPayments((prev) => prev.map((p) => (p.id === existing.id ? payment : p)))
      } else {
        payment = paymentsDb.createPayment({ ...data, teacherId: user.id })
        setAllPayments((prev) => [...prev, payment])
      }
      return payment
    },
    [user, allPayments]
  )

  const updatePayment = useCallback((id: string, data: UpdatePaymentInput): Payment => {
    const updated = paymentsDb.updatePayment(id, data)
    setAllPayments((prev) => prev.map((p) => (p.id === id ? updated : p)))
    return updated
  }, [])

  const deletePayment = useCallback((id: string): void => {
    paymentsDb.deletePayment(id)
    setAllPayments((prev) => prev.filter((p) => p.id !== id))
  }, [])

  // ── Financial settings actions ────────────────────────────────────────────

  const saveFinancial = useCallback(
    (studentId: string, data: UpdateFinancialInput): StudentFinancial => {
      if (!user) throw new Error('Usuário não autenticado.')
      const existing = allFinancial.find((f) => f.studentId === studentId)
      let record: StudentFinancial
      if (existing) {
        record = financialDb.updateFinancial(studentId, data)!
      } else {
        record = financialDb.upsertFinancial({
          studentId,
          teacherId: user.id,
          monthlyFee: data.monthlyFee ?? 0,
          dueDayOfMonth: data.dueDayOfMonth ?? 10,
        })
      }
      setAllFinancial((prev) =>
        prev.some((f) => f.studentId === studentId)
          ? prev.map((f) => (f.studentId === studentId ? record : f))
          : [...prev, record]
      )
      return record
    },
    [user, allFinancial]
  )

  return {
    rows,
    summary,
    selectedMonth,
    setSelectedMonth,
    loading: loading || studentsLoading,
    load,
    registerPayment,
    updatePayment,
    deletePayment,
    saveFinancial,
  }
}
