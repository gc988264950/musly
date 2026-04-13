import { createClient } from '@/lib/supabase/client'
import type { UserSettings } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(r: any): UserSettings {
  return {
    id:             r.id,
    userId:         r.user_id,
    firstName:      r.first_name      ?? '',
    lastName:       r.last_name       ?? '',
    email:          r.email           ?? '',
    teachingMethod: r.teaching_method ?? '',
    updatedAt:      r.updated_at,
  }
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_settings')
    .select()
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data ? fromRow(data) : null
}

export async function saveUserSettings(
  userId: string,
  data: Partial<Omit<UserSettings, 'id' | 'userId' | 'updatedAt'>>,
  existing?: UserSettings | null,
): Promise<UserSettings> {
  const supabase = createClient()
  const now = new Date().toISOString()

  const record = {
    user_id:         userId,
    first_name:      data.firstName      ?? existing?.firstName      ?? '',
    last_name:       data.lastName       ?? existing?.lastName       ?? '',
    email:           data.email          ?? existing?.email          ?? '',
    teaching_method: data.teachingMethod ?? existing?.teachingMethod ?? '',
    updated_at:      now,
  }

  const { data: row, error } = await supabase
    .from('user_settings')
    .upsert(record, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) throw error
  return fromRow(row)
}
