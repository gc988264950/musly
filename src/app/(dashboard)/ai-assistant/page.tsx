'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, RefreshCw, User, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getLessons, todayISO } from '@/lib/db/lessons'
import { getStudents } from '@/lib/db/students'
import { getAllPayments } from '@/lib/db/payments'
import { getAllFinancial } from '@/lib/db/financial'
import { getTeacherProfile, buildTeacherContext, instrumentLabel, type TeacherProfile } from '@/lib/db/teacherProfile'
import { cn } from '@/lib/utils'
import type { Lesson, Student, Payment, StudentFinancial } from '@/lib/db/types'

// ─── Context ──────────────────────────────────────────────────────────────────

interface SystemContext {
  lessons:        Lesson[]
  students:       Student[]
  payments:       Payment[]
  financials:     StudentFinancial[]
  teacherId:      string
  today:          string
  teacherProfile: TeacherProfile | null
}

// ─── AI response engine ───────────────────────────────────────────────────────

function formatDatePT(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function formatTimePT(t: string): string {
  const [h, m] = t.split(':')
  return `${h}h${m !== '00' ? m : ''}`
}

function generateAIResponse(prompt: string, ctx: SystemContext): string {
  const p = prompt.toLowerCase()
  const { lessons, students, today } = ctx

  const upcoming = lessons
    .filter((l) => l.date >= today && l.status === 'agendada')
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

  const todayLessons = lessons.filter((l) => l.date === today)
  const concludedLessons = lessons.filter((l) => l.status === 'concluída')

  // ── Próxima aula ──────────────────────────────────────────────────────────
  if (p.includes('próxima aula') || p.includes('proxima aula') || p.includes('quando') && p.includes('aula')) {
    const next = upcoming[0]
    if (!next) return 'Você não tem nenhuma aula agendada no momento.'
    const student = students.find((s) => s.id === next.studentId)
    return `Sua próxima aula é com **${student?.name ?? 'aluno desconhecido'}** em **${formatDatePT(next.date)}** às **${formatTimePT(next.time)}** (${next.duration} min, ${next.instrument}).${next.topic ? ` Tópico: ${next.topic}.` : ''}`
  }

  // ── Aulas de hoje ─────────────────────────────────────────────────────────
  if (p.includes('hoje') || (p.includes('quantas') && p.includes('aula'))) {
    if (todayLessons.length === 0) return 'Você não tem nenhuma aula agendada para hoje.'
    const lines = todayLessons
      .sort((a, b) => a.time.localeCompare(b.time))
      .map((l) => {
        const s = students.find((st) => st.id === l.studentId)
        return `• ${formatTimePT(l.time)} — ${s?.name ?? '?'} (${l.instrument}, ${l.duration}min) — ${l.status}`
      })
    return `Você tem **${todayLessons.length} aula${todayLessons.length !== 1 ? 's' : ''}** hoje:\n${lines.join('\n')}`
  }

  // ── Aulas da semana ───────────────────────────────────────────────────────
  if (p.includes('semana') && p.includes('aula')) {
    const d = new Date(today + 'T00:00:00')
    const day = d.getDay()
    const mon = new Date(d); mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
    const fmtISO = (dt: Date) => dt.toISOString().slice(0, 10)
    const weekLessons = lessons.filter((l) => l.date >= fmtISO(mon) && l.date <= fmtISO(sun))
    if (weekLessons.length === 0) return 'Nenhuma aula registrada para esta semana.'
    return `Esta semana você tem **${weekLessons.length} aula${weekLessons.length !== 1 ? 's' : ''}** registradas (${weekLessons.filter((l) => l.status === 'agendada').length} agendadas, ${weekLessons.filter((l) => l.status === 'concluída').length} concluídas).`
  }

  // ── Pagamentos pendentes ──────────────────────────────────────────────────
  if (p.includes('pagamento') || p.includes('pendente') || p.includes('mensalidade') || p.includes('financeiro')) {
    try {
      const payments = ctx.payments
      const financials = ctx.financials
      const thisMonth = new Date().toISOString().slice(0, 7)
      const paidThisMonth = payments.filter((p) => p.referenceMonth === thisMonth && p.paidAt !== null)
      const withFinancial = financials.length
      const pending = withFinancial - paidThisMonth.length
      if (withFinancial === 0) return 'Nenhum aluno com mensalidade configurada ainda.'
      if (pending <= 0) return `Todos os ${withFinancial} aluno${withFinancial !== 1 ? 's' : ''} com mensalidade já pagaram este mês. 🎉`
      const pendingStudents = financials
        .filter((f) => !paidThisMonth.some((p) => p.studentId === f.studentId))
        .map((f) => students.find((s) => s.id === f.studentId)?.name ?? '?')
      return `**${pending} pagamento${pending !== 1 ? 's' : ''} pendente${pending !== 1 ? 's' : ''}** este mês:\n${pendingStudents.map((n) => `• ${n}`).join('\n')}`
    } catch {
      return 'Não consegui acessar os dados financeiros. Tente verificar na aba Financeiro.'
    }
  }

  // ── Aluno com mais dificuldade ────────────────────────────────────────────
  if (p.includes('dificuldade') || p.includes('atenção') || p.includes('atencao') || p.includes('problema')) {
    const attention = students.filter((s) => s.needsAttention)
    const diffLessons = lessons.filter((l) => l.performanceTags?.includes('difficulty'))
    const countByStudent: Record<string, number> = {}
    diffLessons.forEach((l) => { countByStudent[l.studentId] = (countByStudent[l.studentId] ?? 0) + 1 })
    const topEntry = Object.entries(countByStudent).sort((a, b) => b[1] - a[1])[0]
    const lines: string[] = []
    if (attention.length > 0) {
      lines.push(`**Marcados para atenção:** ${attention.map((s) => s.name).join(', ')}`)
    }
    if (topEntry) {
      const name = students.find((s) => s.id === topEntry[0])?.name ?? '?'
      lines.push(`**Com mais registros de dificuldade:** ${name} (${topEntry[1]} aula${topEntry[1] !== 1 ? 's' : ''})`)
    }
    if (lines.length === 0) return 'Nenhum aluno marcado com atenção especial ou dificuldades registradas no momento.'
    return lines.join('\n')
  }

  // ── Resumo de alunos ──────────────────────────────────────────────────────
  if (p.includes('aluno') || p.includes('quantos') && p.includes('alun')) {
    if (students.length === 0) return 'Você não tem alunos cadastrados ainda.'
    const byInstrument: Record<string, number> = {}
    students.forEach((s) => { byInstrument[s.instrument] = (byInstrument[s.instrument] ?? 0) + 1 })
    const topInstr = Object.entries(byInstrument).sort((a, b) => b[1] - a[1])[0]
    return `Você tem **${students.length} aluno${students.length !== 1 ? 's' : ''}** cadastrados. O instrumento mais comum é **${topInstr[0]}** (${topInstr[1]} aluno${topInstr[1] !== 1 ? 's' : ''}).`
  }

  // ── Progresso / evolução ──────────────────────────────────────────────────
  if (p.includes('progresso') || p.includes('evolução') || p.includes('evolucao')) {
    const evolved = lessons.filter((l) => l.performanceTags?.includes('evolved'))
    if (evolved.length === 0) return 'Ainda não há registros de evolução nas aulas. Use as tags de desempenho durante as aulas para registrar progresso.'
    const countByStudent: Record<string, number> = {}
    evolved.forEach((l) => { countByStudent[l.studentId] = (countByStudent[l.studentId] ?? 0) + 1 })
    const topEntry = Object.entries(countByStudent).sort((a, b) => b[1] - a[1])[0]
    const name = students.find((s) => s.id === topEntry[0])?.name ?? '?'
    return `**${evolved.length} registro${evolved.length !== 1 ? 's' : ''} de evolução** nas aulas. O aluno com mais evoluções registradas é **${name}** (${topEntry[1]} aula${topEntry[1] !== 1 ? 's' : ''}).`
  }

  // ── Resumo geral ──────────────────────────────────────────────────────────
  if (p.includes('resumo') || p.includes('visão geral') || p.includes('como está')) {
    const lines = [
      `📚 **${students.length} aluno${students.length !== 1 ? 's' : ''}** cadastrados`,
      `📅 **${todayLessons.length} aula${todayLessons.length !== 1 ? 's' : ''}** hoje`,
      `⏭️ **${upcoming.length} aula${upcoming.length !== 1 ? 's' : ''}** agendadas`,
      `✅ **${concludedLessons.length} aula${concludedLessons.length !== 1 ? 's' : ''}** concluídas no total`,
    ]
    if (students.filter((s) => s.needsAttention).length > 0) {
      lines.push(`⚠️ **${students.filter((s) => s.needsAttention).length} aluno${students.filter((s) => s.needsAttention).length !== 1 ? 's' : ''}** precisam de atenção`)
    }
    return lines.join('\n')
  }

  // ── Perfil do professor ───────────────────────────────────────────────────
  if (p.includes('perfil') || p.includes('meu instrumento') || p.includes('minhas configurações') || p.includes('configuracoes')) {
    const profile = ctx.teacherProfile
    if (!profile) return 'Ainda não encontrei seu perfil configurado. Complete o questionário de configuração para personalizar sua experiência.'
    return `Seu perfil:\n• **Instrumento:** ${instrumentLabel(profile.instrumento)}\n• **Estilo de aula:** ${profile.estilo_aula}\n• **Nível dos alunos:** ${profile.nivel}\n• **Faixa etária:** ${profile.faixa_etaria}\n• **Principal dificuldade:** ${profile.dificuldade}\n• **Acompanhamento:** ${profile.acompanhamento}\n• **Quantidade de alunos:** ${profile.quantidade_alunos}`
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  const profileHint = ctx.teacherProfile
    ? `Como professor de **${instrumentLabel(ctx.teacherProfile.instrumento)}**, posso te ajudar com:`
    : 'Posso te ajudar com informações sobre:'

  return `${profileHint}\n• **Próxima aula** — "Qual é minha próxima aula?"\n• **Agenda de hoje** — "Quantas aulas tenho hoje?"\n• **Semana** — "Como está minha semana?"\n• **Pagamentos** — "Quais pagamentos estão pendentes?"\n• **Alunos** — "Quantos alunos tenho?"\n• **Dificuldades** — "Qual aluno tem mais dificuldade?"\n• **Progresso** — "Como está o progresso dos alunos?"\n• **Resumo** — "Como está tudo?"\n• **Perfil** — "Qual é meu perfil?"\n\nTente uma dessas perguntas!`
}

// ─── Markdown-lite renderer ───────────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode {
  return text.split('\n').map((line, i) => {
    const bold = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    return (
      <span key={i}>
        <span dangerouslySetInnerHTML={{ __html: bold }} />
        {i < text.split('\n').length - 1 && <br />}
      </span>
    )
  })
}

// ─── Suggested prompts ────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  'Qual é minha próxima aula?',
  'Quantas aulas tenho hoje?',
  'Quais pagamentos estão pendentes?',
  'Qual aluno tem mais dificuldade?',
  'Como está minha semana?',
  'Me dá um resumo geral',
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant'
  text: string
  ts: number
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AIAssistantPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [ctx, setCtx] = useState<SystemContext | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    const teacherId = user.id
    Promise.all([
      getLessons(teacherId).catch(() => [] as Lesson[]),
      getStudents(teacherId).catch(() => [] as Student[]),
      getAllPayments(teacherId).catch(() => [] as Payment[]),
      getAllFinancial(teacherId).catch(() => [] as StudentFinancial[]),
      getTeacherProfile(teacherId).catch(() => null),
    ]).then(([lessons, students, payments, financials, teacherProfile]) => {
      setCtx({ lessons, students, payments, financials, teacherId, today: todayISO(), teacherProfile })
    })
  }, [user?.id])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading || !ctx) return
    setInput('')
    const userMsg: Message = { role: 'user', text: trimmed, ts: Date.now() }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 500))
    const response = generateAIResponse(trimmed, ctx)
    setMessages((prev) => [...prev, { role: 'assistant', text: response, ts: Date.now() }])
    setLoading(false)
  }

  return (
    <div className="flex h-full flex-col p-4 sm:p-6 lg:p-8 animate-in">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Sparkles className="h-6 w-6 text-purple-500" />
            Assistente IA
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {ctx?.teacherProfile
              ? `IA personalizada para ${instrumentLabel(ctx.teacherProfile.instrumento)} · ${ctx.teacherProfile.nivel}`
              : 'Pergunte sobre suas aulas, alunos, pagamentos e mais.'}
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Limpar conversa
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center py-8">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100">
                <Sparkles className="h-8 w-8 text-purple-500" />
              </div>
              <h2 className="text-base font-semibold text-gray-700">Como posso ajudar?</h2>
              <p className="mt-1 text-sm text-gray-400 max-w-sm">
                Tenho acesso aos seus dados de aulas, alunos e financeiro. Pergunte qualquer coisa.
              </p>
              {/* Suggested prompts */}
              <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-lg">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => send(prompt)}
                    className="rounded-full border border-purple-100 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-100"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.ts}
                  className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-[#1a7cfa] text-white rounded-tr-md'
                        : 'bg-gray-50 text-gray-800 rounded-tl-md border border-gray-100'
                    )}
                  >
                    {renderMarkdown(msg.text)}
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="rounded-2xl rounded-tl-md border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="flex gap-1.5 items-center">
                      <span className="h-2 w-2 rounded-full bg-purple-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 rounded-full bg-purple-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 rounded-full bg-purple-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Input */}
        <div className="p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
              placeholder="Pergunte sobre suas aulas, alunos, pagamentos…"
              disabled={loading}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm placeholder-gray-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 disabled:opacity-50"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-gray-400">
            Respostas baseadas nos seus dados reais. Estruturado para integração com API real futuramente.
          </p>
        </div>
      </div>
    </div>
  )
}
