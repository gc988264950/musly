import { createClient } from '@/lib/supabase/client'
import type { StudentFinancial, CreateFinancialInput, UpdateFinancialInput } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(r: any): StudentFinancial {
  return {
    id:             r.id,
    studentId:      r.student_id,
    teacherId:      r.teacher_id,
    monthlyFee:     Number(r.monthly_fee)     ?? 0,
    dueDayOfMonth:  r.due_day_of_month        ?? 10,
    paymentLink:    r.payment_link            ?? undefined,
    contactLink:    r.contact_link            ?? undefined,
    updatedAt:      r.updated_at,
  }
}

export async function getFinancialByStudent(studentId: string): Promise<StudentFinancial | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('student_financial')
    .select()
    .eq('student_id', studentId)
    .maybeSingle()
  if (error) throw error
  return data ? fromRow(data) : null
}

export async function getAllFinancial(teacherId: string): Promise<StudentFinancial[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('student_financial')
    .select()
    .eq('teacher_id', teacherId)
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function upsertFinancial(financial: StudentFinancial): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('student_financial').upsert({
    id:               financial.id,
    teacher_id:       financial.teacherId,
    student_id:       financial.studentId,
    monthly_fee:      financial.monthlyFee,
    due_day_of_month: financial.dueDayOfMonth,
    payment_link:     financial.paymentLink ?? null,
    contact_link:     financial.contactLink ?? null,
    updated_at:       new Date().toISOString(),
  }, { onConflict: 'student_id' })
  if (error) throw error
}

// ─── Builders ─────────────────────────────────────────────────────────────────

export function buildFinancial(
  data: CreateFinancialInput,
  existingId?: string,
): StudentFinancial {
  return {
    id:        existingId ?? crypto.randomUUID(),
    ...data,
    updatedAt: new Date().toISOString(),
  }
}

export function applyUpdate(existing: StudentFinancial, data: UpdateFinancialInput): StudentFinancial {
  return { ...existing, ...data, updatedAt: new Date().toISOString() }
}
