import { createClient } from '@/lib/supabase/client'
import type { Payment, PaymentStatus, CreatePaymentInput, UpdatePaymentInput, StudentFinancial } from './types'

// ─── Row mapper ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(r: any): Payment {
  return {
    id:             r.id,
    studentId:      r.student_id,
    teacherId:      r.teacher_id,
    referenceMonth: r.reference_month,
    dueDate:        r.due_date,
    paidAt:         r.paid_at ?? null,
    amount:         Number(r.amount) ?? 0,
    notes:          r.notes ?? '',
    createdAt:      r.created_at,
    updatedAt:      r.updated_at,
  }
}

// ─── Status computation ───────────────────────────────────────────────────────

export function computePaymentStatus(payment: Payment): PaymentStatus {
  if (payment.paidAt) return 'pago'
  const today = new Date().toISOString().split('T')[0]
  return today > payment.dueDate ? 'atrasado' : 'pendente'
}

export function computeStatusForMonth(
  financial: StudentFinancial,
  payment: Payment | null,
  referenceMonth: string,
): PaymentStatus {
  if (payment?.paidAt) return 'pago'
  const dueDate = getDueDateForMonth(financial.dueDayOfMonth, referenceMonth)
  const today = new Date().toISOString().split('T')[0]
  return today > dueDate ? 'atrasado' : 'pendente'
}

export function getDueDateForMonth(dueDayOfMonth: number, referenceMonth: string): string {
  const [y, m] = referenceMonth.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  const day = Math.min(dueDayOfMonth, lastDay)
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getPaymentsByStudent(studentId: string): Promise<Payment[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('payments')
    .select()
    .eq('student_id', studentId)
    .order('due_date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function getPaymentForStudentMonth(
  studentId: string,
  referenceMonth: string,
): Promise<Payment | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('payments')
    .select()
    .eq('student_id', studentId)
    .eq('reference_month', referenceMonth)
    .maybeSingle()
  if (error) throw error
  return data ? fromRow(data) : null
}

export async function getAllPayments(teacherId: string): Promise<Payment[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('payments')
    .select()
    .eq('teacher_id', teacherId)
  if (error) throw error
  return (data ?? []).map(fromRow)
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createPayment(payment: Payment): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('payments').insert({
    id:              payment.id,
    teacher_id:      payment.teacherId,
    student_id:      payment.studentId,
    reference_month: payment.referenceMonth,
    due_date:        payment.dueDate,
    paid_at:         payment.paidAt,
    amount:          payment.amount,
    notes:           payment.notes,
    created_at:      payment.createdAt,
    updated_at:      payment.updatedAt,
  })
  if (error) throw error
}

export async function updatePayment(payment: Payment): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('payments')
    .update({
      reference_month: payment.referenceMonth,
      due_date:        payment.dueDate,
      paid_at:         payment.paidAt,
      amount:          payment.amount,
      notes:           payment.notes,
      updated_at:      new Date().toISOString(),
    })
    .eq('id', payment.id)
  if (error) throw error
}

export async function deletePayment(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('payments').delete().eq('id', id)
  if (error) throw error
}

// ─── Builders ─────────────────────────────────────────────────────────────────

export function buildPayment(
  data: CreatePaymentInput,
  id = crypto.randomUUID(),
): Payment {
  const now = new Date().toISOString()
  return { id, ...data, createdAt: now, updatedAt: now }
}

export function applyUpdate(existing: Payment, data: UpdatePaymentInput): Payment {
  return { ...existing, ...data, updatedAt: new Date().toISOString() }
}
