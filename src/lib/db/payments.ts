// TODO (Supabase): replace localStorage helpers with async Supabase client calls

import { readCollection, upsertItem, removeItem, removeManyWhere } from './storage'
import type { Payment, PaymentStatus, CreatePaymentInput, UpdatePaymentInput, StudentFinancial } from './types'

const KEY = 'harmoniq_payments'

function now() {
  return new Date().toISOString()
}

// ─── Status computation ───────────────────────────────────────────────────────
// Status is never stored — always derived at read time so it stays current.

export function computePaymentStatus(payment: Payment): PaymentStatus {
  if (payment.paidAt) return 'pago'
  const today = new Date().toISOString().split('T')[0]
  return today > payment.dueDate ? 'atrasado' : 'pendente'
}

/**
 * Compute status for a student-month pair even when no Payment record exists yet.
 */
export function computeStatusForMonth(
  financial: StudentFinancial,
  payment: Payment | null,
  referenceMonth: string, // "YYYY-MM"
): PaymentStatus {
  if (payment?.paidAt) return 'pago'
  const dueDate = getDueDateForMonth(financial.dueDayOfMonth, referenceMonth)
  const today = new Date().toISOString().split('T')[0]
  return today > dueDate ? 'atrasado' : 'pendente'
}

/** Returns "YYYY-MM-DD" for a given month and day-of-month, clamped to the last day. */
export function getDueDateForMonth(dueDayOfMonth: number, referenceMonth: string): string {
  const [y, m] = referenceMonth.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  const day = Math.min(dueDayOfMonth, lastDay)
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function getPaymentsByStudent(studentId: string): Payment[] {
  // TODO (Supabase): SELECT * FROM payments WHERE student_id = $1 ORDER BY due_date DESC
  return readCollection<Payment>(KEY)
    .filter((p) => p.studentId === studentId)
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
}

export function getPaymentForStudentMonth(studentId: string, referenceMonth: string): Payment | null {
  // TODO (Supabase): SELECT * FROM payments WHERE student_id = $1 AND reference_month = $2 LIMIT 1
  return (
    readCollection<Payment>(KEY).find(
      (p) => p.studentId === studentId && p.referenceMonth === referenceMonth
    ) ?? null
  )
}

export function getAllPayments(teacherId: string): Payment[] {
  // TODO (Supabase): SELECT * FROM payments WHERE teacher_id = $1
  return readCollection<Payment>(KEY).filter((p) => p.teacherId === teacherId)
}

export function getPaymentsByMonth(teacherId: string, referenceMonth: string): Payment[] {
  // TODO (Supabase): SELECT * FROM payments WHERE teacher_id = $1 AND reference_month = $2
  return readCollection<Payment>(KEY).filter(
    (p) => p.teacherId === teacherId && p.referenceMonth === referenceMonth
  )
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function createPayment(data: CreatePaymentInput): Payment {
  // TODO (Supabase): INSERT INTO payments (...) VALUES (...) RETURNING *
  const payment: Payment = { ...data, id: crypto.randomUUID(), createdAt: now(), updatedAt: now() }
  return upsertItem<Payment>(KEY, payment)
}

export function updatePayment(id: string, data: UpdatePaymentInput): Payment {
  // TODO (Supabase): UPDATE payments SET ... WHERE id = $1 RETURNING *
  const existing = readCollection<Payment>(KEY).find((p) => p.id === id)
  if (!existing) throw new Error('Pagamento não encontrado.')
  const updated: Payment = { ...existing, ...data, updatedAt: now() }
  return upsertItem<Payment>(KEY, updated)
}

export function deletePayment(id: string): void {
  // TODO (Supabase): DELETE FROM payments WHERE id = $1
  removeItem<Payment>(KEY, id)
}

export function deletePaymentsByStudent(studentId: string): void {
  // TODO (Supabase): DELETE FROM payments WHERE student_id = $1
  removeManyWhere<Payment>(KEY, (p) => p.studentId === studentId)
}
