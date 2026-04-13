import { createClient } from '@/lib/supabase/client'
import type { Notification, NotificationType } from './types'

const MAX_NOTIFICATIONS = 50

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(r: any): Notification {
  return {
    id:        r.id,
    userId:    r.user_id,
    type:      r.type,
    message:   r.message,
    entityId:  r.entity_id ?? undefined,
    read:      r.read      ?? false,
    createdAt: r.created_at,
  }
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select()
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(MAX_NOTIFICATIONS)
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)
  if (error) throw error
  return count ?? 0
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  message: string,
  entityId?: string,
): Promise<Notification> {
  const supabase = createClient()
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      id:        crypto.randomUUID(),
      user_id:   userId,
      type,
      message,
      entity_id: entityId ?? null,
      read:      false,
      created_at: now,
    })
    .select()
    .single()
  if (error) throw error
  return fromRow(data)
}

export async function markAllRead(userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
  if (error) throw error
}

export async function markRead(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
  if (error) throw error
}

export async function deleteNotification(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('notifications').delete().eq('id', id)
  if (error) throw error
}

export async function clearAllNotifications(userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)
  if (error) throw error
}
