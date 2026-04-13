'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Sparkles, Send, Trash2, User, Zap, ShoppingCart,
  Calendar, Clock, CreditCard, AlertTriangle,
  BookOpen, Music, BarChart2, ChevronRight, X,
  CheckCircle2, RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { getLessons, todayISO } from '@/lib/db/lessons'
import { getStudents } from '@/lib/db/students'
import { getAllPayments } from '@/lib/db/payments'
import { getAllFinancial } from '@/lib/db/financial'
import {
  getCreditSummary, consumeCredits, classifyPrompt, PLAN_CREDITS,
  type AICreditSummary, type CreditTier,
} from '@/lib/db/aiCredits'
import { cn } from '@/lib/utils'
import type { Lesson, Student, Payment, StudentFinancial } from '@/lib/db/types'

// ─── System context ───────────────────────────────────────────────────────────

interface SystemContext {
  lessons:    Lesson[]
  students:   Student[]
  payments:   Payment[]
  financials: StudentFinancial[]
  teacherId:  string
  today:      string
}

// ─── Quick actions ────────────────────────────────────────────────────────────

interface QuickAction {
  label:   string
  prompt:  string
  cost:    CreditTier
  icon:    React.ReactNode
  color:   string
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label:  'Próxima aula',
    prompt: 'Qual é minha próxima aula?',
    cost:   1,
    icon:   <Calendar className="h-3.5 w-3.5" />,
    color:  'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100',
  },
  {
    label:  'Aulas hoje',
    prompt: 'Quantas aulas tenho hoje?',
    cost:   1,
    icon:   <Clock className="h-3.5 w-3.5" />,
    color:  'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100',
  },
  {
    label:  'Pagamentos',
    prompt: 'Quais pagamentos estão pendentes este mês?',
    cost:   1,
    icon:   <CreditCard className="h-3.5 w-3.5" />,
    color:  'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100',
  },
  {
    label:  'Com dificuldade',
    prompt: 'Qual aluno está com mais dificuldade ou precisa de atenção?',
    cost:   1,
    icon:   <AlertTriangle className="h-3.5 w-3.5" />,
    color:  'bg-red-50 text-red-700 border-red-100 hover:bg-red-100',
  },
  {
    label:  'Gerar exercício',
    prompt: 'Gere exercícios práticos e estruturados para meus alunos',
    cost:   2,
    icon:   <Music className="h-3.5 w-3.5" />,
    color:  'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100',
  },
  {
    label:  'Analisar aluno',
    prompt: 'Analise o desempenho geral dos meus alunos e me dê recomendações',
    cost:   2,
    icon:   <BarChart2 className="h-3.5 w-3.5" />,
    color:  'bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-100',
  },
  {
    label:  'O que ensinar',
    prompt: 'O que devo trabalhar na próxima aula com meus alunos? Dê sugestões práticas',
    cost:   2,
    icon:   <BookOpen className="h-3.5 w-3.5" />,
    color:  'bg-green-50 text-green-700 border-green-100 hover:bg-green-100',
  },
  {
    label:  'Criar aula',
    prompt: 'Crie um plano de aula completo e detalhado para eu usar hoje',
    cost:   3,
    icon:   <Sparkles className="h-3.5 w-3.5" />,
    color:  'bg-[#eef5ff] text-[#1a7cfa] border-blue-100 hover:bg-blue-100',
  },
]

// ─── Credit packs ─────────────────────────────────────────────────────────────

