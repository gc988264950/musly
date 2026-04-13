'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Music, Video, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getStudentById } from '@/lib/db/students'
import { getLessonsByStudent } from '@/lib/db/lessons'
import { cn } from '@/lib/utils'
import type { Lesson, LessonStatus, Student } from '@/lib/db/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

const STATUS_CONFIG: Record<LessonStatus, { label: string; icon: React.ElementType; className: string }> = {
  agendada:  { label: 'Agendada',  icon: Calendar,      className: 'bg-blue-50 text-blue-700' },
  concluída: { label: 'Concluída', icon: CheckCircle2,   className: 'bg-green-50 text-green-700' },
  cancelada: { label: 'Cancelada', icon: XCircle,        className: 'bg-gray-100 text-gray-500' },
  falta:     { label: 'Falta',     icon: AlertCircle,    className: 'bg-red-50 text-red-600' },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentLessonsPage() {
  const { user } = useAuth()
  const linkedStudentId = user?.linkedStudentId
  const [student, setStudent] = useState<Student | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])

  useEffect(() => {
    if (!linkedStudentId) return
    getStudentById(linkedStudentId).then(setStudent).catch(() => {})
    getLessonsByStudent(linkedStudentId)
      .then((data) => setLessons(
        data.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
      ))
      .catch(() => {})
  }, [linkedStudentId])

  const upcoming = lessons.filter((l) => l.status === 'agendada')
  const past = lessons.filter((l) => l.status !== 'agendada')

  function LessonCard({ lesson }: { lesson: Lesson }) {
    const cfg = STATUS_CONFIG[lesson.status]
    const Icon = cfg.icon
    return (
      <div className="flex items-start gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3.5 shadow-card">
        <div className={cn('mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full', cfg.className.split(' ')[0])}>
          <Icon size={15} className={cfg.className.split(' ')[1]} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 capitalize">{formatDate(lesson.date)}</p>
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', cfg.className)}>
              {cfg.label}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock size={11} className="text-gray-400" />
              {lesson.time} · {formatDuration(lesson.duration)}
            </span>
            {lesson.instrument && (
              <span className="flex items-center gap-1">
                <Music size={11} className="text-gray-400" />
                {lesson.instrument}
              </span>
            )}
          </div>
          {lesson.topic && (
            <p className="mt-1.5 text-xs text-gray-500">
              <span className="font-medium text-gray-700">Tópico:</span> {lesson.topic}
            </p>
          )}
        </div>
        {lesson.status === 'agendada' && student?.meetLink && (
          <a
            href={student.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-1.5 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700"
          >
            <Video size={12} />
            Entrar
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 animate-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Minhas Aulas</h1>
        <p className="mt-0.5 text-sm text-gray-500">Histórico e próximas aulas</p>
      </div>

      {lessons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Calendar className="mb-3 h-12 w-12 text-gray-200" />
          <p className="text-sm font-medium text-gray-400">Nenhuma aula encontrada</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Próximas ({upcoming.length})
              </h2>
              {upcoming.map((l) => <LessonCard key={l.id} lesson={l} />)}
            </section>
          )}

          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Histórico ({past.length})
              </h2>
              {past.map((l) => <LessonCard key={l.id} lesson={l} />)}
            </section>
          )}
        </>
      )}
    </div>
  )
}
