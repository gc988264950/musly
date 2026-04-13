'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useStudents } from '@/hooks/useStudents'
import { getProgressByStudent } from '@/lib/db/progress'
import { getRepertoireByStudent } from '@/lib/db/repertoire'
import { getLessonsByStudent } from '@/lib/db/lessons'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { TrendingUp, ChevronRight, AlertTriangle } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import type { Student, StudentProgress } from '@/lib/db/types'
import type { StudentLevel } from '@/lib/db/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const levelStyle: Record<StudentLevel, { pill: string; bar: string }> = {
  Iniciante: { pill: 'bg-blue-100 text-blue-700', bar: 'bg-blue-500' },
  Intermediário: { pill: 'bg-purple-100 text-purple-700', bar: 'bg-purple-500' },
  Avançado: { pill: 'bg-indigo-100 text-indigo-700', bar: 'bg-indigo-500' },
}

const levelProgress: Record<StudentLevel, number> = {
  Iniciante: 25,
  Intermediário: 60,
  Avançado: 90,
}

const avatarGradients = [
  'from-[#1a7cfa] to-[#1468d6]',
  'from-emerald-500 to-teal-600',
  'from-indigo-500 to-blue-600',
  'from-orange-500 to-amber-600',
  'from-[#1057b0] to-[#0d2d5e]',
]

interface StudentRow {
  student: Student
  progress: StudentProgress | null
  completedLessons: number
  activeRepertoire: number
  completedRepertoire: number
  gradient: string
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const { students, loading } = useStudents()
  const [rows, setRows] = useState<StudentRow[]>([])

  useEffect(() => {
    if (students.length === 0) { setRows([]); return }

    Promise.all(
      students.map(async (student, i) => {
        const [progress, repertoire, lessons] = await Promise.all([
          getProgressByStudent(student.id).catch(() => null),
          getRepertoireByStudent(student.id).catch(() => []),
          getLessonsByStudent(student.id).catch(() => []),
        ])
        return {
          student,
          progress,
          completedLessons: lessons.filter((l) => l.status === 'concluída').length,
          activeRepertoire: repertoire.filter((r) => r.status === 'em andamento').length,
          completedRepertoire: repertoire.filter((r) => r.status === 'concluído').length,
          gradient: avatarGradients[i % avatarGradients.length],
        }
      })
    ).then(setRows)
  }, [students])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 animate-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Progresso</h1>
          <p className="mt-0.5 text-sm text-gray-500">Acompanhe a evolução de todos os alunos</p>
        </div>
        <EmptyState
          icon={TrendingUp}
          title="Nenhum aluno cadastrado"
          description="Cadastre alunos para acompanhar o progresso deles aqui."
        />
      </div>
    )
  }

  const withAttention = rows.filter((r) => r.student.needsAttention)
  const withProgress = rows.filter((r) => r.progress !== null)

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-in">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Progresso</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {students.length} aluno{students.length !== 1 ? 's' : ''} —{' '}
            {withProgress.length} com perfil de progresso preenchido
          </p>
        </div>
      </div>

      {/* Attention banner */}
      {withAttention.length > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
          <p className="text-sm font-medium text-amber-800">
            {withAttention.length} aluno{withAttention.length !== 1 ? 's precisam' : ' precisa'} de atenção especial:{' '}
            {withAttention.map((r) => r.student.name).join(', ')}
          </p>
        </div>
      )}

      {/* Student progress cards */}
      <div className="space-y-4">
        {rows.map(({ student, progress, completedLessons, activeRepertoire, completedRepertoire, gradient }) => {
          const style = levelStyle[student.level]
          const lvlPct = levelProgress[student.level]

          return (
            <Link key={student.id} href={`/students/${student.id}?tab=progress`}>
              <Card className="cursor-pointer p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white',
                        gradient
                      )}
                    >
                      {getInitials(student.name)}
                    </div>
                    {student.needsAttention && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500">
                        <AlertTriangle className="h-2.5 w-2.5 text-white" />
                      </span>
                    )}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{student.name}</p>
                      <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', style.pill)}>
                        {student.level}
                      </span>
                      <span className="text-xs text-gray-400">{student.instrument}</span>
                    </div>

                    {/* Level progress bar */}
                    <div className="mt-2">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Nível</span>
                        <span className="text-[10px] text-gray-400">{lvlPct}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={cn('h-full rounded-full transition-all', style.bar)}
                          style={{ width: `${lvlPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Progress details */}
                    {progress ? (
                      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-4">
                        {progress.lessonFrequency && (
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Frequência</p>
                            <p className="text-xs font-medium text-gray-700">{progress.lessonFrequency}</p>
                          </div>
                        )}
                        {progress.identifiedDifficulties.length > 0 && (
                          <div className="col-span-2">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Dificuldades</p>
                            <div className="mt-0.5 flex flex-wrap gap-1">
                              {progress.identifiedDifficulties.slice(0, 3).map((d) => (
                                <span key={d} className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700">
                                  {d}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {progress.developedSkills.length > 0 && (
                          <div className="col-span-2">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Habilidades</p>
                            <div className="mt-0.5 flex flex-wrap gap-1">
                              {progress.developedSkills.slice(0, 3).map((s) => (
                                <span key={s} className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-gray-400 italic">Perfil de progresso ainda não preenchido</p>
                    )}
                  </div>

                  {/* Stats + arrow */}
                  <div className="hidden flex-shrink-0 items-center gap-6 sm:flex">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{completedLessons}</p>
                      <p className="text-[10px] text-gray-400">aulas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{activeRepertoire + completedRepertoire}</p>
                      <p className="text-[10px] text-gray-400">repertório</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
