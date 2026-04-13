'use client'

import {
  Bell, Trash2, X, Users, UserMinus, Sparkles, BookOpen,
  CreditCard, AlertTriangle, CalendarClock, TrendingDown, Clock,
} from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { NotificationType } from '@/lib/db/types'

// ─── Meta per type ────────────────────────────────────────────────────────────

const typeConfig: Record<
  NotificationType,
  { icon: React.ElementType; bg: string; color: string; label: string }
> = {
  student_created:    { icon: Users,         bg: 'bg-blue-100',   color: 'text-blue-600',   label: 'Aluno adicionado' },
  student_deleted:    { icon: UserMinus,      bg: 'bg-red-100',    color: 'text-red-600',    label: 'Aluno removido' },
  lesson_generated:   { icon: Sparkles,       bg: 'bg-[#eef5ff]',  color: 'text-[#1a7cfa]', label: 'Plano gerado' },
  plan_saved:         { icon: BookOpen,       bg: 'bg-green-100',  color: 'text-green-600',  label: 'Plano salvo' },
  payment_registered: { icon: CreditCard,     bg: 'bg-amber-100',  color: 'text-amber-600',  label: 'Pagamento' },
  needs_attention:    { icon: AlertTriangle,  bg: 'bg-amber-100',  color: 'text-amber-600',  label: 'Atenção' },
  no_lesson_days:     { icon: CalendarClock,  bg: 'bg-orange-100', color: 'text-orange-600', label: 'Sem aulas' },
  repeated_difficulty:{ icon: TrendingDown,   bg: 'bg-red-100',    color: 'text-red-500',    label: 'Dificuldade recorrente' },
  upcoming_lesson:    { icon: Clock,          bg: 'bg-blue-100',   color: 'text-blue-600',   label: 'Aula em breve' },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins} min atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h atrás`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d atrás`
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { notifications, unreadCount, markAllRead, remove, clearAll } = useNotifications()

  // Group by alert vs activity
  const alertTypes: NotificationType[] = [
    'needs_attention', 'no_lesson_days', 'repeated_difficulty', 'upcoming_lesson',
  ]
  const alerts = notifications.filter((n) => alertTypes.includes(n.type))
  const activity = notifications.filter((n) => !alertTypes.includes(n.type))

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-in">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {notifications.length === 0
              ? 'Nenhuma notificação'
              : `${notifications.length} notificação${notifications.length !== 1 ? 'ões' : ''}${
                  unreadCount > 0 ? `, ${unreadCount} não lida${unreadCount !== 1 ? 's' : ''}` : ''
                }`}
          </p>
        </div>
        {notifications.length > 0 && (
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead}>
                Marcar todas como lidas
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={clearAll}>
              <Trash2 className="h-3.5 w-3.5" /> Limpar tudo
            </Button>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-20">
          <Bell className="mb-3 h-12 w-12 text-gray-200" />
          <p className="font-medium text-gray-400">Sem notificações</p>
          <p className="mt-1 text-sm text-gray-300">As alertas inteligentes aparecerão aqui.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── Smart Alerts ─────────────────────────────────────────────────── */}
          {alerts.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Alertas inteligentes
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-700">
                  {alerts.length}
                </span>
              </h2>
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
                <ul className="divide-y divide-gray-50">
                  {alerts.map((n) => {
                    const cfg = typeConfig[n.type]
                    const Icon = cfg.icon
                    return (
                      <li
                        key={n.id}
                        className={cn(
                          'flex items-start gap-4 px-5 py-4 transition-colors hover:bg-gray-50/50',
                          !n.read && 'bg-blue-50/30'
                        )}
                      >
                        <div
                          className={cn(
                            'mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full',
                            cfg.bg
                          )}
                        >
                          <Icon size={15} className={cfg.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span
                              className={cn(
                                'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                                cfg.bg,
                                cfg.color
                              )}
                            >
                              {cfg.label}
                            </span>
                            {!n.read && (
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-800 leading-snug">{n.message}</p>
                          <p className="mt-1 text-xs text-gray-400">{timeAgo(n.createdAt)}</p>
                        </div>
                        <button
                          onClick={() => remove(n.id)}
                          className="mt-1 flex-shrink-0 rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-400"
                          aria-label="Remover"
                        >
                          <X size={13} />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </section>
          )}

          {/* ── Activity ─────────────────────────────────────────────────────── */}
          {activity.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Atividade recente
              </h2>
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
                <ul className="divide-y divide-gray-50">
                  {activity.map((n) => {
                    const cfg = typeConfig[n.type]
                    const Icon = cfg.icon
                    return (
                      <li
                        key={n.id}
                        className={cn(
                          'flex items-start gap-4 px-5 py-4 transition-colors hover:bg-gray-50/50',
                          !n.read && 'bg-blue-50/30'
                        )}
                      >
                        <div
                          className={cn(
                            'mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full',
                            cfg.bg
                          )}
                        >
                          <Icon size={15} className={cfg.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium text-gray-400">{cfg.label}</span>
                            {!n.read && (
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-800 leading-snug">{n.message}</p>
                          <p className="mt-1 text-xs text-gray-400">{timeAgo(n.createdAt)}</p>
                        </div>
                        <button
                          onClick={() => remove(n.id)}
                          className="mt-1 flex-shrink-0 rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-400"
                          aria-label="Remover"
                        >
                          <X size={13} />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
