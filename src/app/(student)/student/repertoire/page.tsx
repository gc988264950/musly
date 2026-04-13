'use client'

import { useState, useEffect } from 'react'
import { ListMusic } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getStudentById } from '@/lib/db/students'
import { getRepertoireByStudent } from '@/lib/db/repertoire'
import type { RepertoireItem } from '@/lib/db/types'
import { cn } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  'em andamento': { label: 'Em andamento', className: 'bg-blue-50 text-blue-700' },
  'concluído':    { label: 'Concluído',    className: 'bg-green-50 text-green-700' },
  'pausado':      { label: 'Pausado',      className: 'bg-gray-100 text-gray-500' },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentRepertoirePage() {
  const { user } = useAuth()
  const linkedStudentId = user?.linkedStudentId

  const [items, setItems] = useState<RepertoireItem[]>([])

  useEffect(() => {
    if (!linkedStudentId) return
    getRepertoireByStudent(linkedStudentId).then(setItems).catch(() => {})
  }, [linkedStudentId])

  const byStatus = {
    'em andamento': items.filter((i) => i.status === 'em andamento'),
    'concluído':    items.filter((i) => i.status === 'concluído'),
    'pausado':      items.filter((i) => i.status === 'pausado'),
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-in space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Repertório</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Músicas e estudos do seu repertório
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ListMusic className="mb-3 h-12 w-12 text-gray-200" />
          <p className="text-sm font-medium text-gray-400">Nenhum item no repertório</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(Object.entries(byStatus) as [string, RepertoireItem[]][])
            .filter(([, list]) => list.length > 0)
            .map(([status, list]) => {
              const cfg = STATUS_STYLE[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
              return (
                <section key={status} className="space-y-2">
                  <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', cfg.className)}>
                      {cfg.label}
                    </span>
                    <span>({list.length})</span>
                  </h2>
                  {list.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-card"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{item.title}</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="text-xs text-gray-400">{item.type}</span>
                        </div>
                        {item.notes && (
                          <p className="mt-1 text-xs text-gray-400 line-clamp-2">{item.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </section>
              )
            })}
        </div>
      )}
    </div>
  )
}
