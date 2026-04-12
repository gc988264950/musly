// TODO (Supabase): replace localStorage helpers with async Supabase client calls

import { readCollection, upsertItem } from './storage'
import type { UserSettings } from './types'

const KEY = 'harmoniq_user_settings'

function now() {
  return new Date().toISOString()
}

export function getUserSettings(userId: string): UserSettings | null {
  // TODO (Supabase): SELECT * FROM user_settings WHERE user_id = $1 LIMIT 1
  return readCollection<UserSettings>(KEY).find((s) => s.userId === userId) ?? null
}

export function saveUserSettings(
  userId: string,
  data: Partial<Omit<UserSettings, 'id' | 'userId' | 'updatedAt'>>
): UserSettings {
  // TODO (Supabase): INSERT INTO user_settings (...) ... ON CONFLICT (user_id) DO UPDATE SET ...
  const existing = getUserSettings(userId)
  const record: UserSettings = {
    id: existing?.id ?? userId,  // use userId as id for single-record-per-user pattern
    userId,
    firstName: data.firstName ?? existing?.firstName ?? '',
    lastName: data.lastName ?? existing?.lastName ?? '',
    email: data.email ?? existing?.email ?? '',
    teachingMethod: data.teachingMethod ?? existing?.teachingMethod ?? '',
    updatedAt: now(),
  }
  return upsertItem<UserSettings>(KEY, record)
}