const CREDIT_PACKS = [
  { credits: 100, price: 'R$ 19,90', pricePerUnit: 'R$ 0,20/crédito' },
  { credits: 300, price: 'R$ 49,90', pricePerUnit: 'R$ 0,17/crédito', popular: true },
  { credits: 500, price: 'R$ 79,90', pricePerUnit: 'R$ 0,16/crédito' },
]

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

  const todayLessons    = lessons.filter((l) => l.date === today)
  const concludedLessons = lessons.filter((l) => l.status === 'concluída')

  // ── Próxima aula ──────────────────────────────────────────────────────────
  if (p.includes('próxima aula') || p.includes('proxima aula') || (p.includes('quando') && p.includes('aula'))) {
    const next = upcoming[0]
    if (!next) return 'Você não tem nenhuma aula agendada no momento. Que tal agendar uma?'
    const student = students.find((s) => s.id === next.studentId)
    return `Sua próxima aula é com **${student?.name ?? 'aluno desconhecido'}** em **${formatDatePT(next.date)}** às **${formatTimePT(next.time)}** (${next.duration} min, ${next.instrument}).${next.topic ? `\n\nTópico: ${next.topic}.` : ''}\n\n${upcoming.length > 1 ? `Você tem mais **${upcoming.length - 1} aula${upcoming.length - 1 !== 1 ? 's' : ''}** agendada${upcoming.length - 1 !== 1 ? 's' : ''} após essa.` : ''}`
  }

  // ── Aulas de hoje ─────────────────────────────────────────────────────────
  if ((p.includes('hoje') && p.includes('aula')) || p.includes('quantas aulas')) {
    if (todayLessons.length === 0) return 'Você não tem nenhuma aula agendada para hoje. Aproveite para planejar as próximas!'
    const lines = todayLessons
      .sort((a, b) => a.time.localeCompare(b.time))
      .map((l) => {
        const s = students.find((st) => st.id === l.studentId)
        return `• **${formatTimePT(l.time)}** — ${s?.name ?? '?'} (${l.instrument}, ${l.duration}min) — *${l.status}*`
      })
    return `Você tem **${todayLessons.length} aula${todayLessons.length !== 1 ? 's' : ''}** hoje:\n\n${lines.join('\n')}`
  }

  // ── Pagamentos pendentes ──────────────────────────────────────────────────
  if (p.includes('pagamento') || p.includes('pendente') || p.includes('mensalidade') || p.includes('financeiro')) {
    const payments   = ctx.payments
    const financials = ctx.financials
    const thisMonth  = new Date().toISOString().slice(0, 7)
    if (financials.length === 0) return 'Nenhum aluno com mensalidade configurada ainda. Acesse o módulo **Financeiro** para configurar.'
    const paidThisMonth    = payments.filter((p) => p.referenceMonth === thisMonth && p.paidAt !== null)
    const pendingFinancials = financials.filter((f) => !paidThisMonth.some((p) => p.studentId === f.studentId))
    if (pendingFinancials.length === 0) return `✅ Todos os **${financials.length} aluno${financials.length !== 1 ? 's' : ''}** com mensalidade já pagaram este mês.`
    const names = pendingFinancials
      .map((f) => students.find((s) => s.id === f.studentId)?.name ?? '?')
    return `**${pendingFinancials.length} pagamento${pendingFinancials.length !== 1 ? 's' : ''} pendente${pendingFinancials.length !== 1 ? 's' : ''}** este mês:\n\n${names.map((n) => `• ${n}`).join('\n')}\n\nAcesse o módulo **Financeiro** para registrar os recebimentos.`
  }

  // ── Alunos com dificuldade / atenção ──────────────────────────────────────
  if (p.includes('dificuldade') || p.includes('atenção') || p.includes('atencao') || p.includes('problema')) {
    const attention   = students.filter((s) => s.needsAttention)
    const diffLessons = lessons.filter((l) => l.performanceTags?.includes('difficulty'))
    const countByStudent: Record<string, number> = {}
    diffLessons.forEach((l) => { countByStudent[l.studentId] = (countByStudent[l.studentId] ?? 0) + 1 })
    const topEntry = Object.entries(countByStudent).sort((a, b) => b[1] - a[1])[0]
    const lines: string[] = []
    if (attention.length > 0) lines.push(`**Alunos marcados para atenção especial:**\n${attention.map((s) => `• ${s.name}`).join('\n')}`)
    if (topEntry) {
      const name = students.find((s) => s.id === topEntry[0])?.name ?? '?'
      lines.push(`**Aluno com mais registros de dificuldade:**\n• ${name} (${topEntry[1]} aula${topEntry[1] !== 1 ? 's' : ''} com dificuldade registrada)`)
    }
    if (lines.length === 0) return 'Nenhum aluno marcado com atenção especial no momento. Continue registrando o desempenho durante as aulas para acompanhar a evolução.'
    return lines.join('\n\n')
  }

  // ── Resumo de alunos ──────────────────────────────────────────────────────
  if ((p.includes('aluno') || p.includes('quantos')) && !p.includes('analis')) {
    if (students.length === 0) return 'Você não tem alunos cadastrados ainda. Acesse **Alunos** para começar.'
    const byInstrument: Record<string, number> = {}
    students.forEach((s) => { byInstrument[s.instrument] = (byInstrument[s.instrument] ?? 0) + 1 })
    const topInstr = Object.entries(byInstrument).sort((a, b) => b[1] - a[1])
    return `Você tem **${students.length} aluno${students.length !== 1 ? 's' : ''}** cadastrados.\n\n**Por instrumento:**\n${topInstr.map(([instr, count]) => `• ${instr}: ${count} aluno${count !== 1 ? 's' : ''}`).join('\n')}`
  }

  // ── Análise de desempenho ─────────────────────────────────────────────────
  if (p.includes('analis') || p.includes('desempenho') || p.includes('performance')) {
    if (students.length === 0) return 'Você não tem alunos cadastrados para analisar ainda.'
    const attention       = students.filter((s) => s.needsAttention)
    const concludedCount  = concludedLessons.length
    const evolved         = lessons.filter((l) => l.performanceTags?.includes('evolved'))
    const diffLessons     = lessons.filter((l) => l.performanceTags?.includes('difficulty'))
    const byInstrument: Record<string, number> = {}
    students.forEach((s) => { byInstrument[s.instrument] = (byInstrument[s.instrument] ?? 0) + 1 })
    const topInstr = Object.entries(byInstrument).sort((a, b) => b[1] - a[1])[0]

    return `📊 **Análise geral dos seus alunos**\n\n**Visão geral:**\n• ${students.length} aluno${students.length !== 1 ? 's' : ''} cadastrados\n• ${concludedCount} aula${concludedCount !== 1 ? 's' : ''} concluídas no histórico\n• Instrumento principal: ${topInstr ? topInstr[0] : 'não definido'}\n\n**Indicadores de desempenho:**\n• Evoluções registradas: ${evolved.length} aula${evolved.length !== 1 ? 's' : ''}\n• Dificuldades registradas: ${diffLessons.length} aula${diffLessons.length !== 1 ? 's' : ''}\n${attention.length > 0 ? `• ⚠️ ${attention.length} aluno${attention.length !== 1 ? 's' : ''} precisando de atenção especial: ${attention.map((s) => s.name).join(', ')}` : '• ✅ Nenhum aluno com alerta de atenção especial'}\n\n💡 **Recomendação:** Registre tags de desempenho durante as aulas (evolução, dificuldade, foco) para análises mais precisas com o tempo.`
  }

  // ── Geração de exercícios ─────────────────────────────────────────────────
  if (p.includes('exerc') || p.includes('prática') || p.includes('pratica') || p.includes('técnica') || p.includes('tecnica')) {
    const instruments = students.map((s) => s.instrument).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3)
    const instrList   = instruments.length > 0 ? instruments.join(', ') : 'seus instrumentos'

    return `🎵 **Exercícios práticos para ${instrList}**\n\n**Aquecimento (5–10 min)**\n• Escalas maiores e menores — todas as tonalidades, 2 oitavas\n• Arpejos básicos — posição fechada e aberta\n• Cromatismos lentos para relaxamento muscular\n\n**Técnica (10–15 min)**\n• Hanon nº 1–5 — foco em igualdade e independência\n• Staccato e legato alternados — 4 compassos cada\n• Dinâmica controlada: do pp ao ff e de volta\n\n**Leitura à primeira vista (5–10 min)**\n• Peça nova no nível imediatamente abaixo do repertório atual\n• Leitura de ritmo em percussão antes de tocar as notas\n\n**Repertório (20–25 min)**\n• Trabalhar seções problemáticas em loop lento (♩=60)\n• Depois em velocidade alvo, depois em contexto\n\n💡 **Dica pedagógica:** Comece sempre pelos exercícios mais difíceis enquanto a concentração está no pico. Reserve o aquecimento para o início apenas se houver tensão muscular.\n\nQuer exercícios específicos para um aluno? Me diga o nome e o instrumento.`
  }

  // ── O que trabalhar / sugestão de conteúdo ────────────────────────────────
  if (p.includes('o que trabalhar') || p.includes('o que ensinar') || p.includes('sugerir') || p.includes('sugira') || p.includes('próxima aula') && p.includes('trabalhar')) {
    const nextLesson = upcoming[0]
    const student    = nextLesson ? students.find((s) => s.id === nextLesson.studentId) : null
    const lastLesson = student
      ? [...lessons]
          .filter((l) => l.studentId === student.id && l.status === 'concluída')
          .sort((a, b) => b.date.localeCompare(a.date))[0]
      : null

    const studentContext = student
      ? `**Próxima aula:** ${student.name} — ${student.instrument}${lastLesson?.topic ? `\nÚltimo tópico: ${lastLesson.topic}` : ''}\n\n`
      : ''

    return `💡 **Sugestões para a próxima aula**\n\n${studentContext}**Estrutura recomendada:**\n\n1. **Revisão (10 min)**\n   • Recapitular o que foi trabalhado na aula anterior\n   • Ouvir a tarefa de casa — feedback imediato\n\n2. **Continuidade técnica (15 min)**\n   • Aprofundar o ponto técnico principal da aula anterior\n   • Introduzir uma nova micro-habilidade relacionada\n\n3. **Repertório (25 min)**\n   • Avançar na peça atual — mínimo 4 compassos novos\n   • Trabalhar passagem difícil identificada anteriormente\n\n4. **Novidade motivacional (5 min)**\n   • Tocar um trecho que o aluno quer aprender (engajamento)\n   • Ou demonstrar algo inspirador relacionado ao instrumento\n\n5. **Tarefa (5 min)**\n   • Definir tarefa clara, mensurável e alcançável\n   • Ex: "Pratique os compassos 8–16 com metrônomo ♩=60"\n\nQuer um plano detalhado para um aluno específico? Me diga o nome.`
  }

  // ── Plano de aula completo ────────────────────────────────────────────────
  if (p.includes('plano de aula') || p.includes('criar aula') || p.includes('gerar aula') || p.includes('planejamento')) {
    const nextLesson = upcoming[0]
    const student    = nextLesson ? students.find((s) => s.id === nextLesson.studentId) : null
    const lastLesson = student
      ? [...lessons]
          .filter((l) => l.studentId === student.id && l.status === 'concluída')
          .sort((a, b) => b.date.localeCompare(a.date))[0]
      : null

    const header = student
      ? `**Aluno:** ${student.name} | **Instrumento:** ${student.instrument} | **Nível:** ${student.level ?? 'não definido'}`
      : '**Plano genérico — adapte para seu aluno**'

    const topic = lastLesson?.topic
      ? `Continuidade de: ${lastLesson.topic}`
      : 'Defina conforme o repertório atual'

    return `📋 **Plano de Aula Completo — 60 minutos**\n\n${header}\n\n**Objetivo da aula:**\n${topic}\n\n──────────────────────────\n\n⏱ **0–10 min | Aquecimento**\n• Escalas no instrumento — andamento lento (♩=60)\n• Foco na qualidade sonora, não velocidade\n• Verificar postura e relaxamento\n\n⏱ **10–25 min | Técnica**\n• Exercício principal — baseado na dificuldade atual do aluno\n• Hanon ou estudos específicos do instrumento\n• Correção de postura / articulação / toque\n\n⏱ **25–50 min | Repertório**\n• Revisão do trecho da semana anterior\n• Avançar 4–8 compassos novos\n• Trabalhar 1–2 passagens problemáticas em detalhes\n• Tocar do início ao fim sem parar ao final\n\n⏱ **50–57 min | Tarefa e feedback**\n• Feedback positivo e construtivo\n• Definir tarefa específica para a semana\n• Anotar no sistema o que foi trabalhado\n\n⏱ **57–60 min | Encerramento**\n• Tocar peça favorita do aluno (motivação)\n• Confirmar próxima aula\n\n──────────────────────────\n\n📝 **Tarefa sugerida:**\nPraticar os compassos trabalhados hoje com metrônomo, ♩=60, mãos separadas. Repetir 3x por dia até a próxima aula.\n\n💡 **Observação pedagógica:**\nSe o aluno chegar disperso, comece pelo repertório favorito para engajá-lo antes da parte técnica.`
  }

  // ── Semana ────────────────────────────────────────────────────────────────
  if (p.includes('semana') && p.includes('aula')) {
    const d   = new Date(today + 'T00:00:00')
    const day = d.getDay()
    const mon = new Date(d); mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
    const fmtISO     = (dt: Date) => dt.toISOString().slice(0, 10)
    const weekLessons = lessons.filter((l) => l.date >= fmtISO(mon) && l.date <= fmtISO(sun))
    if (weekLessons.length === 0) return 'Nenhuma aula registrada para esta semana.'
    return `Esta semana você tem **${weekLessons.length} aula${weekLessons.length !== 1 ? 's' : ''}** registradas:\n• Agendadas: ${weekLessons.filter((l) => l.status === 'agendada').length}\n• Concluídas: ${weekLessons.filter((l) => l.status === 'concluída').length}\n• Canceladas: ${weekLessons.filter((l) => l.status === 'cancelada').length}`
  }

  // ── Progresso / evolução ──────────────────────────────────────────────────
  if (p.includes('progresso') || p.includes('evolução') || p.includes('evolucao')) {
    const evolved = lessons.filter((l) => l.performanceTags?.includes('evolved'))
    if (evolved.length === 0) return 'Ainda não há registros de evolução nas aulas.\n\nDica: Use as **tags de desempenho** durante as aulas (no modo aula) para registrar progresso. Com o tempo, a IA conseguirá identificar padrões e sugerir adaptações.'
    const countByStudent: Record<string, number> = {}
    evolved.forEach((l) => { countByStudent[l.studentId] = (countByStudent[l.studentId] ?? 0) + 1 })
    const sorted = Object.entries(countByStudent).sort((a, b) => b[1] - a[1])
    const lines  = sorted.map(([id, count]) => {
      const name = students.find((s) => s.id === id)?.name ?? '?'
      return `• **${name}**: ${count} registro${count !== 1 ? 's' : ''} de evolução`
    })
    return `📈 **Evolução registrada nas aulas:**\n\n${lines.join('\n')}\n\nTotal: **${evolved.length} aula${evolved.length !== 1 ? 's' : ''}** com evolução registrada.`
  }

  // ── Resumo geral ──────────────────────────────────────────────────────────
  if (p.includes('resumo') || p.includes('visão geral') || p.includes('como está') || p.includes('visao geral')) {
    const pendingPayments = ctx.financials.length
    return `📊 **Resumo do seu estúdio**\n\n• 👥 **${students.length} aluno${students.length !== 1 ? 's' : ''}** cadastrados\n• 📅 **${todayLessons.length} aula${todayLessons.length !== 1 ? 's' : ''}** agendadas para hoje\n• ⏭️ **${upcoming.length} aula${upcoming.length !== 1 ? 's' : ''}** futuras agendadas\n• ✅ **${concludedLessons.length} aula${concludedLessons.length !== 1 ? 's' : ''}** concluídas no total\n${students.filter((s) => s.needsAttention).length > 0 ? `• ⚠️ **${students.filter((s) => s.needsAttention).length} aluno${students.filter((s) => s.needsAttention).length !== 1 ? 's' : ''}** precisando de atenção\n` : ''}${pendingPayments > 0 ? `• 💰 **${pendingPayments} aluno${pendingPayments !== 1 ? 's' : ''}** com mensalidade configurada` : ''}`
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  return `Sou seu assistente especializado em ensino musical. Posso te ajudar com:\n\n**Consultas rápidas (1 crédito):**\n• "Qual é minha próxima aula?"\n• "Quantas aulas tenho hoje?"\n• "Quais pagamentos estão pendentes?"\n• "Qual aluno tem mais dificuldade?"\n\n**Geração inteligente (2 créditos):**\n• "Gere exercícios para meus alunos"\n• "O que devo trabalhar na próxima aula?"\n• "Analise o desempenho dos meus alunos"\n\n**Planejamento avançado (3 créditos):**\n• "Crie um plano de aula completo"\n• "Faça um planejamento mensal"\n\nO que você precisa hoje?`
}

