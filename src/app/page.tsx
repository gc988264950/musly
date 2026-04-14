import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import MusicTeacherFigure from '@/components/landing/MusicTeacherFigure'
import FadeIn from '@/components/landing/FadeIn'
import {
  Music,
  Calendar,
  BarChart2,
  CreditCard,
  ArrowRight,
  Users,
  Zap,
  Clock,
  Brain,
  BookOpen,
  Bell,
  Pause,
  ChevronRight,
  CheckCircle2,
  Star,
  TrendingUp,
  Shield,
  Sparkles,
  DollarSign,
  Play,
} from 'lucide-react'

// ─── Brand constants ──────────────────────────────────────────────────────────

const BLUE      = '#1a7cfa'
const BLUE_DARK = '#1468d6'
const BLUE_MUTED = '#eef5ff'

// ─── Mock screen components ───────────────────────────────────────────────────

function DashboardMock() {
  return (
    <div className="rounded-xl bg-[#f8fafc] font-sans text-[11px] leading-tight overflow-hidden">
      <div className="flex items-center justify-between bg-white border-b border-gray-100 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-md bg-[#1a7cfa] flex items-center justify-center">
            <Music className="h-2.5 w-2.5 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-xs">Musly</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
            <Bell className="h-3 w-3 text-gray-400" />
          </div>
          <div className="h-6 w-6 rounded-full bg-[#1a7cfa] flex items-center justify-center text-white font-bold text-[9px]">A</div>
        </div>
      </div>
      <div className="flex">
        <div className="w-[90px] bg-white border-r border-gray-100 py-3 flex flex-col gap-0.5 px-2">
          {[
            { label: 'Painel', active: true },
            { label: 'Alunos', active: false },
            { label: 'Aulas', active: false },
            { label: 'Progresso', active: false },
            { label: 'Financeiro', active: false },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-lg px-2 py-1.5 text-[9px] font-medium ${
                item.active ? 'bg-[#eef5ff] text-[#1a7cfa]' : 'text-gray-500'
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>
        <div className="flex-1 p-3 space-y-2.5">
          <div>
            <p className="font-bold text-gray-900 text-xs">Bom dia, Ana!</p>
            <p className="text-gray-400 text-[9px]">segunda-feira, 14 de abril</p>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: 'Alunos', value: '12', color: 'bg-[#eef5ff]', tcolor: 'text-[#1a7cfa]' },
              { label: 'Aulas hoje', value: '4', color: 'bg-green-50', tcolor: 'text-green-600' },
              { label: 'Receita', value: 'R$ 2.4k', color: 'bg-blue-50', tcolor: 'text-blue-700' },
            ].map((s) => (
              <div key={s.label} className={`rounded-lg ${s.color} p-2`}>
                <p className={`font-bold ${s.tcolor} text-[11px]`}>{s.value}</p>
                <p className="text-gray-500 text-[8px]">{s.label}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Hoje</p>
            <div className="space-y-1">
              {[
                { time: '09:00', name: 'Lucas Ferreira', inst: 'Violão', color: '#1a7cfa' },
                { time: '10:00', name: 'Marina Silva', inst: 'Piano', color: '#22c55e' },
                { time: '14:00', name: 'Pedro Alves', inst: 'Bateria', color: '#f59e0b' },
              ].map((l) => (
                <div key={l.name} className="flex items-center gap-2 rounded-lg bg-white border border-gray-100 px-2 py-1.5">
                  <div className="w-1 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-[9px] truncate">{l.name}</p>
                    <p className="text-gray-400 text-[8px]">{l.inst}</p>
                  </div>
                  <span className="text-gray-500 text-[9px] font-medium flex-shrink-0">{l.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// HeroVisual is now MusicTeacherFigure (imported from components/landing)

// ─── Feature card component ───────────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  desc,
  accent = false,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  accent?: boolean
}) {
  return (
    <div className={`rounded-2xl p-6 border transition-all hover:-translate-y-1 hover:shadow-lg ${
      accent
        ? 'bg-[#1a7cfa] border-[#1468d6] text-white'
        : 'bg-white border-gray-100 text-gray-900'
    }`}>
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${
        accent ? 'bg-white/15' : 'bg-[#eef5ff]'
      }`}>
        <div className={accent ? 'text-white' : 'text-[#1a7cfa]'}>
          {icon}
        </div>
      </div>
      <h3 className={`mb-2 text-[15px] font-bold ${accent ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
      <p className={`text-[13px] leading-relaxed ${accent ? 'text-blue-100' : 'text-gray-500'}`}>{desc}</p>
    </div>
  )
}

// ─── Stat counter ─────────────────────────────────────────────────────────────

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-4xl font-black text-gray-900 tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  )
}

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({
  name,
  price,
  desc,
  features,
  highlighted,
  cta,
  href,
}: {
  name: string
  price: string
  desc: string
  features: string[]
  highlighted?: boolean
  cta: string
  href: string
}) {
  return (
    <div className={`relative flex flex-col rounded-2xl border p-8 transition-all hover:-translate-y-1 ${
      highlighted
        ? 'border-[#1a7cfa] bg-[#1a7cfa] text-white shadow-2xl shadow-blue-200'
        : 'border-gray-200 bg-white'
    }`}>
      {highlighted && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gray-900 px-4 py-1 text-xs font-bold text-white">
          Mais popular
        </span>
      )}
      <div className="mb-6">
        <p className={`text-sm font-semibold ${highlighted ? 'text-blue-100' : 'text-gray-500'}`}>{name}</p>
        <p className={`mt-1.5 text-4xl font-black tracking-tight ${highlighted ? 'text-white' : 'text-gray-900'}`}>
          {price}
        </p>
        {price !== 'Grátis' && <p className={`text-sm ${highlighted ? 'text-blue-100' : 'text-gray-400'}`}>/mês</p>}
        <p className={`mt-3 text-sm ${highlighted ? 'text-blue-100' : 'text-gray-500'}`}>{desc}</p>
      </div>
      <ul className="mb-8 space-y-3 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <CheckCircle2 className={`mt-0.5 h-4 w-4 flex-shrink-0 ${highlighted ? 'text-blue-200' : 'text-[#1a7cfa]'}`} />
            <span className={highlighted ? 'text-blue-50' : 'text-gray-600'}>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
          highlighted
            ? 'bg-white text-[#1a7cfa] hover:bg-blue-50'
            : 'border-2 border-[#1a7cfa] text-[#1a7cfa] hover:bg-[#eef5ff]'
        }`}
      >
        {cta}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

// ─── Testimonial ─────────────────────────────────────────────────────────────

function Testimonial({
  quote, name, role,
}: { quote: string; name: string; role: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6">
      <div className="mb-3 flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="text-[14px] leading-relaxed text-gray-700">&ldquo;{quote}&rdquo;</p>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef5ff] text-sm font-bold text-[#1a7cfa]">
          {name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          <p className="text-xs text-gray-400">{role}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <Navbar />

      {/* ══════════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-white pt-24 pb-8 lg:pt-28 lg:pb-12">
        {/* Background dots */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(#1a7cfa 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8 lg:items-center">

            {/* Left — copy */}
            <div className="max-w-xl">
              {/* Badge */}
              <div
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-[#eef5ff] px-4 py-1.5 animate-hero-word"
                style={{ animationDelay: '0ms' }}
              >
                <Sparkles className="h-3.5 w-3.5 text-[#1a7cfa]" />
                <span className="text-xs font-semibold text-[#1a7cfa]">IA especializada em música</span>
              </div>

              {/* Headline — word-by-word entrance */}
              <h1 className="text-5xl font-black leading-[1.08] tracking-tight text-gray-900 lg:text-[58px]">
                <span className="block animate-hero-word" style={{ animationDelay: '80ms' }}>
                  Gerencie seu
                </span>
                <span
                  className="block animate-hero-word"
                  style={{ animationDelay: '200ms', color: BLUE }}
                >
                  Estúdio Musical
                </span>
                <span className="block animate-hero-word" style={{ animationDelay: '340ms' }}>
                  com Inteligência.
                </span>
              </h1>

              <p
                className="mt-6 text-lg leading-relaxed text-gray-500 animate-hero-word"
                style={{ animationDelay: '500ms' }}
              >
                Musly é a plataforma completa para professores de música —
                alunos, aulas, finanças e IA em um só lugar. Menos burocracia,
                mais tempo para o que importa: <strong className="text-gray-700">ensinar.</strong>
              </p>

              {/* CTAs */}
              <div
                className="mt-8 flex flex-wrap items-center gap-4 animate-hero-word"
                style={{ animationDelay: '640ms' }}
              >
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-300"
                  style={{ backgroundColor: BLUE }}
                >
                  Começar grátis
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-7 py-3.5 text-sm font-bold text-gray-700 transition-all hover:border-blue-200 hover:bg-[#eef5ff] hover:text-[#1a7cfa]"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Ver como funciona
                </Link>
              </div>

              {/* Social proof micro */}
              <div
                className="mt-8 flex items-center gap-3 animate-hero-word"
                style={{ animationDelay: '760ms' }}
              >
                <div className="flex -space-x-2">
                  {['#1a7cfa', '#22c55e', '#f59e0b', '#8b5cf6'].map((c, i) => (
                    <div
                      key={i}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white"
                      style={{ backgroundColor: c }}
                    >
                      {['A', 'M', 'P', 'J'][i]}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  <span className="font-bold text-gray-900">+820 professores</span>{' '}
                  já usam a Musly
                </p>
              </div>
            </div>

            {/* Right — music teacher figure */}
            <div className="hidden lg:block">
              <MusicTeacherFigure />
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mx-auto mt-16 max-w-7xl px-6 lg:px-8">
          <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-8 py-7">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-0 md:divide-x md:divide-gray-200">
              <Stat value="820+"  label="Professores ativos" />
              <div className="md:pl-8"><Stat value="15.000+" label="Aulas gerenciadas" /></div>
              <div className="md:pl-8"><Stat value="98%"     label="Satisfação dos usuários" /></div>
              <div className="md:pl-8"><Stat value="R$0"     label="Para começar" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          TAGLINE + 3 FEATURE CARDS
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          {/* Section label */}
          <FadeIn direction="up">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold" style={{ color: BLUE }}>
              <div className="h-px w-8 bg-[#1a7cfa]" />
              Funcionalidades
            </div>
          </FadeIn>

          <FadeIn direction="up" delay={80}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between mb-14">
              <h2 className="max-w-lg text-4xl font-black tracking-tight text-gray-900 lg:text-5xl">
                Inspire seus alunos
                <br />
                <span style={{ color: BLUE }}>a Evoluir.</span>
              </h2>
              <p className="max-w-sm text-[15px] text-gray-500 leading-relaxed lg:text-right">
                Ferramentas pensadas para o dia a dia do professor — da agenda à análise de progresso com IA.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: <Users className="h-5 w-5" />,    title: 'Gestão de Alunos',    accent: false, desc: 'Perfil completo de cada aluno — instrumento, nível, repertório, progresso e anotações em um só lugar.' },
              { icon: <Brain className="h-5 w-5" />,    title: 'IA Musical',           accent: true,  desc: 'Assistente especializada em pedagogia musical. Pergunte sobre seus alunos, gere exercícios e planos de aula.' },
              { icon: <Calendar className="h-5 w-5" />, title: 'Agenda Inteligente',   accent: false, desc: 'Organize suas aulas, veja o dia de forma visual e nunca mais perca um horário com notificações automáticas.' },
              { icon: <BarChart2 className="h-5 w-5" />,title: 'Progresso & Evolução', accent: false, desc: 'Registre tags de desempenho durante as aulas e acompanhe a evolução de cada aluno com gráficos e histórico.' },
              { icon: <CreditCard className="h-5 w-5" />,title:'Financeiro Completo',   accent: false, desc: 'Controle mensalidades, registre pagamentos e acompanhe sua receita mensal sem planilhas.' },
              { icon: <BookOpen className="h-5 w-5" />, title: 'Modo de Aula',         accent: false, desc: 'Cronômetro, anotações em tempo real, materiais e tags de performance — tudo enquanto você dá aula.' },
            ].map((card, i) => (
              <FadeIn key={card.title} direction="up" delay={i * 80} duration={800}>
                <FeatureCard {...card} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SPLIT SECTION — IA para todo tipo de estúdio
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#f8fafc] py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeIn direction="up">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold" style={{ color: BLUE }}>
              <div className="h-px w-8 bg-[#1a7cfa]" />
              Potencialize o Ensino com IA
            </div>
            <h2 className="mb-16 max-w-2xl text-4xl font-black tracking-tight text-gray-900 lg:text-5xl">
              IA que entende{' '}
              <span style={{ color: BLUE }}>música</span>{' '}
              e conhece{' '}
              <span style={{ color: BLUE }}>seus alunos.</span>
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* Big card left */}
            <FadeIn direction="left" className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-8 flex flex-col justify-between min-h-[340px]">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-xl bg-purple-50 px-3 py-1.5">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <span className="text-xs font-bold text-purple-700">Musly IA</span>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">
                  Pergunte sobre qualquer aluno
                </h3>
                <p className="text-gray-500 text-[15px] leading-relaxed max-w-md">
                  &ldquo;Como tá o Pedro?&rdquo; — e a IA responde com base no histórico real
                  de aulas, últimos tópicos trabalhados e tags de performance registradas.
                </p>
              </div>
              {/* Chat preview */}
              <div className="mt-6 space-y-3">
                <div className="flex justify-end">
                  <div className="rounded-2xl rounded-tr-md bg-[#1a7cfa] px-4 py-2.5 text-sm text-white max-w-xs">
                    Como tá o Pedro com o violão?
                  </div>
                </div>
                <div className="flex gap-2 items-start">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-100">
                    <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  <div className="rounded-2xl rounded-tl-md border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 max-w-xs">
                    <strong>Pedro Alves</strong> está progredindo bem. Na última aula (10/abr) trabalhou mudança de acordes D→G — registrado com tag <em>dificuldade</em>. Antes disso, 3 aulas com tag <em>evolução</em>. Recomendado: manter foco na transição D→G.
                  </div>
                </div>
              </div>
            </div>
            </FadeIn>

            {/* Stack right */}
            <FadeIn direction="right" delay={160} className="flex flex-col gap-6">
              <div className="flex-1 rounded-2xl border border-gray-100 bg-white p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                  <Zap className="h-5 w-5 text-amber-500" />
                </div>
                <h3 className="mb-2 text-[15px] font-bold text-gray-900">Gere exercícios na hora</h3>
                <p className="text-[13px] leading-relaxed text-gray-500">
                  Peça exercícios personalizados por instrumento e nível. A IA conhece Suzuki, Berklee, Kodály e mais.
                </p>
              </div>
              <div className="flex-1 rounded-2xl border border-gray-100 bg-white p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                  <BookOpen className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="mb-2 text-[15px] font-bold text-gray-900">Planos de aula em segundos</h3>
                <p className="text-[13px] leading-relaxed text-gray-500">
                  &ldquo;Crie um plano de aula de 60 min para violão intermediário.&rdquo; Pronto.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          HORIZONTAL SPLIT — Financeiro & Agenda
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">

          {/* Row 1 */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold" style={{ color: BLUE }}>
                <div className="h-px w-8 bg-[#1a7cfa]" />
                Financeiro
              </div>
              <h2 className="text-3xl font-black tracking-tight text-gray-900 lg:text-4xl">
                Saiba exatamente
                <br />
                <span style={{ color: BLUE }}>quanto você ganha.</span>
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-gray-500">
                Cadastre as mensalidades dos seus alunos, registre pagamentos com um clique
                e visualize sua receita mensal em tempo real — sem planilha, sem papel.
              </p>
              <ul className="mt-6 space-y-2.5">
                {[
                  'Histórico completo de pagamentos',
                  'Alertas de mensalidades em atraso',
                  'Relatório de receita mensal',
                  'Exportação de dados (em breve)',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-[14px] text-gray-600">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#1a7cfa]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Finance visual */}
            <div className="rounded-2xl border border-gray-100 bg-[#f8fafc] p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900">Receita — Abril 2026</p>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">+18%</span>
              </div>
              <p className="text-4xl font-black text-gray-900 mb-1">R$ 3.200</p>
              <p className="text-sm text-gray-500 mb-5">de R$ 3.600 previstos</p>
              <div className="h-2 w-full rounded-full bg-gray-200 mb-5">
                <div className="h-2 w-[88%] rounded-full bg-[#1a7cfa]" />
              </div>
              <div className="space-y-2.5">
                {[
                  { name: 'Lucas Ferreira', value: 'R$ 280', status: 'pago' },
                  { name: 'Marina Silva',   value: 'R$ 280', status: 'pago' },
                  { name: 'Pedro Alves',    value: 'R$ 280', status: 'pendente' },
                  { name: 'Júlia Ramos',    value: 'R$ 320', status: 'pago' },
                ].map((r) => (
                  <div key={r.name} className="flex items-center justify-between rounded-xl bg-white border border-gray-100 px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eef5ff] text-[10px] font-bold text-[#1a7cfa]">
                        {r.name.charAt(0)}
                      </div>
                      <span className="text-[13px] text-gray-700">{r.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-gray-900">{r.value}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        r.status === 'pago' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>{r.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
            {/* Agenda visual */}
            <div className="order-2 lg:order-1 rounded-2xl border border-gray-100 bg-[#f8fafc] p-6">
              <p className="mb-4 text-sm font-bold text-gray-900">Agenda — Segunda-feira</p>
              <div className="space-y-2.5">
                {[
                  { time: '09:00', name: 'Lucas Ferreira',  inst: 'Violão',  dur: '45 min', color: '#1a7cfa' },
                  { time: '10:00', name: 'Marina Silva',    inst: 'Piano',   dur: '60 min', color: '#22c55e' },
                  { time: '14:00', name: 'Pedro Alves',     inst: 'Bateria', dur: '45 min', color: '#f59e0b' },
                  { time: '15:30', name: 'Júlia Ramos',     inst: 'Violino', dur: '60 min', color: '#8b5cf6' },
                  { time: '17:00', name: 'Carlos Mendes',   inst: 'Violão',  dur: '45 min', color: '#1a7cfa' },
                ].map((l) => (
                  <div
                    key={l.name}
                    className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 px-3 py-3"
                  >
                    <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
                    <div className="w-14 text-[12px] font-bold text-gray-500">{l.time}</div>
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-gray-800">{l.name}</p>
                      <p className="text-[11px] text-gray-400">{l.inst} · {l.dur}</p>
                    </div>
                    <span className="rounded-full bg-[#eef5ff] px-2.5 py-1 text-[10px] font-bold text-[#1a7cfa]">agendada</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold" style={{ color: BLUE }}>
                <div className="h-px w-8 bg-[#1a7cfa]" />
                Agenda
              </div>
              <h2 className="text-3xl font-black tracking-tight text-gray-900 lg:text-4xl">
                Sua semana toda
                <br />
                <span style={{ color: BLUE }}>organizada.</span>
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-gray-500">
                Visualize suas aulas por dia, acesse o perfil do aluno direto da agenda
                e entre no modo de aula com um clique. Simples assim.
              </p>
              <ul className="mt-6 space-y-2.5">
                {[
                  'Vista diária, semanal e mensal',
                  'Acesso rápido ao perfil do aluno',
                  'Modo de aula integrado com cronômetro',
                  'Reagendamento fácil',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-[14px] text-gray-600">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#1a7cfa]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#f8fafc] py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold" style={{ color: BLUE }}>
            <div className="h-px w-8 bg-[#1a7cfa]" />
            Depoimentos
          </div>
          <h2 className="mb-12 text-4xl font-black tracking-tight text-gray-900 lg:text-5xl">
            O que os professores{' '}
            <span style={{ color: BLUE }}>estão dizendo.</span>
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              { quote: 'Antes eu usava caderno, depois planilha, agora uso a Musly. É outra categoria. Tenho tudo do meu estúdio em um lugar só.', name: 'Ana Beatriz', role: 'Professora de Piano · São Paulo' },
              { quote: "A IA é surpreendente. Perguntei 'como tá minha aluna com teoria musical?' e ela respondeu com o histórico real das últimas aulas. Impressionante.", name: 'Rodrigo Mendes', role: 'Professor de Violão · Belo Horizonte' },
              { quote: 'Economizo 2 horas por semana em burocracia financeira. O controle de mensalidades é perfeito para quem tem mais de 10 alunos.', name: 'Fernanda Lima', role: 'Professora de Violino · Curitiba' },
            ].map((t, i) => (
              <FadeIn key={t.name} direction="up" delay={i * 100} duration={800}>
                <Testimonial {...t} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="plans" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold" style={{ color: BLUE }}>
            <div className="h-px w-8 bg-[#1a7cfa]" />
            Planos
          </div>
          <div className="mb-14 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="text-4xl font-black tracking-tight text-gray-900 lg:text-5xl">
              Tarifas pensadas{' '}
              <span style={{ color: BLUE }}>para professores.</span>
            </h2>
            <p className="max-w-xs text-[15px] text-gray-500">
              Comece grátis, sem cartão. Faça upgrade quando quiser crescer.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FadeIn direction="up" delay={0} duration={800}><PlanCard
              name="Grátis"
              price="Grátis"
              desc="Para professores que estão começando."
              features={['Até 3 alunos','Até 5 aulas por mês','10 créditos de IA / mês','Histórico de aulas','Anotações por aluno']}
              cta="Começar grátis"
              href="/register"
            /></FadeIn>
            <FadeIn direction="up" delay={120} duration={800}><PlanCard
              name="Pro"
              price="R$ 49,90"
              desc="Para professores ativos com muitos alunos."
              features={['Até 10 alunos','Aulas ilimitadas','100 créditos de IA / mês','Perfil pedagógico completo','Financeiro com histórico','Progresso e repertório por aluno']}
              highlighted
              cta="Assinar Pro"
              href="/register?plan=pro"
            /></FadeIn>
            <FadeIn direction="up" delay={240} duration={800}><PlanCard
              name="Studio"
              price="R$ 99,90"
              desc="Para escolas e professores com múltiplas turmas."
              features={['Alunos ilimitados','Aulas ilimitadas','300 créditos de IA / mês','IA avançada (GPT-4o)','Múltiplos professores (em breve)','Suporte prioritário']}
              cta="Assinar Studio"
              href="/register?plan=studio"
            /></FadeIn>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div
            className="relative overflow-hidden rounded-3xl px-8 py-16 text-center lg:px-16"
            style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)` }}
          >
            {/* Background pattern */}
            <div
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
            <div className="relative">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-200">
                Comece hoje mesmo
              </p>
              <h2 className="mb-4 text-4xl font-black text-white lg:text-5xl">
                Seu estúdio merece uma
                <br />
                ferramenta à altura.
              </h2>
              <p className="mx-auto mb-8 max-w-lg text-lg text-blue-100">
                Junte-se a mais de 820 professores que já usam a Musly para
                organizar, ensinar melhor e crescer.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-bold text-[#1a7cfa] shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Criar conta grátis
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-4 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  Já tenho conta →
                </Link>
              </div>
              <p className="mt-6 text-xs text-blue-200">
                Sem cartão de crédito · Plano gratuito para sempre · Cancele quando quiser
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />

    </div>
  )
}
