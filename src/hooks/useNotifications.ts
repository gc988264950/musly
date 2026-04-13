'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import * as db from '@/lib/db/notifications'
import type { Notification, NotificationType } from '@/lib/db/types'

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])

  const load = useCallback(async () => {
    if (!user) return
    const data = await db.getNotifications(user.id).catch(() => [] as Notification[])
    setNotifications(data)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  // Reload when other parts of the app generate alerts
  useEffect(() => {
    const handler = () => load()
    window.addEventListener('harmoniq:notifications-updated', handler)
    return () => window.removeEventListener('harmoniq:notifications-updated', handler)
  }, [load])

  const unreadCount = notifications.filter((n) => !n.read).length

  const add = useCallback(
    async (type: NotificationType, message: string, entityId?: string) => {
      if (!user) return
      await db.createNotification(user.id, type, message, entityId).catch(() => {})
      load()
    },
    [user, load]
  )

  const markAllRead = useCallback(async () => {
    if (!user) return
    await db.markAllRead(user.id).catch(() => {})
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [user])

  const remove = useCallback(
    (id: string) => {
      db.deleteNotification(id).catch(() => {})
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    },
    []
  )

  const clearAll = useCallback(async () => {
    if (!user) return
    await db.clearAllNotifications(user.id).catch(() => {})
    setNotifications([])
  }, [user])

  return { notifications, unreadCount, load, add, markAllRead, remove, clearAll }
}
