'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useStudents } from '@/hooks/useStudents'
import * as financialDb from '@/lib/db/financial'
import * as paymentsDb  from '@/lib/db/payments'
import type {
  StudentFinancial,
  Payment,
  PaymentStatus,
  CreatePaymentInput,
  UpdatePaymentInput,
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
    year:  'numeric',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudentFinancialRow {
  student:        Student
  financial:      StudentFinancial | null
  currentPayment: Payment | null
  status:         PaymentStatus | null
  dueDate:        string | null
}

export interface FinancialSummary {
  revenue:           number
  forecast:          number
  paidCount:         number
  pendingCount:      number
  overdueCount:      number
  totalWithSettings: number
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFinancial() {
  const { user } = useAuth()
  const { students, loading: studentsLoading } = useStudents()

  const [allFinancial,   setAllFinancial]   = useState<StudentFinancial[]>([])
  const [allPayments,    setAllPayments]    = useState<Payment[]>([])
  const [selectedMonth,  setSelectedMonth]  = useState<string>(currentYearMonth())
  const [loading,        setLoading]        = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [fin, pays] = await Promise.all([
        financialDb.getAllFinancial(user.id),
        paymentsDb.getAllPayments(user.id),
      ])
      setAllFinancial(fin)
      setAllPayments(pays)
    } catch (err) {
      console.error('[useFinancial] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!studentsLoading) load()
  }, [load, studentsLoading])

  // ── Per-student view ──────────────────────────────────────────────────────

  const rows = useMemo<StudentFinancialRow[]>(() => {
    return students.map((student) => {
      const financial     = allFinancial.find((f) => f.studentId === student.id) ?? null
      const currentPayment = allPayments.find(
        (p) => p.studentId === student.id && p.referenceMonth === selectedMonth
      ) ?? null

      if (!financial) {
        return { student, financial: null, currentPayment: null, status: null, dueDate: null }
      }

      const dueDate = paymentsDb.getDueDateForMonth(financial.dueDayOfMonth, selectedMonth)
      const status  = paymentsDb.computeStatusForMonth(financial, currentPayment, selectedMonth)
      return { student, financial, currentPayment, status, dueDate }
    })
  }, [students, allFinancial, allPayments, selectedMonth])

  // ── Summary ───────────────────────────────────────────────────────────────

  const summary = useMemo<FinancialSummary>(() => {
    const withSettings = rows.filter((r) => r.financial !== null)
    const paid    = withSettings.filter((r) => r.status === 'pago')
    const pending = withSettings.filter((r) => r.status === 'pendente')
    const overdue = withSettings.filter((r) => r.status === 'atrasado')

    const revenue  = paid.reduce((s, r) => s + (r.currentPayment?.amount ?? r.financial!.monthlyFee), 0)
    const forecast = withSettings.reduce((s, r) => s + r.financial!.monthlyFee, 0)

    return {
      revenue,
      forecast,
      paidCount:         paid.length,
      pendingCount:      pending.length,
      overdueCount:      overdue.length,
      totalWithSettings: withSettings.length,
    }
  }, [rows])

  // ── Payment actions ───────────────────────────────────────────────────────

  const registerPayment = useCallback(
    (data: Omit<CreatePaymentInput, 'teacherId'>): Payment => {
      if (!user) throw new Error('Usuário não autenticado.')
      const existing = allPayments.find(
        (p) => p.studentId === data.studentId && p.referenceMonth === data.referenceMonth
      )
      if (existing) {
        const updated = paymentsDb.applyUpdate(existing, {
          paidAt:  data.paidAt,
          amount:  data.amount,
          notes:   data.notes,
          dueDate: data.dueDate,
        })
        setAllPayments((prev) => prev.map((p) => (p.id === existing.id ? updated : p)))
        paymentsDb.updatePayment(updated).catch(() => load())
        return updated
      }
      const payment = paymentsDb.buildPayment({ ...data, teacherId: user.id })
      setAllPayments((prev) => [...prev, payment])
      paymentsDb.createPayment(payment).catch(() => load())
      return payment
    },
    [user, allPayments, load]
  )

  const updatePayment = useCallback((id: string, data: UpdatePaymentInput): Payment => {
    const existing = allPayments.find((p) => p.id === id)
    if (!existing) throw new Error('Pagamento não encontrado.')
    const updated = paymentsDb.applyUpdate(existing, data)
    setAllPayments((prev) => prev.map((p) => (p.id === id ? updated : p)))
    paymentsDb.updatePayment(updated).catch(() => load())
    return updated
  }, [allPayments, load])

  const deletePayment = useCallback((id: string): void => {
    setAllPayments((prev) => prev.filter((p) => p.id !== id))
    paymentsDb.deletePayment(id).catch(() => load())
  }, [load])

  // ── Financial settings ────────────────────────────────────────────────────

  const saveFinancial = useCallback(
    (studentId: string, data: UpdateFinancialInput): StudentFinancial => {
      if (!user) throw new Error('Usuário não autenticado.')
      const existing = allFinancial.find((f) => f.studentId === studentId)
      const record = financialDb.buildFinancial(
        {
          studentId,
          teacherId:      user.id,
          monthlyFee:     data.monthlyFee     ?? existing?.monthlyFee     ?? 0,
          dueDayOfMonth:  data.dueDayOfMonth  ?? existing?.dueDayOfMonth  ?? 10,
          paymentLink:    data.paymentLink    ?? existing?.paymentLink,
          contactLink:    data.contactLink    ?? existing?.contactLink,
        },
        existing?.id,
      )
      setAllFinancial((prev) =>
        prev.some((f) => f.studentId === studentId)
          ? prev.map((f) => (f.studentId === studentId ? record : f))
          : [...prev, record]
      )
      financialDb.upsertFinancial(record).catch(() => load())
      return record
    },
    [user, allFinancial, load]
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
