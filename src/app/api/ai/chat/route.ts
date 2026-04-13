import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentSummary {
  name:         string
  instrument:   string
  level?:       string
  needsAttention?: boolean
}

interface LessonSummary {
  date:      string
  time:      string
  duration:  number
  status:    string
  instrument: string
  topic?:    string
  studentName: string
}

interface PaymentStatus {
  studentName: string
  status:      'pendente' | 'pago' | 'atrasado'
}

interface ChatRequestBody {
  message:    string
  tier:       1 | 2 | 3
  context: {
    students:        StudentSummary[]
    upcomingLessons: LessonSummary[]
    todayLessons:    LessonSummary[]
    recentLessons:   LessonSummary[]
    payments:        PaymentStatus[]
    today:           string
    studentsWithAttention: string[]
  }
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(ctx: ChatRequestBody['context']): string {
  const studentList = ctx.students.length > 0
    ? ctx.students.map((s) =>
        `  - ${s.name} (${s.instrument}${s.level ? `, ${s.level}` : ''}${s.needsAttention ? ', ⚠️ atenção' : ''})`
      ).join('\n')
    : '  (nenhum aluno cadastrado)'

  const upcomingList = ctx.upcomingLessons.slice(0, 5).length > 0
    ? ctx.upcomingLessons.slice(0, 5).map((l) =>
        `  - ${l.date} ${l.time} | ${l.studentName} | ${l.instrument} | ${l.duration}min${l.topic ? ` | tópico: ${l.topic}` : ''}`
      ).join('\n')
    : '  (nenhuma aula agendada)'

  const todayList = ctx.todayLessons.length > 0
    ? ctx.todayLessons.map((l) =>
        `  - ${l.time} | ${l.studentName} | ${l.instrument} | ${l.status}`
      ).join('\n')
    : '  (nenhuma aula hoje)'

  const paymentList = ctx.payments.filter((p) => p.status !== 'pago').length > 0
    ? ctx.payments.filter((p) => p.status !== 'pago').map((p) =>
        `  - ${p.studentName}: ${p.status}`
      ).join('\n')
    : '  (nenhum pagamento pendente)'

  return `Você é a **Musly IA**, assistente especializada em ensino musical para professores brasileiros. Você faz parte da plataforma **Musly** — um sistema de gestão de estúdio para professores de música.

## Sua personalidade
- Direto, prático e estruturado
- Especialista em pedagogia musical
- Tom profissional mas acessível
- Respostas organizadas com markdown (listas, negrito, seções)
- Sempre em português brasileiro

## Seu conhecimento especializado
- Piano, violão, violino, teoria musical, percussão e outros instrumentos
- Metodologias: Suzuki, Royal Conservatory, Berklee, Kodály
- Pedagogia para crianças, jovens e adultos
- Criação de exercícios por nível (iniciante, intermediário, avançado)
- Técnica instrumental, leitura musical, improvisação, composição
- Gestão de estúdio, finanças para professores, organização pedagógica

## Dados reais do estúdio (hoje: ${ctx.today})

**Alunos cadastrados (${ctx.students.length}):**
${studentList}

**Aulas de hoje:**
${todayList}

**Próximas aulas:**
${upcomingList}

**Pagamentos pendentes:**
${paymentList}

${ctx.studentsWithAttention.length > 0 ? `**Alunos que precisam de atenção especial:**\n${ctx.studentsWithAttention.map((n) => `  - ${n}`).join('\n')}` : ''}

## Regras de resposta
- Use os dados do estúdio sempre que relevante para personalizar a resposta
- Seja específico: mencione nomes de alunos, instrumentos, horários quando disponíveis
- Para exercícios e planos de aula: seja detalhado, com estrutura clara e timing
- Máximo 500 palavras por resposta, a não ser que seja um plano de aula completo
- Nunca invente dados que não estão no contexto acima
- Se não souber algo ou os dados não estiverem disponíveis, diga claramente`
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

  const { message, tier, context } = body
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400 })
  }

  const openai = new OpenAI({ apiKey })

  // Use gpt-4o-mini for tiers 1-2 (faster, cheaper), gpt-4o for tier 3 (complex plans)
  const model = tier === 3 ? 'gpt-4o' : 'gpt-4o-mini'

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system',    content: buildSystemPrompt(context) },
        { role: 'user',      content: message },
      ],
      max_tokens:  tier === 3 ? 1200 : 600,
      temperature: 0.7,
    })

    const text = completion.choices[0]?.message?.content ?? 'Não consegui gerar uma resposta. Tente novamente.'

    return NextResponse.json({
      text,
      model,
      usage: completion.usage,
    })
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
