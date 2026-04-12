'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Video, Music, Calendar,
  Clock, CheckCircle2, AlertTriangle, TrendingUp, Save,
  Lightbulb, Flag, BookOpen, FileText, Image as ImageIcon,
  File, Radio,
} from 'lucide-react'
import { getLessonById, updateLesson } from '@/lib/db/lessons'
import { getStudentById } from '@/lib/db/students'
import { getLessonPlansByStudent } from '@/lib/db/lessonPlans'
import { getStudentFiles } from '@/lib/db/studentFiles'
import { MaterialViewerModal } from '@/components/ui/MaterialViewerModal'
import type { Lesson, LessonPlan, StudentFile } from '@/lib/db/types'
import { cn, getInitials } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimer(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDuration(secs: number): string {
  if (secs < 60) return `${secs}s`
  const m = Math.floor(secs / 60)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem === 0 ? `${h}h` : `${h}h ${rem}min`
}

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function formatTime(t: string): string {
  const [h, m] = t.split(':')
  return `${h}h${m !== '00' ? m : ''}`
}

function formatHHMM(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── File icon helper ─────────────────────────────────────────────────────────

function getFileIcon(mimeType: string): React.ElementType {
  if (mimeType === 'application/pdf') return FileText
  if (mimeType.startsWith('image/')) return ImageIcon
  return File
}

function getFileIconColor(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'text-red-500'
  if (mimeType.startsWith('image/')) return 'text-blue-500'
  return 'text-gray-400'
}

// ─── Smart feedback logic ─────────────────────────────────────────────────────

function buildFeedback(tags: string[], notes: string): string {
  const hasDifficulty = tags.includes('difficulty')
  const hasEvolved = tags.includes('evolved')

  if (hasDifficulty && hasEvolved)
    return 'O aluno mostrou evolução em alguns pontos, mas ainda enfrenta dificuldades. Mantenha um ritmo equilibrado e reforce os conteúdos críticos na próxima aula.'
  if (hasDifficulty)
    return 'O aluno apresentou dificuldades nesta aula. Recomenda-se revisar os conteúdos trabalhados e reforçar com exercícios adicionais na próxima sessão.'
  if (hasEvolved)
    return 'Excelente! O aluno demonstrou boa evolução nesta aula. Considere introduzir novos desafios ou aumentar a complexidade do repertório na próxima sessão.'
  if (notes.trim().length > 20)
    return 'Aula concluída com anotações registradas. Revise as observações para planejar a próxima sessão de forma personalizada.'
  return 'Aula concluída. Registre o desempenho do aluno nas próximas sessões para gerar recomendações mais precisas.'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LessonModePage() {
  const params = useParams()
  const router = useRouter()
  const lessonId = params.lessonId as string

  // ── Data ──────────────────────────────────────────────────────────────────
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null)
  const [studentName, setStudentName] = useState('')
  const [studentInstrument, setStudentInstrument] = useState('')
  const [studentColor, setStudentColor] = useState('#6366f1')
  const [studentMeetLink, setStudentMeetLink] = useState('')
  const [studentId, setStudentId] = useState('')
  const [materials, setMaterials] = useState<StudentFile[]>([])
  const [loading, setLoading] = useState(true)

  // ── Timer ─────────────────────────────────────────────────────────────────
  const [elapsed, setElapsed] = useState(0)
  const [timerRunning, setTimerRunning] = useState(true)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const startTimeRef = useRef<number>(Date.now())

  // ── Session state ─────────────────────────────────────────────────────────
  const [notes, setNotes] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)
  const [performanceTags, setPerformanceTags] = useState<string[]>([])
  const [planExpanded, setPlanExpanded] = useState(false)

  // ── Modals ────────────────────────────────────────────────────────────────
  const [viewerFile, setViewerFile] = useState<StudentFile | null>(null)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)

  // ── Finished state ────────────────────────────────────────────────────────
  const [finished, setFinished] = useState(false)
  const [finalDuration, setFinalDuration] = useState(0)
  const [feedback, setFeedback] = useState('')

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const l = getLessonById(lessonId)
    if (!l) { setLoading(false); return }
    setLesson(l)
    setPerformanceTags(l.performanceTags ?? [])

    const student = getStudentById(l.studentId)
    if (student) {
      setStudentName(student.name)
      setStudentInstrument(student.instrument)
      setStudentColor(student.color)
      setStudentMeetLink(student.meetLink ?? '')
      setStudentId(student.id)
      setMaterials(getStudentFiles(student.id).filter(
        (f) => f.mimeType === 'application/pdf' || f.mimeType.startsWith('image/')
      ))
    }

    const plans = getLessonPlansByStudent(l.studentId)
    if (plans.length > 0) setLessonPlan(plans[0])

    // Restore notes from localStorage
    const savedNotes = localStorage.getItem(`harmoniq_session_notes_${lessonId}`)
    setNotes(savedNotes !== null ? savedNotes : (l.notes ?? ''))

    // Timer persistence: restore or create start timestamp
    const timerKey = `harmoniq_lesson_start_${lessonId}`
    const savedStart = localStorage.getItem(timerKey)
    if (savedStart) {
      const ts = parseInt(savedStart, 10)
      startTimeRef.current = ts
      setStartedAt(ts)
    } else {
      const now = Date.now()
      startTimeRef.current = now
      setStartedAt(now)
      localStorage.setItem(timerKey, String(now))
    }

    setLoading(false)
  }, [lessonId])

  // ── Timer interval ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerRunning || finished) return
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [timerRunning, finished])

  // ── Auto-save notes to localStorage ──────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(`harmoniq_session_notes_${lessonId}`, notes)
      setNoteSaved(true)
      setTimeout(() => setNoteSaved(false), 1500)
    }, 600)
    return () => clearTimeout(timer)
  }, [notes, lessonId])

  // ── Toggle performance tag ─────────────────────────────────────────────────
  const toggleTag = useCallback((tag: string) => {
    setPerformanceTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }, [])

  // ── Finish lesson ─────────────────────────────────────────────────────────
  function confirmFinish() {
    if (!lesson) return
    const duration = elapsed
    setFinalDuration(duration)
    setTimerRunning(false)
    setShowFinishConfirm(false)

    try {
      updateLesson(lesson.id, {
        status: 'concluída',
        notes: notes.trim(),
        performanceTags,
      })
      localStorage.removeItem(`harmoniq_session_notes_${lessonId}`)
      localStorage.removeItem(`harmoniq_lesson_start_${lessonId}`)
    } catch {
      // If lesson was already deleted, still show feedback
    }

    setFeedback(buildFeedback(performanceTags, notes))
    setFinished(true)
  }

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <p className="text-gray-500">Aula não encontrada.</p>
        <Link href="/lessons" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar para Aulas
        </Link>
      </div>
    )
  }

  // ── Finished screen ───────────────────────────────────────────────────────
  if (finished) {
    return (
      <div className="p-6 lg:p-8 animate-in">
        <div className="mx-auto max-w-xl">
          <div className="overflow-hidden rounded-2xl border border-green-100 bg-white shadow-card">
            <div className="border-b border-green-100 bg-green-50 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Aula finalizada!</h1>
                  <p className="text-sm text-gray-500">
                    {studentName} · {formatDuration(finalDuration)} de duração
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  <Clock className="h-3 w-3" /> {formatDuration(finalDuration)}
                </span>
                {performanceTags.includes('evolved') && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                    <TrendingUp className="h-3 w-3" /> Evoluiu bem
                  </span>
                )}
                {performanceTags.includes('difficulty') && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                    <AlertTriangle className="h-3 w-3" /> Dificuldade
                  </span>
                )}
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-4">
                <div className="flex items-start gap-2.5">
                  <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-blue-500">
                      Recomendação para a próxima aula
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">{feedback}</p>
                  </div>
                </div>
              </div>

              {notes.trim() && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Anotações salvas</p>
                  <p className="rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-700 whitespace-pre-wrap">
                    {notes.trim()}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
              <Link
                href="/dashboard"
                className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-center text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                Ir ao painel
              </Link>
              <Link
                href={`/students/${lesson.studentId}`}
                className="flex-1 rounded-xl bg-[#1a7cfa] hover:bg-[#1468d6] py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Ver perfil do aluno
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Active lesson screen ──────────────────────────────────────────────────
  return (
    <>
      <div className="p-6 lg:p-8 animate-in">
        <div className="mx-auto max-w-2xl space-y-4">

          {/* Top bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar
            </button>

            {/* Live badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-600" />
              </span>
              Aula em andamento
            </span>
          </div>

          {/* Timer hero */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card text-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400 flex items-center justify-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-green-500" />
              Tempo de aula
            </p>
            <p className="text-6xl font-bold tabular-nums text-gray-900 tracking-tight">
              {formatTimer(elapsed)}
            </p>
            {startedAt && (
              <p className="mt-2 text-xs text-gray-400">
                Iniciada às {formatHHMM(startedAt)}
              </p>
            )}
          </div>

          {/* Student card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
            <div className="flex items-center gap-4">
              <div
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
                style={{ backgroundColor: studentColor }}
              >
                {getInitials(studentName)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-900">{studentName}</h2>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Music className="h-3.5 w-3.5" /> {studentInstrument}
                  </span>
                  <span className="text-gray-300">·</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="capitalize">{formatDate(lesson.date)}</span>
                  </span>
                  <span className="text-gray-300">·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {formatTime(lesson.time)}
                  </span>
                </div>
              </div>
            </div>

            {/* Meet link */}
            {studentMeetLink ? (
              <a
                href={studentMeetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
              >
                <Video className="h-4 w-4" />
                Entrar no Google Meet
              </a>
            ) : (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-2.5 text-sm text-gray-400">
                <Video className="h-4 w-4 flex-shrink-0" />
                Nenhum link do Google Meet cadastrado para este aluno.
              </div>
            )}
          </div>

          {/* Materials panel */}
          {materials.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white shadow-card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                <BookOpen className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold text-gray-900">Materiais do aluno</span>
                <span className="ml-auto text-xs text-gray-400">{materials.length} arquivo{materials.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {materials.map((file) => {
                  const Icon = getFileIcon(file.mimeType)
                  return (
                    <div key={file.id} className="flex items-center gap-3 px-5 py-3">
                      <Icon className={cn('h-4 w-4 flex-shrink-0', getFileIconColor(file.mimeType))} />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm text-gray-800" title={file.name}>{file.name}</p>
                        <p className="text-[11px] text-gray-400">{formatSize(file.size)}</p>
                      </div>
                      <button
                        onClick={() => setViewerFile(file)}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        Abrir
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Lesson plan (collapsible) */}
          {lessonPlan && (
            <div className="rounded-2xl border border-gray-100 bg-white shadow-card overflow-hidden">
              <button
                onClick={() => setPlanExpanded((v) => !v)}
                className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-[#1a7cfa]" />
                  <span className="text-sm font-semibold text-gray-900">Plano de aula atual</span>
                </div>
                <span className="text-xs text-gray-400 truncate max-w-[180px]">{lessonPlan.title}</span>
              </button>
              {planExpanded && (
                <div className="border-t border-gray-100 px-5 pb-4 pt-3 space-y-3">
                  <p className="text-sm text-gray-600 leading-relaxed">{lessonPlan.summary}</p>
                  {lessonPlan.sections.map((section) => (
                    <div key={section.id}>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        {section.emoji} {section.title} — {section.duration}min
                      </p>
                      <ul className="space-y-0.5">
                        {section.activities.map((act, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
                            <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-gray-400" />
                            {act}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick notes */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-900" htmlFor="session-notes">
                Anotações da aula
              </label>
              {noteSaved && (
                <span className="flex items-center gap-1 text-[11px] text-green-600">
                  <Save className="h-3 w-3" /> Salvo
                </span>
              )}
            </div>
            <textarea
              id="session-notes"
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Digite suas observações sobre a aula…"
              className="block w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm placeholder-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Finish button */}
          <button
            onClick={() => setShowFinishConfirm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1a7cfa] hover:bg-[#1468d6] py-4 text-base font-bold text-white shadow-lg transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            <CheckCircle2 className="h-5 w-5" />
            Finalizar aula
          </button>

          {/* Footer: performance tags + hint */}
          <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-card">
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Performance do aluno</p>
            <div className="flex gap-2.5">
              <button
                onClick={() => toggleTag('evolved')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-all',
                  performanceTags.includes('evolved')
                    ? 'border-green-400 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-400 hover:border-green-300 hover:text-green-600'
                )}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Evoluiu bem
              </button>
              <button
                onClick={() => toggleTag('difficulty')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-all',
                  performanceTags.includes('difficulty')
                    ? 'border-amber-400 bg-amber-50 text-amber-700'
                    : 'border-gray-200 bg-white text-gray-400 hover:border-amber-300 hover:text-amber-600'
                )}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Dificuldade
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400">
            Anotações salvas automaticamente. Clique em "Finalizar" para concluir a aula.
          </p>
        </div>
      </div>

      {/* Material viewer modal */}
      {viewerFile && (
        <MaterialViewerModal
          file={viewerFile}
          isTeacher={true}
          onClose={() => setViewerFile(null)}
        />
      )}

      {/* Finish confirmation modal */}
      {showFinishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFinishConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-1 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Finalizar aula</h2>
            </div>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              Tem certeza que deseja finalizar esta aula? A aula será marcada como concluída e o timer será encerrado.
            </p>
            {(performanceTags.length === 0) && (
              <p className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                Nenhuma tag de performance selecionada. Você ainda pode adicionar antes de finalizar.
              </p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowFinishConfirm(false)}
                className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmFinish}
                className="flex-1 rounded-xl bg-[#1a7cfa] hover:bg-[#1468d6] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
