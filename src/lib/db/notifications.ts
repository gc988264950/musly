// TODO (Supabase): replace localStorage helpers with async Supabase client calls

import { readCollection, upsertItem, removeItem, writeCollection } from './storage'
import type { Notification, NotificationType } from './types'

const KEY = 'harmoniq_notifications'
const MAX_NOTIFICATIONS = 50

function now() {
  return new Date().toISOString()
}

export function getNotifications(userId: string): Notification[] {
  // TODO (Supabase): SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC
  return readCollection<Notification>(KEY)
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getUnreadCount(userId: string): number {
  return getNotifications(userId).filter((n) => !n.read).length
}

export function createNotification(
  userId: string,
  type: NotificationType,
  message: string,
  entityId?: string
): Notification {
  // TODO (Supabase): INSERT INTO notifications (...) VALUES (...)
  const notification: Notification = {
    id: crypto.randomUUID(),
    userId,
    type,
    message,
    entityId,
    read: false,
    createdAt: now(),
  }
  upsertItem<Notification>(KEY, notification)

  // Keep only last MAX_NOTIFICATIONS per user
  const all = readCollection<Notification>(KEY)
  const userNotifs = all
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  if (userNotifs.length > MAX_NOTIFICATIONS) {
    const toRemove = new Set(userNotifs.slice(MAX_NOTIFICATIONS).map((n) => n.id))
    writeCollection<Notification>(KEY, all.filter((n) => !toRemove.has(n.id)))
  }

  return notification
}

export function markAllRead(userId: string): void {
  // TODO (Supabase): UPDATE notifications SET read = true WHERE user_id = $1
  const all = readCollection<Notification>(KEY)
  writeCollection<Notification>(
    KEY,
    all.map((n) => (n.userId === userId ? { ...n, read: true } : n))
  )
}

export function markRead(id: string): void {
  // TODO (Supabase): UPDATE notifications SET read = true WHERE id = $1
  const all = readCollection<Notification>(KEY)
  writeCollection<Notification>(
    KEY,
    all.map((n) => (n.id === id ? { ...n, read: true } : n))
  )
}

export function deleteNotification(id: string): void {
  removeItem<Notification>(KEY, id)
}

export function clearAllNotifications(userId: string): void {
  const all = readCollection<Notification>(KEY)
  writeCollection<Notification>(KEY, all.filter((n) => n.userId !== userId))
}
