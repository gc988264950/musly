'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import * as db from '@/lib/db/notifications'
import type { Notification, NotificationType } from '@/lib/db/types'

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])

  const load = useCallback(() => {
    if (!user) return
    setNotifications(db.getNotifications(user.id))
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
    (type: NotificationType, message: string, entityId?: string) => {
      if (!user) return
      db.createNotification(user.id, type, message, entityId)
      setNotifications(db.getNotifications(user.id))
    },
    [user]
  )

  const markAllRead = useCallback(() => {
    if (!user) return
    db.markAllRead(user.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [user])

  const remove = useCallback(
    (id: string) => {
      db.deleteNotification(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    },
    []
  )

  const clearAll = useCallback(() => {
    if (!user) return
    db.clearAllNotifications(user.id)
    setNotifications([])
  }, [user])

  return { notifications, unreadCount, load, add, markAllRead, remove, clearAll }
}
