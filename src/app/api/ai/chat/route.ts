import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, AI_CHAT_LIMIT } from '@/lib/rateLimit'
import { classifyPrompt, PLAN_CREDITS }  from '@/lib/ai/creditTiers'
import type { PlanId } from '@/lib/db/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentWithHistory {
  name:            string
  instrument:      string
  level?:          string
  needsAttention?: boolean
  recentLessons:   Array<{
    date:             string
    topic?:           string
    status:           string
    performanceTags?: string[]
    notes?:           string
  }>
}

interface LessonSummary {
  date:        string
  time:        string
  duration:    number
  status:      string
  instrument:  string
  topic?:      string
  studentName: string
}

interface PaymentStatus {
  studentName: string
  status:      'pendente' | 'pago' | 'atrasado'
}

interface ChatRequestBody {
  message: string
  context: {
    students:        StudentWithHistory[]
    upcomingLessons: LessonSummary[]
    todayLessons:    LessonSummary[]
    payments:        PaymentStatus[]
    today:           string
  }
}

// Maximum characters accepted in a single user message
const MAX_MESSAGE_LENGTH = 2000

// ─── Helpers ──────────────────────────────────────────────────────────────────

function currentMonth(): string {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(ctx: ChatRequestBody['context']): string {
  const studentDetails = ctx.students.length > 0
    ? ctx.students.map((s) => {
        const header = `**${s.name}** (${s.instrument}${s.level ? `, ${s.level}` : ''}${s.needsAttention ? ', ⚠️ precisa de atenção' : ''})`
        if (s.recentLessons.length === 0) {
          return `  ${header}\n    Histórico: sem aulas recentes registradas`
        }
        const lessonLines = s.recentLessons.map((l) => {
          const tags  = l.performanceTags?.length ? ` | ${l.performanceTags.join(', ')}` : ''
          const topic = l.topic ? ` | "${l.topic}"` : ''
          const notes = l.notes ? ` | obs: ${l.notes}` : ''
          return `    • ${l.date}${topic} | ${l.status}${tags}${notes}`
        }).join('\n')
        return `  ${header}\n${lessonLines}`
      }).join('\n\n')
    : '  (nenhum aluno cadastrado)'

  const upcomingList = ctx.upcomingLessons.slice(0, 6).length > 0
    ? ctx.upcomingLessons.slice(0, 6).map((l) =>
        `  - ${l.date} ${l.time} | ${l.studentName} | ${l.instrument} | ${l.duration}min${l.topic ? ` | "${l.topic}"` : ''}`
      ).join('\n')
    : '  (nenhuma aula agendada)'

  const todayList = ctx.todayLessons.length > 0
    ? ctx.todayLessons.map((l) =>
        `  - ${l.time} | ${l.studentName} | ${l.instrument} | ${l.status}`
      ).join('\n')
    : '  (nenhuma aula hoje)'

  const pendingPayments = ctx.payments.filter((p) => p.status !== 'pago')
  const paymentList = pendingPayments.length > 0
    ? pendingPayments.map((p) => `  - ${p.studentName}: ${p.status}`).join('\n')
    : '  (nenhum pagamento pendente)'

  return `Você é a **Musly IA**, assistente pessoal de ensino musical para professores brasileiros, integrada à plataforma **Musly**.

## Personalidade
- Conversacional, direto e cálido — você conhece o estúdio do professor pessoalmente
- Especialista em pedagogia musical (piano, violão, violino, percussão, teoria musical e outros)
- Responde sempre em português brasileiro
- Usa markdown apenas quando organiza informações (listas, negrito) — não em respostas curtas
- Quando o professor perguntar "Como tá o Pedro?" ou qualquer nome de aluno, responda com base no histórico real de aulas daquele aluno

## Conhecimento especializado
- Metodologias: Suzuki, Royal Conservatory, Berklee, Kodály
- Pedagogia para crianças, jovens e adultos
- Técnica instrumental, leitura musical, improvisação, composição
- Exercícios e planos de aula por nível (iniciante, intermediário, avançado)
- Gestão de estúdio, finanças, organização pedagógica

## Dados reais do estúdio — hoje é ${ctx.today}

### Alunos e histórico de aulas (${ctx.students.length} aluno${ctx.students.length !== 1 ? 's' : ''})
${studentDetails}

### Aulas de hoje
${todayList}

### Próximas aulas agendadas
${upcomingList}

### Pagamentos pendentes
${paymentList}

## Como responder
- Se o professor perguntar sobre um aluno específico pelo nome, consulte o histórico desse aluno acima e dê uma resposta personalizada
- Use os dados do estúdio para personalizar sempre — nomes, instrumentos, datas, tópicos
- Para consultas simples (próxima aula, pagamentos, resumo): resposta curta e direta
- Para exercícios, planos de aula e análises: resposta estruturada com detalhes
- Nunca invente dados que não estão neste contexto — se faltar algo, diga claramente
- Máximo 600 palavras, exceto para planos de aula completos`
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── 1. Auth: only authenticated teachers ─────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  if (user.user_metadata?.role === 'aluno') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  // ── 2. Rate limit: 10 req / 60 s per user ────────────────────────────────
  const rl = checkRateLimit(user.id, AI_CHAT_LIMIT)
  if (!rl.allowed) {
    const retryAfterSec = Math.ceil((rl.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: 'Muitas requisições. Aguarde um momento e tente novamente.' },
      {
        status:  429,
        headers: {
          'Retry-After':           String(retryAfterSec),
          'X-RateLimit-Limit':     String(AI_CHAT_LIMIT.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset':     String(Math.ceil(rl.resetAt / 1000)),
        },
      },
    )
  }

  // ── 3. Parse and validate request body ───────────────────────────────────
  let body: ChatRequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  const { message, context } = body

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400 })
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Mensagem muito longa. Máximo ${MAX_MESSAGE_LENGTH} caracteres.` },
      { status: 400 },
    )
  }

  // ── 4. Load user's plan from the database ─────────────────────────────────
  const { data: sub, error: subErr } = await supabase
    .from('subscriptions')
    .select('plan_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (subErr) console.warn('[AI Chat] subscriptions read error:', subErr.code, subErr.message)

  const planId       = ((sub?.plan_id ?? 'free') as PlanId)
  const totalMonthly = PLAN_CREDITS[planId] ?? 10

  // ── 5. Load current credit state from the database ────────────────────────
  const month = currentMonth()
  const { data: usage, error: usageReadErr } = await supabase
    .from('ai_credit_usage')
    .select('credits_used, extra_credits')
    .eq('user_id', user.id)
    .eq('month', month)
    .maybeSingle()

  if (usageReadErr) console.warn('[AI Chat] ai_credit_usage read error:', usageReadErr.code, usageReadErr.message)

  const creditsUsedNow   = usage?.credits_used  ?? 0
  const extraCreditsNow  = usage?.extra_credits ?? 0
  const monthlyRemaining = Math.max(0, totalMonthly - creditsUsedNow)
  const totalAvailable   = monthlyRemaining + extraCreditsNow

  // ── 6. Classify the prompt and determine cost (server-authoritative) ──────
  const cost = classifyPrompt(message)

  console.log(`[AI Chat] user=${user.id} plan=${planId} month=${month} used=${creditsUsedNow}/${totalMonthly} extra=${extraCreditsNow} cost=${cost} available=${totalAvailable}`)

  // ── 7. Reject if insufficient credits ────────────────────────────────────
  if (totalAvailable < cost) {
    console.log(`[AI Chat] BLOCKED — insufficient credits (available=${totalAvailable} cost=${cost})`)
    return NextResponse.json(
      {
        error: 'Créditos insuficientes. Recarregue seus créditos para continuar usando a IA.',
        code:  'insufficient_credits',
        creditsRemaining: totalAvailable,
      },
      { status: 402 },
    )
  }

  // ── 8. Verify OpenAI key before incurring any cost ────────────────────────
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('[AI Chat] OPENAI_API_KEY is not set.')
    return NextResponse.json(
      { error: 'Serviço de IA temporariamente indisponível.' },
      { status: 503 },
    )
  }

  // ── 9. Call OpenAI ─────────────────────────────────────────────────────────
  const openai = new OpenAI({ apiKey })
  let aiText: string

  try {
    const completion = await openai.chat.completions.create({
      model:       'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildSystemPrompt(context) },
        { role: 'user',   content: message },
      ],
      max_tokens:  800,
      temperature: 0.7,
    })
    aiText = completion.choices[0]?.message?.content
      ?? 'Não consegui gerar uma resposta. Tente novamente.'
  } catch (err: unknown) {
    console.error('[AI Chat Route] OpenAI error:', err)
    const errMsg = err instanceof Error ? err.message : ''
    if (errMsg.includes('API key') || errMsg.includes('Incorrect API key')) {
      return NextResponse.json({ error: 'Configuração de IA inválida. Contate o suporte.' }, { status: 503 })
    }
    if (errMsg.includes('quota') || errMsg.includes('billing') || errMsg.includes('insufficient_quota')) {
      return NextResponse.json({ error: 'Limite de uso da IA atingido. Tente novamente mais tarde.' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Erro ao se comunicar com a IA. Tente novamente.' }, { status: 500 })
  }

  // ── 10. Deduct credits server-side ────────────────────────────────────────
  // Monthly credits consumed first; extra (purchased) credits used only after
  // monthly allowance is exhausted.
  let newUsed  = creditsUsedNow
  let newExtra = extraCreditsNow

  if (cost <= monthlyRemaining) {
    newUsed = creditsUsedNow + cost
  } else {
    const fromExtra = cost - monthlyRemaining
    newUsed  = totalMonthly
    newExtra = Math.max(0, extraCreditsNow - fromExtra)
  }

  console.log(`[AI Chat] Deducting ${cost} credit(s): used ${creditsUsedNow}→${newUsed}, extra ${extraCreditsNow}→${newExtra}`)

  let deductionOk = false

  if (usage) {
    // Row exists — update it. Try with updated_at first; fall back without if column absent.
    const { error: updErr } = await supabase
      .from('ai_credit_usage')
      .update({ credits_used: newUsed, extra_credits: newExtra, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('month', month)

    if (updErr) {
      console.error('[AI Chat] UPDATE (with updated_at) failed:', updErr.code, updErr.message)
      // Retry without updated_at in case the column is not in the schema
      const { error: updErr2 } = await supabase
        .from('ai_credit_usage')
        .update({ credits_used: newUsed, extra_credits: newExtra })
        .eq('user_id', user.id)
        .eq('month', month)

      if (updErr2) {
        console.error('[AI Chat] UPDATE (fallback) also failed:', updErr2.code, updErr2.message)
      } else {
        deductionOk = true
        console.log('[AI Chat] UPDATE succeeded via fallback (no updated_at)')
      }
    } else {
      deductionOk = true
      console.log('[AI Chat] UPDATE succeeded')
    }
  } else {
    // No row yet — insert one.
    const { error: insErr } = await supabase
      .from('ai_credit_usage')
      .insert({ user_id: user.id, month, credits_used: newUsed, extra_credits: newExtra })

    if (insErr) {
      console.error('[AI Chat] INSERT failed:', insErr.code, insErr.message)
    } else {
      deductionOk = true
      console.log('[AI Chat] INSERT succeeded (first usage this month)')
    }
  }

  if (!deductionOk) {
    console.error(`[AI Chat] CREDIT DEDUCTION FAILED for user=${user.id}. AI response delivered but credits were NOT deducted.`)
  }

  // Audit entry — non-fatal, log failures but don't block response
  const { error: txErr } = await supabase.from('credit_transactions').insert({
    user_id:     user.id,
    type:        'extra_usage',
    amount:      -cost,
    description: `Uso de ${cost} crédito(s) de IA`,
  })
  if (txErr) console.warn('[AI Chat] credit_transactions insert failed:', txErr.code, txErr.message)

  // ── 11. Return response with authoritative credit info ─────────────────────
  const newMonthlyRemaining = Math.max(0, totalMonthly - newUsed)
  const creditsRemaining    = newMonthlyRemaining + newExtra

  console.log(`[AI Chat] Done — creditsUsed=${cost} creditsRemaining=${creditsRemaining} deductionOk=${deductionOk}`)

  return NextResponse.json({
    text:             aiText,
    creditsUsed:      cost,
    creditsRemaining,
  })
}
