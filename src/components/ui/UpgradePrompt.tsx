'use client'

import Link from 'next/link'
import { Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UpgradePromptProps {
  title: string
  description: string
  className?: string
}

export function UpgradePrompt({ title, description, className }: UpgradePromptProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm">
          <Crown className="h-4.5 w-4.5 text-white" size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="mt-0.5 text-sm text-gray-600">{description}</p>
          <Link
            href="/plans"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <Crown size={13} />
            Ver planos
          </Link>
        </div>
      </div>
    </div>
  )
}
