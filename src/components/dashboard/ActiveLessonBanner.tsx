'use client'

/**
 * ActiveLessonBanner
 * ──────────────────
 * Shows a live banner when a lesson is in progress.
 * Reads from localStorage key 'harmoniq_active_lesson' (set by lesson-mode).
 * Clears stale entries (> 12 hours old) automatically.
 * Self-destructs when no active lesson is found.
 */

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Radio, ArrowRight } from 'lucide-react'
import { getInitials } from '@/lib/utils'

interface ActiveLesson {
  lessonId:    string
  studentName: string
  studentColor: string
  startedAt:   number
}

const ACTIVE_KEY   = 'harmoniq_active_lesson'
const MAX_AGE_MS   = 12 * 60 * 60 * 1000  // 12 hours

function fmt(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function ActiveLessonBanner() {
  const router = useRouter()
  const [info, setInfo]       = useState<ActiveLesson | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const infoRef               = useRef<ActiveLesson | null>(null)

  useEffect(() => {
    // Read and validate the active lesson from localStorage
    let parsed: ActiveLesson | null = null
    try {
      const raw = localStorage.getItem(ACTIVE_KEY)
      if (raw) {
        const candidate = JSON.parse(raw) as ActiveLesson
        const age = Date.now() - candidate.startedAt
        if (age >= 0 && age < MAX_AGE_MS) {
          parsed = candidate
        } else {
          // Stale — clean up
          localStorage.removeItem(ACTIVE_KEY)
        }
      }
    } catch {
      localStorage.removeItem(ACTIVE_KEY)
    }

    if (!parsed) return

    setInfo(parsed)
    setElapsed(Math.floor((Date.now() - parsed.startedAt) / 1000))
    infoRef.current = parsed

    const id = setInterval(() => {
      const active = infoRef.current
      if (!active) return
      const age = Date.now() - active.startedAt
      if (age >= MAX_AGE_MS) {
        // Auto-expire stale lesson display
        localStorage.removeItem(ACTIVE_KEY)
        setInfo(null)
        infoRef.current = null
        clearInterval(id)
        return
      }
      setElapsed(Math.floor(age / 1000))
    }, 1000)

    return () => clearInterval(id)
  }, [])

  if (!info) return null

  return (
    <button
      type="button"
      onClick={() => router.push(`/lesson-mode/${info.lessonId}`)}
      className="w-full text-left"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3.5 shadow-sm transition-colors hover:bg-green-100">
        {/* Pulsing dot */}
        <div className="relative flex h-2.5 w-2.5 flex-shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-600" />
        </div>

        {/* Student avatar */}
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: info.studentColor || '#6366f1' }}
        >
          {getInitials(info.studentName)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-green-800">Aula em andamento</p>
          <p className="text-xs text-green-700 truncate">{info.studentName}</p>
        </div>

        {/* Timer + arrow */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-mono text-sm font-bold text-green-800 tabular-nums">
            {fmt(elapsed)}
          </span>
          <Radio className="h-4 w-4 text-green-500 animate-pulse" />
          <ArrowRight className="h-4 w-4 text-green-600" />
        </div>
      </div>
    </button>
  )
}