// ─── Markdown-lite renderer ───────────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode {
  return text.split('\n').map((line, i, arr) => {
    const bold = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    return (
      <span key={i}>
        <span dangerouslySetInnerHTML={{ __html: bold }} />
        {i < arr.length - 1 && <br />}
      </span>
    )
  })
}

// ─── Message type ─────────────────────────────────────────────────────────────

interface Message {
  role:     'user' | 'assistant'
  text:     string
  ts:       number
  credits?: CreditTier
  isError?: boolean
}

// ─── Credit badge color ───────────────────────────────────────────────────────

function creditColor(summary: AICreditSummary | null): string {
  if (!summary) return 'text-gray-400'
  const pct = summary.remaining / summary.total
  if (pct > 0.5) return 'text-green-600'
  if (pct > 0.2) return 'text-amber-600'
  return 'text-red-500'
}

// ─── Buy credits modal ────────────────────────────────────────────────────────

function BuyCreditsModal({ onClose, planId }: { onClose: () => void; planId: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md flex flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl max-h-[92dvh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Créditos de IA</h2>
            <p className="text-xs text-gray-400">Amplie sua capacidade mensal</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Plan upgrade prompt */}
          <div className="rounded-xl border border-blue-100 bg-[#eef5ff] p-4">
            <p className="text-sm font-semibold text-[#1a7cfa]">Créditos mensais por plano</p>
            <div className="mt-3 space-y-1.5">
              {(Object.entries(PLAN_CREDITS) as [string, number][]).map(([plan, credits]) => (
                <div key={plan} className="flex items-center justify-between text-sm">
                  <span className="font-medium capitalize text-gray-700">{plan === 'free' ? 'Grátis' : plan === 'pro' ? 'Pro' : 'Studio'}</span>
                  <span className={cn('font-bold', plan === planId ? 'text-[#1a7cfa]' : 'text-gray-500')}>
                    {credits} créditos/mês{plan === planId ? ' ← atual' : ''}
                  </span>
                </div>
              ))}
            </div>
            <Link href="/plans">
              <button onClick={onClose} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#1a7cfa] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1468d6] transition-colors">
                Fazer upgrade de plano <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>

          {/* Credit packs */}
          <div>
            <p className="mb-3 text-sm font-medium text-gray-700">Ou compre créditos avulsos:</p>
            <div className="space-y-2">
              {CREDIT_PACKS.map((pack) => (
                <div
                  key={pack.credits}
                  className={cn(
                    'relative flex items-center justify-between rounded-xl border p-4 transition-colors',
                    pack.popular ? 'border-[#1a7cfa] bg-[#eef5ff]' : 'border-gray-200 bg-white'
                  )}
                >
                  {pack.popular && (
                    <span className="absolute -top-2.5 left-4 rounded-full bg-[#1a7cfa] px-2.5 py-0.5 text-[10px] font-bold text-white">
                      MAIS POPULAR
                    </span>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{pack.credits} créditos</p>
                    <p className="text-xs text-gray-400">{pack.pricePerUnit}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{pack.price}</p>
                    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                      Em breve
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400">
            Integração de pagamento disponível em breve.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AIAssistantPage() {
  const { user } = useAuth()
  const { planId } = useSubscription()

  const [messages,        setMessages]        = useState<Message[]>([])
  const [input,           setInput]           = useState('')
  const [loading,         setLoading]         = useState(false)
  const [ctx,             setCtx]             = useState<SystemContext | null>(null)
  const [credits,         setCredits]         = useState<AICreditSummary | null>(null)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  // ── Load system data ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const id = user.id
    Promise.all([
      getLessons(id).catch(() => [] as Lesson[]),
      getStudents(id).catch(() => [] as Student[]),
      getAllPayments(id).catch(() => [] as Payment[]),
      getAllFinancial(id).catch(() => [] as StudentFinancial[]),
      getCreditSummary(id, planId).catch(() => null),
    ]).then(([lessons, students, payments, financials, creditSummary]) => {
      setCtx({ lessons, students, payments, financials, teacherId: id, today: todayISO() })
      setCredits(creditSummary)
    })
  }, [user?.id, planId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Estimated cost of current input ───────────────────────────────────────
  const estimatedCost: CreditTier | null = input.trim() ? classifyPrompt(input.trim()) : null

  // ── Send a message ─────────────────────────────────────────────────────────
  const send = useCallback(async (text: string, costOverride?: CreditTier) => {
    const trimmed = text.trim()
    if (!trimmed || loading || !ctx) return

    const cost = costOverride ?? classifyPrompt(trimmed)

    // Check credits
    if (credits && credits.remaining < cost) {
      setMessages((prev) => [
        ...prev,
        { role: 'user', text: trimmed, ts: Date.now() },
        {
          role: 'assistant',
          text: `Você não tem créditos suficientes para esta ação.\n\nCusto: **${cost} crédito${cost > 1 ? 's' : ''}** | Disponível: **${credits.remaining} crédito${credits.remaining !== 1 ? 's' : ''}**\n\nFaça upgrade do seu plano ou aguarde a renovação mensal.`,
          ts: Date.now(),
          isError: true,
        },
      ])
      return
    }

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: trimmed, ts: Date.now() }])
    setLoading(true)

    // Simulated thinking delay
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 500))

    const response = generateAIResponse(trimmed, ctx)

    // Deduct credits (fire and forget — don't block UI)
    if (user) {
      consumeCredits(user.id, cost).catch(() => {})
      setCredits((prev) =>
        prev ? { ...prev, used: prev.used + cost, remaining: Math.max(0, prev.remaining - cost) } : prev
      )
    }

    setMessages((prev) => [
      ...prev,
      { role: 'assistant', text: response, ts: Date.now(), credits: cost },
    ])
    setLoading(false)
  }, [loading, ctx, credits, user]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  // ── Credit status ──────────────────────────────────────────────────────────
  const creditPct = credits ? credits.remaining / credits.total : 1
  const creditTextColor = creditColor(credits)

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col p-4 sm:p-6 lg:p-8 animate-in">

      {/* ── Header ── */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            Assistente IA
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Especialista em ensino musical · conectado ao seu estúdio
          </p>
        </div>

        {/* Credit counter */}
        <div className="flex flex-shrink-0 items-center gap-2">
          {credits ? (
            <button
              onClick={() => setShowCreditModal(true)}
              className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm transition-colors hover:border-purple-200 hover:bg-purple-50"
            >
              <Zap className={cn('h-4 w-4', creditTextColor)} />
              <div className="text-left">
                <p className={cn('text-sm font-bold leading-tight', creditTextColor)}>
                  {credits.remaining}
                  <span className="text-xs font-normal text-gray-400"> / {credits.total}</span>
                </p>
                <p className="text-[10px] text-gray-400 leading-tight">créditos</p>
              </div>
              {/* Mini progress bar */}
              <div className="h-1.5 w-14 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    creditPct > 0.5 ? 'bg-green-500' : creditPct > 0.2 ? 'bg-amber-500' : 'bg-red-500'
                  )}
                  style={{ width: `${Math.max(4, creditPct * 100)}%` }}
                />
              </div>
            </button>
          ) : (
            <div className="h-10 w-36 animate-pulse rounded-xl bg-gray-100" />
          )}

          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="rounded-xl border border-gray-200 p-2.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
              title="Limpar conversa"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {QUICK_ACTIONS.map((action) => {
          const disabled = loading || !ctx || (credits !== null && credits.remaining < action.cost)
          return (
            <button
              key={action.label}
              onClick={() => send(action.prompt, action.cost)}
              disabled={disabled}
              title={`${action.label} — ${action.cost} crédito${action.cost > 1 ? 's' : ''}`}
              className={cn(
                'flex flex-shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all',
                action.color,
                disabled && 'cursor-not-allowed opacity-40'
              )}
            >
              {action.icon}
              {action.label}
              <span className="ml-0.5 flex items-center gap-0.5 rounded-full bg-black/5 px-1.5 py-0.5 text-[9px] font-bold">
                <Zap className="h-2 w-2" />
                {action.cost}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Chat area ── */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.length === 0 ? (
            /* Welcome state */
            <div className="flex h-full flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50">
                <Sparkles className="h-8 w-8 text-purple-500" />
              </div>
              <h2 className="text-base font-semibold text-gray-800">
                Olá, professor! Como posso ajudar?
              </h2>
              <p className="mt-1.5 max-w-sm text-sm text-gray-400">
                Tenho acesso ao seu estúdio — alunos, aulas, finanças e progresso. Pergunte qualquer coisa ou use os atalhos acima.
              </p>

              {/* Credit info */}
              {credits && (
                <div className="mt-6 flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-500">
                  <Zap className={cn('h-3.5 w-3.5', creditTextColor)} />
                  <span>
                    <span className={cn('font-semibold', creditTextColor)}>{credits.remaining}</span>
                    {' '}créditos disponíveis este mês
                    {credits.remaining <= 2 && (
                      <button
                        onClick={() => setShowCreditModal(true)}
                        className="ml-2 font-semibold text-[#1a7cfa] hover:underline"
                      >
                        Ver opções
                      </button>
                    )}
                  </span>
                </div>
              )}

              {/* Example prompts */}
              <div className="mt-6 flex max-w-md flex-wrap justify-center gap-2">
                {[
                  'Qual é minha próxima aula?',
                  'Quais pagamentos estão pendentes?',
                  'Me dê um resumo geral',
                  'Gere exercícios para hoje',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => send(prompt)}
                    disabled={loading || !ctx}
                    className="rounded-full border border-purple-100 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-100 disabled:opacity-40"
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

                  <div className="max-w-[82%] space-y-1">
                    <div
                      className={cn(
                        'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                        msg.role === 'user'
                          ? 'bg-[#1a7cfa] text-white rounded-tr-md'
                          : msg.isError
                          ? 'bg-red-50 text-red-800 border border-red-100 rounded-tl-md'
                          : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-md'
                      )}
                    >
                      {renderMarkdown(msg.text)}
                    </div>
                    {/* Credit cost badge for AI messages */}
                    {msg.role === 'assistant' && msg.credits && (
                      <div className="flex items-center gap-1 pl-1">
                        <Zap className="h-2.5 w-2.5 text-gray-300" />
                        <span className="text-[10px] text-gray-300">
                          {msg.credits} crédito{msg.credits > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="rounded-2xl rounded-tl-md border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="flex items-center gap-1.5">
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

        {/* Input area */}
        <div className="p-3 sm:p-4">
          {/* Cost estimate */}
          {estimatedCost && (
            <div className="mb-2 flex items-center gap-1.5 text-[11px] text-gray-400">
              <Zap className="h-3 w-3" />
              <span>
                Custo estimado:{' '}
                <span className="font-semibold text-gray-600">
                  {estimatedCost} crédito{estimatedCost > 1 ? 's' : ''}
                </span>
                {' '}— {estimatedCost === 1 ? 'Consulta simples' : estimatedCost === 2 ? 'Geração inteligente' : 'Planejamento avançado'}
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte sobre suas aulas, alunos, pagamentos…"
              disabled={loading}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm placeholder-gray-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 disabled:opacity-50"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading || !ctx}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>

          {/* Out of credits warning */}
          {credits && credits.remaining === 0 && (
            <div className="mt-2 flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-3 py-2">
              <p className="text-xs text-red-700">
                Sem créditos disponíveis este mês.
              </p>
              <button
                onClick={() => setShowCreditModal(true)}
                className="text-xs font-semibold text-red-700 hover:underline"
              >
                Ver opções →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Buy credits modal */}
      {showCreditModal && (
        <BuyCreditsModal onClose={() => setShowCreditModal(false)} planId={planId} />
      )}
    </div>
  )
}
