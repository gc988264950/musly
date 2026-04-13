'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'
import { saveTeacherProfile, type TeacherProfile } from '@/lib/db/teacherProfile'
import { cn } from '@/lib/utils'

// ─── Questions ────────────────────────────────────────────────────────────────

interface Option {
  value: string
  label: string
  description?: string
  icon: string
}

interface Question {
  field: keyof TeacherProfile
  title: string
  subtitle: string
  options: Option[]
  cols?: 2 | 3 | 4
}

const QUESTIONS: Question[] = [
  {
    field: 'instrumento',
    title: 'Qual é o seu instrumento principal?',
    subtitle:
      'Isso nos ajuda a personalizar sugestões de repertório e exercícios para o seu contexto.',
    cols: 2,
    options: [
      { value: 'piano',   label: 'Piano',   icon: '🎹' },
      { value: 'violino', label: 'Violino', icon: '🎻' },
      { value: 'violao',  label: 'Violão',  icon: '🎸' },
      { value: 'outro',   label: 'Outro',   icon: '🎵' },
    ],
  },
  {
    field: 'estilo_aula',
    title: 'Como você conduz suas aulas?',
    subtitle:
      'Seu estilo define como a IA vai te ajudar a planejar, sugerir e organizar.',
    cols: 3,
    options: [
      {
        value: 'estruturado',
        label: 'Estruturado',
        description: 'Sigo um planejamento definido',
        icon: '📋',
      },
      {
        value: 'livre',
        label: 'Livre',
        description: 'Adapto conforme o aluno',
        icon: '🎯',
      },
      {
        value: 'misto',
        label: 'Misto',
        description: 'Combino os dois estilos',
        icon: '⚡',
      },
    ],
  },
  {
    field: 'nivel',
    title: 'Qual é o nível dos seus alunos?',
    subtitle: 'Vamos calibrar o vocabulário e as sugestões da IA para esse perfil.',
    cols: 2,
    options: [
      { value: 'iniciante',     label: 'Iniciante',     icon: '🌱' },
      { value: 'intermediario', label: 'Intermediário', icon: '📈' },
      { value: 'avancado',      label: 'Avançado',      icon: '🏆' },
      { value: 'misto',         label: 'Misto',         icon: '🔀' },
    ],
  },
  {
    field: 'faixa_etaria',
    title: 'Qual é a faixa etária principal dos seus alunos?',
    subtitle: 'Isso muda a abordagem pedagógica sugerida pela IA.',
    cols: 3,
    options: [
      { value: 'criancas', label: 'Crianças', description: 'Até 12 anos',  icon: '🧒' },
      { value: 'jovens',   label: 'Jovens',   description: '13 a 25 anos', icon: '🧑' },
      { value: 'adultos',  label: 'Adultos',  description: 'Acima de 25',  icon: '👤' },
    ],
  },
  {
    field: 'dificuldade',
    title: 'Onde você mais perde tempo hoje?',
    subtitle: 'Vamos priorizar as ferramentas que mais fazem diferença pra você.',
    cols: 2,
    options: [
      { value: 'planejamento',  label: 'Planejamento',  description: 'Preparar o que ensinar',    icon: '📝' },
      { value: 'organizacao',   label: 'Organização',   description: 'Aulas, pagamentos, dados',  icon: '📁' },
      { value: 'exercicios',    label: 'Exercícios',    description: 'Criar material de estudo',  icon: '🎼' },
      { value: 'acompanhamento', label: 'Acompanhamento', description: 'Seguir a evolução dos alunos', icon: '📊' },
    ],
  },
  {
    field: 'acompanhamento',
    title: 'Como você acompanha a evolução dos seus alunos?',
    subtitle: 'Seu método atual ajuda a IA a sugerir melhorias no processo.',
    cols: 3,
    options: [
      {
        value: 'nao_acompanho',
        label: 'Não acompanho',
        description: 'Ainda não formalizo',
        icon: '❌',
      },
      {
        value: 'informal',
        label: 'Informal',
        description: 'Observação durante as aulas',
        icon: '💬',
      },
      {
        value: 'estruturado',
        label: 'Estruturado',
        description: 'Uso um método definido',
        icon: '📋',
      },
    ],
  },
  {
    field: 'quantidade_alunos',
    title: 'Quantos alunos você tem hoje?',
    subtitle: 'Isso nos ajuda a dimensionar os recursos e sugestões do seu sistema.',
    cols: 2,
    options: [
      { value: '1_3',   label: '1 a 3',      description: 'Começando',    icon: '👤' },
      { value: '4_10',  label: '4 a 10',     description: 'Crescendo',    icon: '👥' },
      { value: '10_30', label: '10 a 30',    description: 'Estabelecido', icon: '🏫' },
      { value: '30+',   label: 'Mais de 30', description: 'Grande escala',icon: '🎓' },
    ],
  },
]

