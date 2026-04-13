import { createClient } from '@/lib/supabase/client'
import type { RepertoireItem, CreateRepertoireInput, UpdateRepertoireInput } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(r: any): RepertoireItem {
  return {
    id:        r.id,
    studentId: r.student_id,
    teacherId: r.teacher_id,
    title:     r.title,
    type:      r.type   ?? 'Música',
    status:    r.status ?? 'em andamento',
    notes:     r.notes  ?? '',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export async function getRepertoireByStudent(studentId: string): Promise<RepertoireItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('repertoire_items')
    .select()
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function createRepertoireItem(item: RepertoireItem): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('repertoire_items').insert({
    id:         item.id,
    teacher_id: item.teacherId,
    student_id: item.studentId,
    title:      item.title,
    type:       item.type,
    status:     item.status,
    notes:      item.notes,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  })
  if (error) throw error
}

export async function updateRepertoireItem(item: RepertoireItem): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('repertoire_items')
    .update({
      title:      item.title,
      type:       item.type,
      status:     item.status,
      notes:      item.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', item.id)
  if (error) throw error
}

export async function deleteRepertoireItem(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('repertoire_items').delete().eq('id', id)
  if (error) throw error
}

// ─── Builders ─────────────────────────────────────────────────────────────────

export function buildRepertoireItem(
  data: CreateRepertoireInput,
  id = crypto.randomUUID(),
): RepertoireItem {
  const now = new Date().toISOString()
  return { id, ...data, createdAt: now, updatedAt: now }
}

export function applyUpdate(existing: RepertoireItem, data: UpdateRepertoireInput): RepertoireItem {
  return { ...existing, ...data, updatedAt: new Date().toISOString() }
}
