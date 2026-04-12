'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  X, Bell, Trash2, Users, Sparkles, BookOpen, CreditCard, UserMinus,
  AlertTriangle, CalendarClock, TrendingDown, Clock, ArrowUpRight,
} from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'
import type { NotificationType } from '@/lib/db/types'

// ─── Icon per type ────────────────────────────────────────────────────────────

const typeIcon: Record<NotificationType, { icon: React.ElementType; bg: string; color: string }> = {
  student_created:    { icon: Users,          bg: 'bg-blue-100',   color: 'text-blue-600' },
  student_deleted:    { icon: UserMinus,       bg: 'bg-red-100',    color: 'text-red-600' },
  lesson_generated:   { icon: Sparkles,        bg: 'bg-[#eef5ff]',  color: 'text-[#1a7cfa]' },
  plan_saved:         { icon: BookOpen,        bg: 'bg-green-100',  color: 'text-green-600' },
  payment_registered: { icon: CreditCard,      bg: 'bg-amber-100',  color: 'text-amber-600' },
  needs_attention:    { icon: AlertTriangle,   bg: 'bg-amber-100',  color: 'text-amber-600' },
  no_lesson_days:     { icon: CalendarClock,   bg: 'bg-orange-100', color: 'text-orange-600' },
  repeated_difficulty:{ icon: TrendingDown,    bg: 'bg-red-100',    color: 'text-red-500' },
  upcoming_lesson:    { icon: Clock,           bg: 'bg-blue-100',   color: 'text-blue-600' },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins} min atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h atrás`
  const days = Math.floor(hrs / 24)
  return `${days}d atrás`
}

// ─── Panel ────────────────────────────────────────────────────────────────────

interface NotificationsPanelProps {
  onClose: () => void
  collapsed?: boolean
}

export function NotificationsPanel({ onClose, collapsed = false }: NotificationsPanelProps) {
  const { notifications, unreadCount, markAllRead, remove, clearAll } = useNotifications()
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // Mark all read when opening
  useEffect(() => {
    if (unreadCount > 0) markAllRead()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={panelRef}
      className={cn(
        'absolute bottom-20 z-50 w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl',
        collapsed ? 'left-16' : 'left-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Notificações</h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="rounded-lg p-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500"
              title="Limpar tudo"
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-72 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Bell className="mb-2 h-8 w-8 text-gray-200" />
            <p className="text-sm text-gray-400">Sem notificações</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {notifications.map((n) => {
              const meta = typeIcon[n.type]
              const Icon = meta.icon
              return (
                <li key={n.id} className={cn('flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50', !n.read && 'bg-blue-50/40')}>
                  <div className={cn('mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full', meta.bg)}>
                    <Icon size={13} className={meta.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 leading-snug">{n.message}</p>
                    <p className="mt-0.5 text-[11px] text-gray-400">{timeAgo(n.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => remove(n.id)}
                    className="mt-1 flex-shrink-0 rounded p-0.5 text-gray-300 transition-colors hover:text-red-400"
                  >
                    <X size={12} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Footer — link to full page */}
      <div className="border-t border-gray-100 px-4 py-2.5">
        <Link
          href="/notifications"
          onClick={onClose}
          className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#1a7cfa] hover:text-[#1468d6] transition-colors"
        >
          Ver todas as notificações <ArrowUpRight size={12} />
        </Link>
      </div>
    </div>
  )
}