const LOADING_STEPS = [
  'Analisando seu perfil de ensino',
  'Configurando sua IA personalizada',
  'Preparando estrutura de aulas',
  'Organizando seu ambiente',
  'Finalizando tudo para você',
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface OnboardingQuizProps {
  userId:     string
  userName:   string
  onComplete: (profile: TeacherProfile) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingQuiz({ userId, userName, onComplete }: OnboardingQuizProps) {
  // step: 0 = intro, 1..N = questions, N+1 = loading
  const [step,        setStep]        = useState(0)
  const [visible,     setVisible]     = useState(true)
  const [answers,     setAnswers]     = useState<Partial<TeacherProfile>>({})
  const [doneSteps,   setDoneSteps]   = useState(0)   // loading steps revealed
  const [isLoading,   setIsLoading]   = useState(false)

  const totalQ  = QUESTIONS.length          // 7
  const loading = step === totalQ + 1       // step 8

  // ── Transition helper ──────────────────────────────────────────────────────

  const advance = useCallback(() => {
    setVisible(false)
    setTimeout(() => {
      setStep((s) => s + 1)
      setVisible(true)
    }, 200)
  }, [])

  // ── Answer selection ───────────────────────────────────────────────────────

  function select(field: keyof TeacherProfile, value: string) {
    setAnswers((prev) => ({ ...prev, [field]: value }))
  }

  // ── Loading sequence ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!loading || isLoading) return
    setIsLoading(true)

    ;(async () => {
      // Reveal loading steps one by one while saving in parallel
      const savePromise = saveTeacherProfile(userId, answers as TeacherProfile).catch(() => {})

      for (let i = 1; i <= LOADING_STEPS.length; i++) {
        await sleep(680)
        setDoneSteps(i)
      }

      await sleep(400)
      await savePromise
      onComplete(answers as TeacherProfile)
    })()
  }, [loading]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Current question ───────────────────────────────────────────────────────

  const q          = step >= 1 && step <= totalQ ? QUESTIONS[step - 1] : null
  const currentAns = q ? answers[q.field] : undefined

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#060f22]">
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-20 h-[500px] w-[500px] rounded-full bg-[#1a7cfa] opacity-[0.06] blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-[#4a90ff] opacity-[0.05] blur-3xl" />
      </div>

      {/* Progress bar — only during questions */}
      {step >= 1 && step <= totalQ && (
        <div className="relative z-10 h-1 w-full bg-white/10">
          <div
            className="h-full bg-[#1a7cfa] transition-all duration-500 ease-out"
            style={{ width: `${(step / totalQ) * 100}%` }}
          />
        </div>
      )}

      {/* Scrollable content area */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-10">

        {/* ── Fading/sliding content wrapper ── */}
        <div
          className="w-full max-w-xl transition-all duration-200 ease-in-out"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(8px)' }}
        >

          {/* ────── INTRO ────── */}
          {step === 0 && (
            <div className="text-center">
              {/* Badge */}
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[#4a90ff]">
                <Sparkles className="h-3.5 w-3.5" />
                Configuração inicial
              </div>

              <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
                Vamos montar seu sistema{' '}
                <span className="text-[#4a90ff]">de ensino personalizado</span>
              </h1>

              <p className="mt-5 text-base leading-relaxed text-gray-400 sm:text-lg">
                Responda com atenção.{' '}
                <span className="text-white/70">
                  Isso vai definir como sua IA e suas aulas vão funcionar.
                </span>
              </p>

              <p className="mt-3 text-sm text-gray-500">
                Leva menos de 1 minuto, mas faz toda a diferença.
              </p>

              {/* Start button */}
              <button
                onClick={advance}
                className="mt-10 inline-flex items-center gap-2 rounded-2xl bg-[#1a7cfa] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-900/40 transition-all hover:bg-[#1468d6] hover:shadow-blue-900/60 active:scale-95"
              >
                Começar
                <ArrowRight className="h-4.5 w-4.5" />
              </button>

              <p className="mt-6 text-xs text-gray-600">
                {totalQ} perguntas rápidas · Pode ser alterado depois nas configurações
              </p>
            </div>
          )}

          {/* ────── QUESTIONS ────── */}
          {q && (
            <div>
              {/* Step counter */}
              <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-[#1a7cfa]">
                Pergunta {step} de {totalQ}
              </p>

              {/* Question text */}
              <h2 className="text-center text-2xl font-bold leading-snug text-white sm:text-3xl">
                {q.title}
              </h2>
              <p className="mt-3 text-center text-sm leading-relaxed text-gray-400 sm:text-base">
                {q.subtitle}
              </p>

              {/* Options grid */}
              <div
                className={cn(
                  'mt-8 grid gap-3',
                  q.cols === 3
                    ? 'grid-cols-1 sm:grid-cols-3'
                    : 'grid-cols-2'
                )}
              >
                {q.options.map((opt, idx) => {
                  const selected = currentAns === opt.value
                  // For odd-count grids in 2-col mode, span the last item
                  const isLastOdd =
                    q.cols === 2 &&
                    q.options.length % 2 !== 0 &&
                    idx === q.options.length - 1

                  return (
                    <button
                      key={opt.value}
                      onClick={() => select(q.field, opt.value)}
                      className={cn(
                        'group flex flex-col items-center gap-2 rounded-2xl border px-4 py-5 text-center transition-all duration-150 focus:outline-none',
                        selected
                          ? 'border-[#1a7cfa] bg-[#1a7cfa]/20 shadow-lg shadow-blue-900/20'
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10',
                        isLastOdd && 'col-span-2 sm:col-span-1'
                      )}
                    >
                      {/* Icon */}
                      <span className="text-3xl leading-none">{opt.icon}</span>

                      {/* Label */}
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          selected ? 'text-white' : 'text-gray-200'
                        )}
                      >
                        {opt.label}
                      </span>

                      {/* Description */}
                      {opt.description && (
                        <span
                          className={cn(
                            'text-xs leading-tight',
                            selected ? 'text-blue-200' : 'text-gray-500'
                          )}
                        >
                          {opt.description}
                        </span>
                      )}

                      {/* Selected check */}
                      {selected && (
                        <div className="absolute top-2.5 right-2.5 hidden sm:block">
                          <CheckCircle2 className="h-4 w-4 text-[#1a7cfa]" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Next button */}
              <div className="mt-8 flex justify-center">
                <button
                  onClick={advance}
                  disabled={!currentAns}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-sm font-semibold transition-all duration-150 active:scale-95',
                    currentAns
                      ? 'bg-[#1a7cfa] text-white shadow-lg shadow-blue-900/30 hover:bg-[#1468d6]'
                      : 'cursor-not-allowed bg-white/5 text-white/20'
                  )}
                >
                  {step === totalQ ? 'Concluir' : 'Próximo'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* Hint when nothing selected */}
              {!currentAns && (
                <p className="mt-3 text-center text-xs text-gray-600">
                  Selecione uma opção para continuar
                </p>
              )}
            </div>
          )}

          {/* ────── LOADING ────── */}
          {loading && (
            <div className="text-center">
              {/* Spinner */}
              <div className="mb-8 flex justify-center">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-2 border-white/10" />
                  <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-2 border-transparent border-t-[#1a7cfa]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-[#1a7cfa]" />
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Estamos preparando seu sistema…
              </h2>
              <p className="mt-3 text-sm text-gray-400">
                Configurando sua IA e organizando seu ambiente de ensino
              </p>

              {/* Steps */}
              <ul className="mt-10 space-y-3 text-left mx-auto max-w-xs">
                {LOADING_STEPS.map((label, i) => {
                  const done    = doneSteps > i
                  const current = doneSteps === i

                  return (
                    <li
                      key={label}
                      className={cn(
                        'flex items-center gap-3 text-sm transition-all duration-300',
                        done    ? 'text-white'   :
                        current ? 'text-gray-300' :
                                  'text-gray-600'
                      )}
                    >
                      {done ? (
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#1a7cfa]" />
                      ) : (
                        <div
                          className={cn(
                            'h-4 w-4 flex-shrink-0 rounded-full border',
                            current ? 'border-gray-400 bg-gray-400/20 animate-pulse' : 'border-gray-700'
                          )}
                        />
                      )}
                      {label}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
