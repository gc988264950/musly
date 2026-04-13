import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

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
  date:       string
  time:       string
  duration:   number
  status:     string
  instrument: string
  topic?:     string
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

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(ctx: ChatRequestBody['context']): string {
  // Per-student section with full lesson history
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
  // Check API key
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY não configurada. Adicione ao .env.local e reinicie o servidor.' },
      { status: 500 }
    )
  }

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

  const openai = new OpenAI({ apiKey })

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

    const text = completion.choices[0]?.message?.content ?? 'Não consegui gerar uma resposta. Tente novamente.'

    return NextResponse.json({ text })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'

    // OpenAI specific errors
    if (message.includes('API key')) {
      return NextResponse.json({ error: 'Chave de API inválida ou sem permissão.' }, { status: 401 })
    }
    if (message.includes('quota') || message.includes('billing')) {
      return NextResponse.json({ error: 'Limite de uso da OpenAI atingido. Verifique sua conta.' }, { status: 429 })
    }

    console.error('[AI Chat Route]', err)
    return NextResponse.json({ error: 'Erro ao se comunicar com a OpenAI. Tente novamente.' }, { status: 500 })
  }
}
