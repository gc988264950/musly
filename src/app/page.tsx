import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import FAQSection from '@/components/landing/FAQSection'
import FadeIn from '@/components/landing/FadeIn'
import {
  Music, Calendar, BarChart2, CreditCard, ArrowRight,
  Users, Zap, Clock, Brain, BookOpen, Bell,
  Sparkles, TrendingUp, CheckCircle2, Star, Pause,
  ChevronRight, Shield, DollarSign,
} from 'lucide-react'

// ─── App mockup (dark premium style) ─────────────────────────────────────────

function AppMock() {
  return (
    <div className="overflow-hidden rounded-2xl bg-[#0d1117] ring-1 ring-white/10 text-[11px] leading-tight font-sans">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 bg-[#161b22] px-4 py-3 border-b border-white/5">
        <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <div className="mx-3 flex-1 rounded-md bg-white/5 px-3 py-1 text-[9px] text-white/30">
          app.musly.com.br
        </div>
      </div>
      {/* App shell */}
      <div className="flex h-[340px]">
        {/* Sidebar */}
        <div className="w-[110px] border-r border-white/5 bg-[#0d1117] py-3 px-2 flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 px-2 pb-3 mb-1 border-b border-white/5">
            <div className="h-5 w-5 rounded-md bg-[#1a7cfa] flex items-center justify-center">
              <Music className="h-2.5 w-2.5 text-white" />
            </div>
            <span className="font-black text-white text-[10px]">Musly</span>
          </div>
          {[
            { label: 'Painel',     active: true },
            { label: 'Alunos',    active: false },
            { label: 'Agenda',    active: false },
            { label: 'Progresso', active: false },
            { label: 'Financeiro',active: false },
            { label: 'IA',        active: false },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-lg px-2 py-1.5 text-[9px] font-medium ${
                item.active
                  ? 'bg-[#1a7cfa]/15 text-[#60a5fa]'
                  : 'text-white/30 hover:text-white/60'
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-black text-white text-xs">Bom dia, Ana! 👋</p>
              <p className="text-white/30 text-[9px]">segunda-feira, 14 de abril</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="rounded-lg bg-white/5 px-2 py-1 text-[9px] text-white/40 border border-white/5">
                Abr 2026
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Alunos',     value: '12',     sub: '+2 esse mês', color: 'text-[#60a5fa]',  bg: 'bg-[#1a7cfa]/10' },
              { label: 'Aulas hoje', value: '4',      sub: 'Próxima: 09h', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Receita',    value: 'R$3.2k', sub: '+18% mês ant.', color: 'text-violet-400', bg: 'bg-violet-500/10' },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl ${s.bg} border border-white/5 p-2.5`}>
                <p className={`font-black text-sm ${s.color}`}>{s.value}</p>
                <p className="text-white/30 text-[8px]">{s.label}</p>
                <p className="text-white/20 text-[7px] mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Today's schedule */}
          <div>
            <p className="text-[8px] font-bold uppercase tracking-widest text-white/25 mb-1.5">Hoje</p>
            <div className="space-y-1.5">
              {[
                { time: '09:00', name: 'Lucas Ferreira', inst: 'Violão',  color: '#1a7cfa' },
                { time: '10:30', name: 'Marina Silva',   inst: 'Piano',   color: '#22c55e' },
                { time: '14:00', name: 'Pedro Alves',    inst: 'Bateria', color: '#a78bfa' },
              ].map((l) => (
                <div key={l.name} className="flex items-center gap-2 rounded-lg bg-white/[0.03] border border-white/[0.06] px-2.5 py-2">
                  <div className="w-0.5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white/80 text-[9px] truncate">{l.name}</p>
                    <p className="text-white/30 text-[8px]">{l.inst}</p>
                  </div>
                  <span className="text-white/40 text-[9px] font-mono flex-shrink-0">{l.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI insight chip */}
          <div className="flex items-center gap-2 rounded-xl bg-[#1a7cfa]/10 border border-[#1a7cfa]/20 px-3 py-2">
            <Sparkles className="h-3 w-3 text-[#60a5fa] flex-shrink-0" />
            <p className="text-[9px] text-[#93c5fd]">
              <strong className="text-[#60a5fa]">IA:</strong> Pedro precisa de atenção na transição D→G
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Stat item ─────────────────────────────────────────────────────────────

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center sm:text-left">
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="text-sm text-white/40">{label}</p>
    </div>
  )
}

// ─── Benefit card (numbered, PayEvo style) ────────────────────────────────

function BenefitCard({
  num, icon, title, desc,
}: {
  num: string
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-all duration-300 hover:border-[#1a7cfa]/30 hover:bg-[#1a7cfa]/[0.04]">
      {/* Number watermark */}
      <span className="absolute -right-1 -top-4 text-[72px] font-black leading-none text-white/[0.04] select-none group-hover:text-[#1a7cfa]/10 transition-colors">
        {num}
      </span>
      {/* Icon */}
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/60 group-hover:bg-[#1a7cfa]/15 group-hover:text-[#60a5fa] transition-colors">
        {icon}
      </div>
      <h3 className="mb-2 text-[15px] font-bold text-white">{title}</h3>
      <p className="text-[13px] leading-relaxed text-white/40">{desc}</p>
    </div>
  )
}

// ─── Plan card ────────────────────────────────────────────────────────────

function PlanCard({
  name, price, desc, features, highlighted, href,
}: {
  name: string
  price: string
  desc: string
  features: string[]
  highlighted?: boolean
  href: string
}) {
  return (
    <div className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-300 ${
      highlighted
        ? 'border-[#1a7cfa]/50 bg-[#1a7cfa]/[0.06] shadow-[0_0_50px_rgba(26,124,250,0.15)]'
        : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12]'
    }`}>
      {highlighted && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#1a7cfa] px-4 py-1 text-[11px] font-bold text-white shadow-lg shadow-blue-500/25">
          Mais popular
        </span>
      )}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-white/30">{name}</p>
        <div className="mt-2 flex items-end gap-1">
          <p className="text-4xl font-black text-white">{price}</p>
          {price !== 'Grátis' && <p className="mb-1 text-sm text-white/30">/mês</p>}
        </div>
        <p className="mt-2 text-[13px] text-white/40">{desc}</p>
      </div>
      <ul className="mb-8 flex-1 space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-[13px]">
            <CheckCircle2 className={`mt-0.5 h-4 w-4 flex-shrink-0 ${highlighted ? 'text-[#60a5fa]' : 'text-white/30'}`} />
            <span className="text-white/60">{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
          highlighted
            ? 'bg-[#1a7cfa] text-white hover:bg-[#1468d6] shadow-lg shadow-blue-500/25'
            : 'border border-white/10 text-white/70 hover:border-white/20 hover:text-white'
        }`}
      >
        {price === 'Grátis' ? 'Criar conta grátis' : `Assinar ${name}`}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

// ─── Testimonial ─────────────────────────────────────────────────────────

function Testimonial({ quote, name, role, highlight }: {
  quote: string; name: string; role: string; highlight?: string
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
      {highlight && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#1a7cfa]/10 border border-[#1a7cfa]/20 px-3 py-1">
          <TrendingUp className="h-3 w-3 text-[#60a5fa]" />
          <span className="text-[11px] font-bold text-[#60a5fa]">{highlight}</span>
        </div>
      )}
      <div className="mb-3 flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-[#1a7cfa] text-[#1a7cfa]" />
        ))}
      </div>
      <p className="text-[14px] leading-relaxed text-white/60">&ldquo;{quote}&rdquo;</p>
      <div className="mt-5 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a7cfa]/20 text-xs font-bold text-[#60a5fa]">
          {name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="text-xs text-white/30">{role}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Marquee items ────────────────────────────────────────────────────────

const MARQUEE_ITEMS = [
  { label: '820+ Professores' },
  { label: '15.000+ Aulas Gerenciadas' },
  { label: '98% de Satisfação' },
  { label: 'IA Especializada em Música' },
  { label: 'Plano Gratuito Para Sempre' },
  { label: 'Suporte em Português' },
  { label: '820+ Professores' },
  { label: '15.000+ Aulas Gerenciadas' },
  { label: '98% de Satisfação' },
  { label: 'IA Especializada em Música' },
  { label: 'Plano Gratuito Para Sempre' },
  { label: 'Suporte em Português' },
]

// ─── Page ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black font-sans antialiased">
      <Navbar />

      {/* ══════════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-black pb-0 pt-20 lg:pt-24">

        {/* Background radial glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[900px] opacity-20"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, #1a7cfa 0%, transparent 65%)' }}
        />

        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center lg:gap-10">

            {/* Left — copy */}
            <div>
              {/* Badge */}
              <div
                className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#1a7cfa]/25 bg-[#1a7cfa]/10 px-4 py-1.5 animate-hero-word"
                style={{ animationDelay: '0ms' }}
              >
                <div className="h-1.5 w-1.5 rounded-full bg-[#1a7cfa] animate-pulse" />
                <span className="text-xs font-semibold text-[#60a5fa]">Plataforma para professores de música</span>
              </div>

              {/* Headline */}
              <h1 className="text-[52px] font-black leading-[1.04] tracking-tight text-white lg:text-[68px]">
                <span className="block animate-hero-word" style={{ animationDelay: '80ms' }}>
                  Tecnologia, IA
                </span>
                <span className="block animate-hero-word" style={{ animationDelay: '200ms' }}>
                  e controle para
                </span>
                <span
                  className="block animate-hero-word"
                  style={{ animationDelay: '320ms', color: '#1a7cfa' }}
                >
                  escalar seu estúdio.
                </span>
              </h1>

              <p
                className="mt-6 text-lg leading-relaxed text-white/50 animate-hero-word"
                style={{ animationDelay: '460ms' }}
              >
                Gerencie alunos, agenda, finanças e tenha uma IA especializada em
                pedagogia musical trabalhando por você — tudo em um só lugar.
              </p>

              {/* CTAs */}
              <div
                className="mt-8 flex flex-wrap gap-3 animate-hero-word"
                style={{ animationDelay: '580ms' }}
              >
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1a7cfa] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:bg-[#1468d6] hover:shadow-blue-500/40"
                >
                  Criar conta grátis
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-7 py-3.5 text-sm font-bold text-white/70 transition-all hover:border-white/20 hover:text-white"
                >
                  Ver funcionalidades
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Stats row */}
              <div
                className="mt-10 flex flex-wrap gap-8 border-t border-white/[0.06] pt-8 animate-hero-word"
                style={{ animationDelay: '700ms' }}
              >
                <HeroStat value="820+"    label="Professores ativos" />
                <HeroStat value="15k+"    label="Aulas gerenciadas" />
                <HeroStat value="R$0"     label="Para começar" />
              </div>
            </div>

            {/* Right — app mockup */}
            <div
              className="relative animate-hero-word"
              style={{ animationDelay: '300ms' }}
            >
              {/* Glow behind mockup */}
              <div
                className="absolute inset-0 -z-10 rounded-3xl opacity-40 blur-3xl"
                style={{ background: 'radial-gradient(ellipse, #1a7cfa 0%, transparent 65%)' }}
              />
              {/* Mockup */}
              <div className="relative rounded-2xl p-px"
                style={{ background: 'linear-gradient(135deg, rgba(26,124,250,0.4) 0%, rgba(255,255,255,0.05) 60%, transparent 100%)' }}>
                <AppMock />
              </div>

              {/* Floating chip — AI */}
              <div className="absolute -left-8 top-12 hidden xl:flex items-center gap-2 rounded-2xl border border-[#1a7cfa]/20 bg-black/80 px-4 py-3 backdrop-blur-sm animate-float-slow">
                <Sparkles className="h-4 w-4 text-[#60a5fa]" />
                <div>
                  <p className="text-[11px] font-bold text-white">IA ativa</p>
                  <p className="text-[9px] text-white/40">Analisando seu estúdio</p>
                </div>
              </div>

              {/* Floating chip — receita */}
              <div className="absolute -right-6 bottom-16 hidden xl:flex items-center gap-2 rounded-2xl border border-white/10 bg-black/80 px-4 py-3 backdrop-blur-sm animate-float">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-[11px] font-bold text-white">R$ 3.200</p>
                  <p className="text-[9px] text-white/40">Receita este mês</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade to marquee */}
        <div className="mt-20 h-px bg-white/[0.06]" />
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          MARQUEE STRIP
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="overflow-hidden bg-black py-5 border-b border-white/[0.06]">
        <div className="flex animate-marquee whitespace-nowrap">
          {MARQUEE_ITEMS.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-4 px-8 text-[13px] font-semibold text-white/30">
              <span className="h-1 w-1 rounded-full bg-[#1a7cfa] flex-shrink-0" />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          BENEFITS GRID (numbered cards — PayEvo style)
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="bg-black py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          <FadeIn direction="up">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#1a7cfa]">Funcionalidades</p>
            <div className="mb-16 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <h2 className="text-4xl font-black leading-tight text-white lg:text-[52px]">
                Tudo que você precisa<br />
                <span className="text-white/30">para crescer.</span>
              </h2>
              <p className="max-w-sm text-[15px] text-white/40 lg:text-right">
                Do controle de alunos à IA especializada em pedagogia musical.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { num: '01', icon: <Brain className="h-5 w-5" />,    title: 'IA Musical Especializada',    desc: 'Pergunte sobre seus alunos em linguagem natural. A IA analisa o histórico real e sugere exercícios e planos de aula.' },
              { num: '02', icon: <Users className="h-5 w-5" />,    title: 'Gestão de Alunos',            desc: 'Perfil completo: instrumento, nível, repertório, progresso e anotações. Tudo do aluno em uma tela.' },
              { num: '03', icon: <Calendar className="h-5 w-5" />, title: 'Agenda Inteligente',          desc: 'Organize sua semana, veja as aulas do dia e entre no modo de aula com um clique. Notificações automáticas.' },
              { num: '04', icon: <BarChart2 className="h-5 w-5" />,title: 'Progresso e Evolução',        desc: 'Registre tags de desempenho durante as aulas e acompanhe a evolução de cada aluno com histórico completo.' },
              { num: '05', icon: <CreditCard className="h-5 w-5" />,title:'Financeiro em Tempo Real',    desc: 'Controle mensalidades, registre pagamentos com um clique e veja sua receita mensal. Sem planilha.' },
              { num: '06', icon: <Clock className="h-5 w-5" />,    title: 'Modo de Aula',               desc: 'Cronômetro, anotações em tempo real, materiais e tags de performance — tudo enquanto a aula acontece.' },
            ].map((card, i) => (
              <FadeIn key={card.num} direction="up" delay={i * 70} duration={750}>
                <BenefitCard {...card} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          IA FEATURE SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="ia" className="bg-[#050505] py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">

            {/* Left — chat preview */}
            <FadeIn direction="left">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                {/* Chat header */}
                <div className="flex items-center gap-3 border-b border-white/[0.06] bg-white/[0.02] px-5 py-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1a7cfa]/20">
                    <Sparkles className="h-4 w-4 text-[#60a5fa]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Musly IA</p>
                    <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                      online · acesso ao seu estúdio
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="space-y-4 p-5">
                  {/* User */}
                  <div className="flex justify-end">
                    <div className="rounded-2xl rounded-tr-md bg-[#1a7cfa] px-4 py-2.5 text-sm text-white max-w-xs">
                      Como tá o Pedro com o violão?
                    </div>
                  </div>

                  {/* AI */}
                  <div className="flex gap-2.5 items-start">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#1a7cfa]/15">
                      <Sparkles className="h-3.5 w-3.5 text-[#60a5fa]" />
                    </div>
                    <div className="rounded-2xl rounded-tl-md border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-[13px] text-white/70 max-w-sm leading-relaxed">
                      <strong className="text-white">Pedro Alves</strong> está progredindo bem.
                      Na última aula (10/abr) trabalhou transição D→G — tag <span className="text-amber-400">dificuldade</span>.
                      Nas 3 aulas anteriores, tag <span className="text-emerald-400">evolução</span>.
                      <br /><br />
                      Recomendação: manter foco na transição D→G com metrônomo ♩=60.
                    </div>
                  </div>

                  {/* User */}
                  <div className="flex justify-end">
                    <div className="rounded-2xl rounded-tr-md bg-[#1a7cfa] px-4 py-2.5 text-sm text-white max-w-xs">
                      Gera um exercício para ele
                    </div>
                  </div>

                  {/* AI typing */}
                  <div className="flex gap-2.5 items-start">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#1a7cfa]/15">
                      <Sparkles className="h-3.5 w-3.5 text-[#60a5fa]" />
                    </div>
                    <div className="rounded-2xl rounded-tl-md border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#60a5fa] animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#60a5fa] animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#60a5fa] animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Right — copy */}
            <FadeIn direction="right" delay={120}>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#1a7cfa]">IA Musical</p>
              <h2 className="mb-6 text-4xl font-black leading-tight text-white lg:text-[46px]">
                A IA que conhece<br />
                <span className="text-white/30">cada aluno seu.</span>
              </h2>
              <p className="mb-8 text-[15px] leading-relaxed text-white/50">
                A Musly IA tem acesso ao histórico real do seu estúdio. Pergunte
                em português sobre qualquer aluno, peça exercícios personalizados
                ou gere planos de aula completos em segundos.
              </p>
              <ul className="space-y-4">
                {[
                  { icon: <Brain className="h-4 w-4" />,   label: 'Contexto real de cada aluno',           sub: 'Aulas, tópicos, tags de desempenho' },
                  { icon: <BookOpen className="h-4 w-4" />, label: 'Exercícios personalizados por nível',   sub: 'Suzuki, Berklee, Kodály e mais' },
                  { icon: <Sparkles className="h-4 w-4" />, label: 'Planos de aula em segundos',            sub: 'Estruturados com timing e objetivos' },
                  { icon: <Zap className="h-4 w-4" />,      label: '1 crédito por mensagem',               sub: 'Simples, transparente, sem surpresas' },
                ].map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-[#1a7cfa]/10 text-[#60a5fa]">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-white">{item.label}</p>
                      <p className="text-[12px] text-white/35">{item.sub}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="bg-black py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          <FadeIn direction="up">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#1a7cfa]">Planos</p>
            <div className="mb-16 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <h2 className="text-4xl font-black leading-tight text-white lg:text-[52px]">
                Tarifas pensadas<br />
                <span className="text-white/30">para professores.</span>
              </h2>
              <p className="max-w-xs text-[15px] text-white/40">
                Comece grátis, sem cartão. Faça upgrade quando crescer.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <FadeIn direction="up" delay={0}  duration={800}>
              <PlanCard
                name="Grátis"
                price="Grátis"
                desc="Para professores que estão começando."
                features={['Até 3 alunos', 'Até 5 aulas por mês', '10 créditos de IA / mês', 'Histórico de aulas', 'Anotações por aluno']}
                href="/register"
              />
            </FadeIn>
            <FadeIn direction="up" delay={110} duration={800}>
              <PlanCard
                name="Pro"
                price="R$ 49,90"
                desc="Para professores ativos com muitos alunos."
                features={['Até 10 alunos', 'Aulas ilimitadas', '100 créditos de IA / mês', 'Perfil pedagógico completo', 'Financeiro com histórico', 'Progresso por aluno']}
                highlighted
                href="/register?plan=pro"
              />
            </FadeIn>
            <FadeIn direction="up" delay={220} duration={800}>
              <PlanCard
                name="Studio"
                price="R$ 99,90"
                desc="Para escolas e professores com múltiplas turmas."
                features={['Alunos ilimitados', 'Aulas ilimitadas', '300 créditos de IA / mês', 'IA avançada', 'Multi-professores (em breve)', 'Suporte prioritário']}
                href="/register?plan=studio"
              />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#050505] py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          <FadeIn direction="up">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#1a7cfa]">Depoimentos</p>
            <h2 className="mb-16 text-4xl font-black leading-tight text-white lg:text-[52px]">
              Professores que<br />
              <span className="text-white/30">transformaram seu estúdio.</span>
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              { quote: 'Antes eu usava caderno, depois planilha, agora uso a Musly. É outra categoria. Tenho tudo do meu estúdio em um lugar só.', name: 'Ana Beatriz', role: 'Professora de Piano · São Paulo', highlight: '12 alunos gerenciados' },
              { quote: "A IA é surpreendente. Perguntei 'como tá minha aluna?' e ela respondeu com o histórico real das últimas aulas. Isso não existia antes.", name: 'Rodrigo Mendes', role: 'Professor de Violão · BH', highlight: 'IA economiza 3h/semana' },
              { quote: 'Economizo 2 horas por semana em burocracia financeira. O controle de mensalidades é perfeito para quem tem mais de 10 alunos.', name: 'Fernanda Lima', role: 'Professora de Violino · Curitiba', highlight: '+R$1.200/mês organizados' },
            ].map((t, i) => (
              <FadeIn key={t.name} direction="up" delay={i * 90} duration={800}>
                <Testimonial {...t} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════════════════════ */}
      <FAQSection />

      {/* ══════════════════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-black py-28">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">

          {/* Glow */}
          <div
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 h-[400px] w-[600px] opacity-15 blur-3xl"
            style={{ background: 'radial-gradient(ellipse, #1a7cfa 0%, transparent 65%)' }}
          />

          <FadeIn direction="up">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#1a7cfa]">
              Comece hoje mesmo
            </p>
            <h2 className="mb-6 text-5xl font-black leading-tight text-white lg:text-[64px]">
              Seu estúdio merece<br />
              uma ferramenta à altura.
            </h2>
            <p className="mx-auto mb-10 max-w-lg text-lg text-white/40">
              Junte-se a mais de 820 professores que já usam a Musly para
              organizar, ensinar melhor e crescer.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1a7cfa] px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:bg-[#1468d6]"
              >
                Criar conta grátis
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-8 py-4 text-base font-bold text-white/60 transition-all hover:border-white/20 hover:text-white"
              >
                Já tenho conta →
              </Link>
            </div>
            <p className="mt-6 text-sm text-white/20">
              Sem cartão de crédito · Plano gratuito para sempre · Cancele quando quiser
            </p>
          </FadeIn>
        </div>
      </section>

      <Footer />
    </div>
  )
}
