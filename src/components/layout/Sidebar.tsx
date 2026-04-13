'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarDays,
  BarChart2,
  CreditCard,
  Settings,
  LogOut,
  Bell,
  Crown,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { useNotifications } from '@/hooks/useNotifications'
import { useAlerts } from '@/hooks/useAlerts'
import { NotificationsPanel } from '@/components/ui/NotificationsPanel'
import { getInitials } from '@/lib/utils'
import { MuslyMark } from '@/components/ui/MuslyLogo'

const navItems = [
  { label: 'Painel',        href: '/dashboard',    icon: LayoutDashboard },
  { label: 'Alunos',        href: '/students',     icon: Users },
  { label: 'Aulas',         href: '/lessons',      icon: Calendar },
  { label: 'Agenda',        href: '/agenda',       icon: CalendarDays },
  { label: 'Progresso',     href: '/progress',     icon: BarChart2 },
  { label: 'Financeiro',    href: '/billing',      icon: CreditCard },
  { label: 'Assistente IA', href: '/ai-assistant', icon: Sparkles },
  { label: 'Créditos',      href: '/credits',      icon: Zap },
]

const bottomItems = [
  { label: 'Planos', href: '/plans', icon: Crown },
  { label: 'Configurações', href: '/settings', icon: Settings },
]

interface SidebarProps {
  collapsed?: boolean
  mobileOpen?: boolean
  onMobileClose?: () => void
  onToggleCollapsed?: () => void
}

export default function Sidebar({
  collapsed = false,
  mobileOpen = false,
  onMobileClose,
  onToggleCollapsed,
}: SidebarProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { planId, aiCredits } = useSubscription()
  const { unreadCount } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)
  useAlerts()

  const fullName = user ? `${user.firstName} ${user.lastName}` : ''
  const initials = fullName ? getInitials(fullName) : '?'

  const planBadge =
    planId === 'pro'
      ? { label: 'Pro', bg: 'bg-[#eef5ff]', text: 'text-[#1a7cfa]' }
      : planId === 'studio'
      ? { label: 'Studio', bg: 'bg-blue-50', text: 'text-blue-700' }
      : { label: 'Grátis', bg: 'bg-gray-100', text: 'text-gray-600' }

  return (
    <aside
      className={cn(
        'flex flex-shrink-0 flex-col border-r border-gray-100 bg-white transition-all duration-200',
        collapsed ? 'w-16' : 'w-64',
        'fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex h-16 flex-shrink-0 items-center border-b border-gray-100',
        collapsed ? 'justify-center px-2' : 'gap-2.5 px-5'
      )}>
        {collapsed ? (
          <MuslyMark size={32} />
        ) : (
          <>
            <MuslyMark size={32} />
            <span className="text-base font-bold text-gray-900">Musly</span>
            {/* Mobile close button */}
            <button
              onClick={onMobileClose}
              className="ml-auto rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 lg:hidden"
              aria-label="Fechar menu"
            >
              <X size={16} />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const isCredits = item.href === '/credits'
            const creditsAvail = aiCredits?.totalAvailable ?? null
            const creditLow = creditsAvail !== null && creditsAvail <= 5

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onMobileClose}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    collapsed && 'justify-center px-2',
                    isActive
                      ? 'bg-[#eef5ff] text-[#1a7cfa]'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Icon
                      className={cn(isActive ? 'text-[#1a7cfa]' : 'text-gray-400')}
                      size={18}
                    />
                    {/* Low-credit dot indicator (collapsed mode only) */}
                    {isCredits && collapsed && creditLow && (
                      <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-amber-400" />
                    )}
                  </div>
                  {!collapsed && (
                    <>
                      {item.label}
                      {isCredits && creditsAvail !== null ? (
                        <span className={cn(
                          'ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                          creditLow
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        )}>
                          {creditsAvail}
                        </span>
                      ) : isActive ? (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#1a7cfa]" />
                      ) : null}
                    </>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-100 px-2 py-3">
        <ul className="space-y-0.5">
          {/* Notifications button */}
          <li>
            <button
              onClick={() => setShowNotifications((v) => !v)}
              title={collapsed ? 'Notificações' : undefined}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                collapsed && 'justify-center px-2',
                showNotifications
                  ? 'bg-[#eef5ff] text-[#1a7cfa]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <div className="relative flex-shrink-0">
                <Bell
                  size={18}
                  className={showNotifications ? 'text-[#1a7cfa]' : 'text-gray-400'}
                />
                {unreadCount > 0 && collapsed && (
                  <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#1a7cfa] text-[8px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              {!collapsed && (
                <>
                  Notificações
                  {unreadCount > 0 && (
                    <span className="ml-auto rounded-full bg-[#1a7cfa] px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </>
              )}
            </button>
          </li>

          {bottomItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onMobileClose}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    collapsed && 'justify-center px-2',
                    isActive
                      ? 'bg-[#eef5ff] text-[#1a7cfa]'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon
                    size={18}
                    className={cn('flex-shrink-0', isActive ? 'text-[#1a7cfa]' : 'text-gray-400')}
                  />
                  {!collapsed && item.label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* User profile */}
        {collapsed ? (
          <div className="mt-3 flex flex-col items-center gap-2">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#1a7cfa] text-xs font-bold text-white"
              title={fullName}
            >
              {initials}
            </div>
            <button
              onClick={signOut}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:text-red-500"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#1a7cfa] text-xs font-bold text-white">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {fullName || 'Carregando…'}
                </p>
                <span className={cn('shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold', planBadge.bg, planBadge.text)}>
                  {planBadge.label}
                </span>
              </div>
              <p className="truncate text-xs text-gray-400">{user?.email ?? ''}</p>
            </div>
            <button
              onClick={signOut}
              className="text-gray-400 transition-colors hover:text-red-500"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={onToggleCollapsed}
          className={cn(
            'mt-2 hidden w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 lg:flex',
          )}
          title={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : (
            <>
              <ChevronLeft size={14} />
              <span>Recolher</span>
            </>
          )}
        </button>
      </div>

      {/* Notifications panel */}
      {showNotifications && (
        <NotificationsPanel
          onClose={() => setShowNotifications(false)}
          collapsed={collapsed}
        />
      )}
    </aside>
  )
}
