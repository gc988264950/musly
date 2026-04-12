// TODO (Supabase): replace localStorage helpers with async Supabase client calls

import { readCollection, upsertItem, removeItem, removeManyWhere } from './storage'
import type { RepertoireItem, CreateRepertoireInput, UpdateRepertoireInput } from './types'

const KEY = 'harmoniq_repertoire'

function now() {
  return new Date().toISOString()
}

export function getRepertoireByStudent(studentId: string): RepertoireItem[] {
  // TODO (Supabase): SELECT * FROM repertoire WHERE student_id = $1 ORDER BY created_at DESC
  return readCollection<RepertoireItem>(KEY)
    .filter((r) => r.studentId === studentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function createRepertoireItem(data: CreateRepertoireInput): RepertoireItem {
  // TODO (Supabase): INSERT INTO repertoire (...) VALUES (...) RETURNING *
  const item: RepertoireItem = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: now(),
    updatedAt: now(),
  }
  return upsertItem<RepertoireItem>(KEY, item)
}

export function updateRepertoireItem(id: string, data: UpdateRepertoireInput): RepertoireItem {
  // TODO (Supabase): UPDATE repertoire SET ... WHERE id = $1 RETURNING *
  const items = readCollection<RepertoireItem>(KEY)
  const existing = items.find((r) => r.id === id)
  if (!existing) throw new Error('Item de repertório não encontrado.')
  const updated: RepertoireItem = { ...existing, ...data, updatedAt: now() }
  return upsertItem<RepertoireItem>(KEY, updated)
}

export function deleteRepertoireItem(id: string): void {
  // TODO (Supabase): DELETE FROM repertoire WHERE id = $1
  removeItem<RepertoireItem>(KEY, id)
}

export function deleteRepertoireByStudent(studentId: string): void {
  // TODO (Supabase): DELETE FROM repertoire WHERE student_id = $1
  removeManyWhere<RepertoireItem>(KEY, (r) => r.studentId === studentId)
}
