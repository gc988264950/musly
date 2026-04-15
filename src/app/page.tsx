import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import FAQSection from '@/components/landing/FAQSection'
import FadeIn from '@/components/landing/FadeIn'
import MuslyEcosystem from '@/components/ui/musly-ecosystem'
import {
  Music, Calendar, BarChart2, CreditCard, ArrowRight,
  Users, Zap, BookOpen, Bell, Sparkles, Star,
  CheckCircle2, FileText, Clock, Brain, ChevronRight,
  LayoutDashboard, GraduationCap, DollarSign, MessageSquare,
  Play, Check,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: Calendar,       title: 'Agenda Inteligente',     desc: 'Visualize e gerencie toda a sua semana de aulas em uma interface limpa e intuitiva.' },
  { icon: Users,          title: 'Gestão de Alunos',       desc: 'Perfil completo de cada aluno: histórico, progresso, notas e muito mais.' },
  { icon: BookOpen,       title: 'Materiais e PDFs',       desc: 'Envie partituras, exercícios e conteúdos diretamente para o portal do aluno.' },
  { icon: DollarSign,     title: 'Controle Financeiro',    desc: 'Mensalidades, pagamentos e relatórios de receita — tudo automatizado.' },
  { icon: GraduationCap,  title: 'Portal do Aluno',        desc: 'Seu aluno acessa progresso, materiais e tarefas por um portal exclusivo.' },
  { icon: Brain,          title: 'Assistente IA Musical',  desc: 'IA especializada que conhece seus alunos e ajuda a planejar aulas melhores.' },
]

const INTEGRATIONS = [
  { label: 'Agenda de Aulas',  icon: Calendar,        color: 'bg-blue-50 text-brand-500 border-blue-100'    },
  { label: 'Portal do Aluno',  icon: GraduationCap,   color: 'bg-violet-50 text-violet-600 border-violet-100' },
  { label: 'PDF & Materiais',  icon: FileText,        color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { label: 'Planejamento',     icon: BookOpen,        color: 'bg-amber-50 text-amber-600 border-amber-100'   },
  { label: 'Controle Financeiro', icon: DollarSign,   color: 'bg-rose-50 text-rose-600 border-rose-100'     },
  { label: 'Assistente IA',    icon: Brain,           color: 'bg-indigo-50 text-indigo-600 border-indigo-100'},
  { label: 'Notificações',     icon: Bell,            color: 'bg-orange-50 text-orange-600 border-orange-100'},
  { label: 'Modo Aula',        icon: Play,            color: 'bg-teal-50 text-teal-600 border-teal-100'     },
  { label: 'Relatórios',       icon: BarChart2,       color: 'bg-sky-50 text-sky-600 border-sky-100'        },
]

const PLANS = [
  {
    name: 'Grátis',
    price: 'R$ 0',
    period: '/mês',
    desc: 'Para começar sem compromisso.',
    cta: 'Criar conta grátis',
    highlight: false,
    features: [
      'Até 3 alunos',
      '5 aulas por mês',
      'Agenda básica',
      'Portal do aluno',
      '10 créditos de IA',
    ],
  },
  {
    name: 'Pro',
    price: 'R$ 49',
    period: '/mês',
    desc: 'Para o professor que quer crescer.',
    cta: 'Assinar Pro',
    highlight: true,
    badge: 'Mais popular',
    features: [
      'Até 30 alunos',
      'Aulas ilimitadas',
      'Agenda completa',
      'Controle financeiro',
      'Portal do aluno completo',
      'PDF & materiais',
      '100 créditos de IA/mês',
    ],
  },
  {
    name: 'Studio',
    price: 'R$ 99',
    period: '/mês',
    desc: 'Para escolas e estúdios completos.',
    cta: 'Assinar Studio',
    highlight: false,
    features: [
      'Alunos ilimitados',
      'Aulas ilimitadas',
      'Todos os recursos Pro',
      'Múltiplos professores (em breve)',
      'Suporte prioritário',
      '200 créditos de IA/mês',
    ],
  },
]

const TESTIMONIALS = [
  {
    name: 'Ana Paula Ferreira',
    role: 'Professora de Piano',
    text: 'O Musly mudou completamente minha rotina. Antes eu usava 3 planilhas diferentes. Agora tudo está em um só lugar e eu recuperei horas da minha semana.',
    stars: 5,
  },
  {
    name: 'Carlos Mendes',
    role: 'Professor de Violão',
    text: 'A IA é incrível. Pergunto "como tá o João?" e ela me dá um resumo completo das últimas aulas com sugestões práticas. Parece que tem uma assistente ao lado.',
    stars: 5,
  },
  {
    name: 'Lucia Ferreira',
    role: 'Diretora — Escola Harmonia',
    text: 'Implementamos o Musly para toda a equipe de professores. A visibilidade do financeiro e o acompanhamento dos alunos são excelentes. Recomendo para qualquer escola.',
    stars: 5,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Inline mockups for alternating feature sections
// ─────────────────────────────────────────────────────────────────────────────

function AgendaMockup() {
  const slots = [
    { time: '14:00', lessons: [{ name: 'Pedro', color: 'bg-blue-100 text-blue-700 border-blue-200' }, null, { name: 'Ana', color: 'bg-violet-100 text-violet-700 border-violet-200' }, null, null] },
    { time: '15:30', lessons: [null, { name: 'Maria', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }, null, { name: 'João', color: 'bg-amber-100 text-amber-700 border-amber-200' }, null] },
    { time: '17:00', lessons: [{ name: 'Lucas', color: 'bg-rose-100 text-rose-700 border-rose-200' }, null, null, null, { name: 'Sofia', color: 'bg-teal-100 text-teal-700 border-teal-200' }] },
    { time: '18:30', lessons: [null, { name: 'Pedro', color: 'bg-blue-100 text-blue-700 border-blue-200' }, null, null, null] },
  ]
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-card-hover overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <p className="font-bold text-sm text-[#0f172a]">Agenda</p>
          <p className="text-xs text-slate-400">Semana de 14 a 18 abr</p>
        </div>
        <div className="flex gap-1">
          <button className="text-[11px] bg-brand-500 text-white px-3 py-1 rounded-lg font-medium">Semana</button>
          <button className="text-[11px] text-slate-400 px-3 py-1 rounded-lg hover:bg-gray-50">Mês</button>
        </div>
      </div>
      <div className="px-5 pt-3 pb-4">
        <div className="grid gap-0.5" style={{ gridTemplateColumns: '40px repeat(5, 1fr)' }}>
          <div />
          {days.map(d => <div key={d} className="text-center text-[10px] font-semibold text-slate-400 pb-2">{d}</div>)}
          {slots.map((row) => (
            <>
              <div key={row.time + '-t'} className="text-[9px] text-slate-400 pt-1 leading-none">{row.time}</div>
              {row.lessons.map((lesson, i) => (
                <div key={i} className="px-0.5 pb-1">
                  {lesson ? (
                    <div className={`rounded-lg border px-1.5 py-1.5 text-[10px] font-semibold text-center ${lesson.color}`}>
                      {lesson.name}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-gray-50 h-8" />
                  )}
                </div>
              ))}
            </>
          ))}
        </div>
      </div>
    </div>
  )
}

function StudentPortalMockup() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-card-hover overflow-hidden">
      <div className="bg-gradient-to-r from-brand-500 to-blue-400 px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <span className="text-lg font-black text-white">P</span>
          </div>
          <div>
            <p className="font-bold text-white text-sm">Pedro Alves</p>
            <p className="text-blue-100 text-xs">Violão · 8 meses de estudo</p>
          </div>
          <span className="ml-auto text-xs bg-white/20 text-white rounded-full px-2 py-0.5 font-medium">Ativo</span>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-blue-100 mb-1.5">
            <span>Progresso geral</span>
            <span className="font-bold text-white">74%</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full">
            <div className="h-full bg-white rounded-full" style={{ width: '74%' }} />
          </div>
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Última aula', value: '10 abr' },
            { label: 'Próxima',     value: '14 abr' },
            { label: 'Aulas total', value: '32'     },
          ].map(s => (
            <div key={s.label} className="text-center bg-gray-50 rounded-xl p-3">
              <p className="font-bold text-sm text-[#0f172a]">{s.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs font-bold text-[#0f172a] mb-2">Atividades recentes</p>
        {[
          { icon: '📝', text: 'Aula: Pestana Bm',           date: '10 abr', color: 'text-blue-500 bg-blue-50' },
          { icon: '📄', text: 'Material: Escala pentatônica', date: '08 abr', color: 'text-violet-500 bg-violet-50' },
          { icon: '✅', text: 'Tarefa concluída',             date: '06 abr', color: 'text-emerald-500 bg-emerald-50' },
        ].map((a, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
            <span className={`text-sm rounded-lg p-1.5 ${a.color}`}>{a.icon}</span>
            <span className="flex-1 text-xs text-slate-600">{a.text}</span>
            <span className="text-[10px] text-slate-400">{a.date}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FinanceMockup() {
  const bars = [40, 60, 45, 75, 58, 80, 92]
  const months = ['Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr']
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-card-hover overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <p className="font-bold text-sm text-[#0f172a]">Receita Mensal</p>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+18% ↑</span>
        </div>
        <p className="text-3xl font-black text-[#0f172a]">R$ 3.240</p>
        <p className="text-xs text-slate-400 mt-0.5">Abril 2026 · 12 alunos ativos</p>
      </div>
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-end gap-1.5 h-20 mb-1">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className={`w-full rounded-t-md transition-all ${i === bars.length - 1 ? 'bg-brand-500' : 'bg-gray-100'}`}
                style={{ height: `${h}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-1.5">
          {months.map(m => (
            <div key={m} className="flex-1 text-center text-[9px] text-slate-400">{m}</div>
          ))}
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="space-y-2 mt-2">
          {[
            { name: 'Pedro Alves',   status: 'Pago',    date: '01 abr', cls: 'text-emerald-600 bg-emerald-50' },
            { name: 'Maria Santos',  status: 'Pago',    date: '03 abr', cls: 'text-emerald-600 bg-emerald-50' },
            { name: 'Carlos Lima',   status: 'Pendente',date: '10 abr', cls: 'text-amber-600 bg-amber-50'     },
          ].map((p, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-xs font-semibold text-[#0f172a]">{p.name}</p>
                <p className="text-[10px] text-slate-400">{p.date}</p>
              </div>
              <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${p.cls}`}>{p.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LessonModeMockup() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-card-hover overflow-hidden">
      <div className="bg-[#0f172a] px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-brand-500 flex items-center justify-center">
            <Play className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Modo Aula</p>
            <p className="text-[10px] text-white/40">Pedro Alves · Violão</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-400 font-medium">Ao vivo</span>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-[#0f172a]">Plano da Aula</p>
          <span className="text-[10px] text-slate-400">14 abr · 14:00</span>
        </div>
        <div className="space-y-2 mb-4">
          {[
            { text: 'Aquecimento: escalas de Lá menor',    done: true  },
            { text: 'Exercício de força para pestana',     done: true  },
            { text: 'Revisão do acorde Bm',                done: false },
            { text: 'Nothing Else Matters — intro',        done: false },
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 ${item.done ? 'bg-emerald-50 border border-emerald-100' : 'bg-gray-50 border border-gray-100'}`}>
              <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${item.done ? 'bg-emerald-500' : 'border-2 border-gray-200'}`}>
                {item.done && <Check className="h-2.5 w-2.5 text-white" />}
              </div>
              <span className={`text-xs ${item.done ? 'text-emerald-700 line-through' : 'text-[#0f172a]'}`}>{item.text}</span>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
          <Zap className="h-3.5 w-3.5 text-brand-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-brand-600 leading-relaxed">
            <span className="font-semibold">Sugestão IA:</span> Pedro tem dificuldade na pressão dos dedos. Recomendo 10 min adicionais no exercício de força antes de avançar.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      <Navbar />
      <main>

        {/* ── 1. HERO ────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-white pt-20 pb-28 lg:pt-28 lg:pb-36">

          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-40 right-0 h-[700px] w-[700px] rounded-full bg-brand-500/[0.05] blur-[100px]" />
            <div className="absolute top-20 right-1/4 h-[400px] w-[400px] rounded-full bg-violet-500/[0.03] blur-[80px]" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">

              {/* Left: copy */}
              <div>
                {/* Badge */}
                <div className="animate-slide-up mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-500"
                  style={{ animationDelay: '0ms' }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-dot-pulse" />
                  Para professores de música
                </div>

                {/* Headline */}
                <h1
                  className="animate-slide-up mb-6 text-5xl font-black leading-[1.06] tracking-tight text-[#0f172a] lg:text-6xl xl:text-[64px]"
                  style={{ animationDelay: '80ms' }}
                >
                  Organize seu<br />
                  estúdio musical.<br />
                  <span className="text-brand-500">Ensine melhor.</span>
                </h1>

                {/* Sub */}
                <p
                  className="animate-slide-up mb-8 max-w-[480px] text-lg leading-relaxed text-slate-600"
                  style={{ animationDelay: '160ms' }}
                >
                  Musly é a plataforma completa para professores: agenda inteligente, portal do aluno, materiais, controle financeiro e assistente IA — tudo em um só lugar.
                </p>

                {/* CTAs */}
                <div
                  className="animate-slide-up mb-10 flex flex-wrap gap-3"
                  style={{ animationDelay: '220ms' }}
                >
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-sm font-semibold text-white shadow-brand transition-all duration-200 hover:bg-brand-600 hover:shadow-brand-lg hover:-translate-y-0.5"
                  >
                    Criar conta grátis
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="#features"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50"
                  >
                    Ver funcionalidades
                  </Link>
                </div>

                {/* Stats row */}
                <div
                  className="animate-slide-up flex flex-wrap items-center gap-6 sm:gap-8"
                  style={{ animationDelay: '280ms' }}
                >
                  {[
                    { value: '1.200+', label: 'professores'         },
                    { value: '15k+',   label: 'aulas realizadas'    },
                    { value: '97%',    label: 'taxa de satisfação'  },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {i > 0 && <div className="h-8 w-px bg-gray-200 hidden sm:block" />}
                      <div>
                        <p className="text-2xl font-black text-[#0f172a]">{s.value}</p>
                        <p className="text-xs text-slate-500">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Ecosystem animation */}
              <div
                className="animate-scale-in flex items-center justify-center lg:pl-4"
                style={{ animationDelay: '120ms' }}
              >
                <MuslyEcosystem />
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. TRUST STRIP ─────────────────────────────────────────────────── */}
        <div className="border-y border-gray-100 bg-[#f8fafc] py-5">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Confiado por professores em todo o Brasil
              </p>
              <div className="hidden sm:flex items-center gap-8">
                {[
                  { v: '1.200+', l: 'Professores'     },
                  { v: '15k+',   l: 'Aulas agendadas' },
                  { v: 'R$2M+',  l: 'Gerenciado'      },
                  { v: '4.9★',   l: 'Avaliação média' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {i > 0 && <div className="h-4 w-px bg-gray-200" />}
                    <span className="font-black text-sm text-[#0f172a]">{s.v}</span>
                    <span className="text-xs text-slate-400">{s.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. FEATURES GRID ───────────────────────────────────────────────── */}
        <section id="features" className="bg-white py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

            <FadeIn direction="up" className="text-center mb-16">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-500">Funcionalidades</p>
              <h2 className="text-4xl font-black text-[#0f172a] lg:text-5xl">
                Tudo que um professor<br />moderno precisa
              </h2>
              <p className="mt-5 text-lg text-slate-500 max-w-xl mx-auto">
                Do planejamento ao financeiro, da IA à comunicação com alunos — o Musly centraliza a sua vida profissional.
              </p>
            </FadeIn>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f, i) => {
                const Icon = f.icon
                return (
                  <FadeIn key={f.title} direction="up" delay={i * 60}>
                    <div className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 hover:border-brand-100">
                      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 transition-colors group-hover:bg-brand-500">
                        <Icon className="h-5 w-5 text-brand-500 transition-colors group-hover:text-white" />
                      </div>
                      <h3 className="mb-2 font-bold text-[#0f172a]">{f.title}</h3>
                      <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
                    </div>
                  </FadeIn>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── 4. CONNECTIVITY SECTION ────────────────────────────────────────── */}
        <section className="bg-[#f8fafc] py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-16 lg:grid-cols-2">

              <FadeIn direction="left">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-500">Integrado e completo</p>
                <h2 className="mb-5 text-4xl font-black leading-tight text-[#0f172a] lg:text-[44px]">
                  Sua rotina de ensino,<br />
                  <span className="text-brand-500">conectada em um só lugar</span>
                </h2>
                <p className="mb-8 text-lg leading-relaxed text-slate-600">
                  Pare de alternar entre apps, planilhas e cadernos. O Musly reúne cada parte da sua rotina de professor em uma plataforma fluida e integrada.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Agenda', 'Alunos', 'Materiais', 'Financeiro', 'IA', 'Portal'].map((tag) => (
                    <span key={tag} className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </FadeIn>

              <FadeIn direction="right" delay={100}>
                <div className="grid grid-cols-3 gap-3">
                  {INTEGRATIONS.map((item, i) => {
                    const Icon = item.icon
                    return (
                      <div
                        key={item.label}
                        className="flex flex-col items-center gap-2.5 rounded-2xl border bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-card hover:-translate-y-0.5"
                        style={{ transitionDelay: `${i * 30}ms` }}
                      >
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${item.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <p className="text-center text-[11px] font-semibold leading-tight text-slate-600">{item.label}</p>
                      </div>
                    )
                  })}
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ── 5. ALTERNATING FEATURE SHOWCASES ──────────────────────────────── */}

        {/* 01 — Agenda */}
        <section className="bg-white py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-16 lg:grid-cols-2">

              <FadeIn direction="left" className="order-2 lg:order-1">
                <AgendaMockup />
              </FadeIn>

              <FadeIn direction="right" className="order-1 lg:order-2">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-500">01</p>
                <h2 className="mb-4 text-4xl font-black leading-tight text-[#0f172a] lg:text-[44px]">
                  Agenda que se adapta<br />à sua rotina
                </h2>
                <p className="mb-6 text-lg leading-relaxed text-slate-600">
                  Visualize toda a sua semana de aulas em uma interface clara. Gerencie horários, veja quem tem aula hoje e nunca perca um compromisso.
                </p>
                <ul className="space-y-3">
                  {['Visualização semanal e mensal', 'Lembretes automáticos por e-mail', 'Fácil reagendamento', 'Relatório de presença por aluno'].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-slate-700">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-brand-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* 02 — Portal do aluno */}
        <section className="bg-[#f8fafc] py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-16 lg:grid-cols-2">

              <FadeIn direction="left">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-500">02</p>
                <h2 className="mb-4 text-4xl font-black leading-tight text-[#0f172a] lg:text-[44px]">
                  Seu aluno sempre<br />informado e engajado
                </h2>
                <p className="mb-6 text-lg leading-relaxed text-slate-600">
                  Cada aluno tem acesso a um portal exclusivo para acompanhar o próprio progresso, baixar materiais e visualizar o histórico de aulas.
                </p>
                <ul className="space-y-3">
                  {['Acesso via link exclusivo, sem instalar nada', 'Histórico completo de aulas', 'Download de partituras e PDFs', 'Comunicação direta com o professor'].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-slate-700">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-brand-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </FadeIn>

              <FadeIn direction="right" delay={100}>
                <StudentPortalMockup />
              </FadeIn>
            </div>
          </div>
        </section>

        {/* 03 — Controle financeiro */}
        <section className="bg-white py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-16 lg:grid-cols-2">

              <FadeIn direction="left" className="order-2 lg:order-1">
                <FinanceMockup />
              </FadeIn>

              <FadeIn direction="right" className="order-1 lg:order-2">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-500">03</p>
                <h2 className="mb-4 text-4xl font-black leading-tight text-[#0f172a] lg:text-[44px]">
                  Suas finanças,<br />organizadas e visuais
                </h2>
                <p className="mb-6 text-lg leading-relaxed text-slate-600">
                  Registre mensalidades, controle pagamentos e acompanhe sua receita crescer mês a mês — sem depender de planilhas ou papel.
                </p>
                <ul className="space-y-3">
                  {['Mensalidades com valor por aluno', 'Registro de pagamento com um clique', 'Gráfico de receita mensal', 'Alertas de inadimplência automáticos'].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-slate-700">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-brand-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* 04 — Modo aula */}
        <section className="bg-[#f8fafc] py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-16 lg:grid-cols-2">

              <FadeIn direction="left">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-500">04</p>
                <h2 className="mb-4 text-4xl font-black leading-tight text-[#0f172a] lg:text-[44px]">
                  Modo Aula: foco total<br />no que importa
                </h2>
                <p className="mb-6 text-lg leading-relaxed text-slate-600">
                  Ative o Modo Aula e tenha o plano do dia, histórico do aluno e sugestões de IA na palma da sua mão — sem distração.
                </p>
                <ul className="space-y-3">
                  {['Plano de aula gerado pela IA', 'Checklist de tópicos em tempo real', 'Sugestões baseadas no histórico do aluno', 'Registro automático pós-aula'].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-slate-700">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-brand-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </FadeIn>

              <FadeIn direction="right" delay={100}>
                <LessonModeMockup />
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ── 6. AI SECTION (dark) ───────────────────────────────────────────── */}
        <section id="ia" className="bg-[#060f22] py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-16 lg:grid-cols-2">

              {/* Left: copy */}
              <FadeIn direction="left">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-400">Inteligência Artificial</p>
                <h2 className="mb-5 text-4xl font-black leading-tight text-white lg:text-[44px]">
                  IA especializada<br />
                  <span className="text-brand-400">em música e ensino</span>
                </h2>
                <p className="mb-8 text-lg leading-relaxed text-white/60">
                  Diferente de chatbots genéricos, a Musly IA tem acesso ao histórico real do seu estúdio. Pergunte sobre qualquer aluno e receba respostas com dados reais.
                </p>
                <div className="space-y-4 mb-8">
                  {[
                    { icon: Brain,    title: 'Contexto real',       desc: 'A IA conhece seus alunos, aulas e progresso. Não precisa explicar nada.' },
                    { icon: Sparkles, title: 'Planos instantâneos',  desc: 'Gere planos de aula personalizados em segundos, baseados no histórico.' },
                    { icon: BarChart2,title: 'Análise de progresso', desc: 'Entenda pontos fortes e dificuldades de cada aluno com um simples pedido.' },
                  ].map((f) => {
                    const Icon = f.icon
                    return (
                      <div key={f.title} className="flex gap-4">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/15">
                          <Icon className="h-4 w-4 text-brand-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">{f.title}</p>
                          <p className="text-sm text-white/50 mt-0.5">{f.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-sm font-semibold text-white shadow-brand transition-all duration-200 hover:bg-brand-600 hover:shadow-brand-lg"
                >
                  Experimentar a IA
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </FadeIn>

              {/* Right: Chat mockup */}
              <FadeIn direction="right" delay={100}>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1117] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.5)]">

                  {/* Chat header */}
                  <div className="flex items-center gap-3 border-b border-white/5 bg-[#161b22] px-4 py-3.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Musly IA</p>
                      <p className="text-[10px] text-white/40">Assistente musical</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] text-emerald-400">Online</span>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="p-4 space-y-4">

                    {/* User */}
                    <div className="flex justify-end">
                      <div className="rounded-2xl rounded-tr-sm bg-brand-500 px-4 py-2.5 max-w-[70%]">
                        <p className="text-xs text-white">Como tá o Pedro?</p>
                      </div>
                    </div>

                    {/* AI */}
                    <div className="flex gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500/20">
                        <Zap className="h-3 w-3 text-brand-400" />
                      </div>
                      <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-white/5 px-4 py-3 max-w-[80%]">
                        <p className="text-xs font-semibold text-white mb-1.5">Pedro Alves · Violão</p>
                        <p className="text-[11px] leading-relaxed text-white/70 mb-2">
                          Última aula <span className="text-white font-medium">10 abr</span>: trabalharam pestana Bm. Pedro apresenta dificuldade na pressão dos dedos indicador e médio.
                        </p>
                        <div className="flex items-start gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-2">
                          <span className="text-amber-400 text-xs shrink-0">⚠</span>
                          <p className="text-[11px] text-amber-300">Dificuldade na pestana repetida por 3 aulas consecutivas.</p>
                        </div>
                      </div>
                    </div>

                    {/* User 2 */}
                    <div className="flex justify-end">
                      <div className="rounded-2xl rounded-tr-sm bg-brand-500 px-4 py-2.5 max-w-[70%]">
                        <p className="text-xs text-white">Crie um plano para a próxima aula</p>
                      </div>
                    </div>

                    {/* AI 2 */}
                    <div className="flex gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500/20">
                        <Zap className="h-3 w-3 text-brand-400" />
                      </div>
                      <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-white/5 px-4 py-3 max-w-[80%]">
                        <p className="text-xs font-semibold text-white mb-2">Plano gerado ✓</p>
                        <ol className="space-y-1.5">
                          {[
                            'Aquecimento: escalas de Lá menor (5 min)',
                            'Exercício de força para a pestana (10 min)',
                            'Revisão do acorde Bm com apoio gradual',
                            '"Nothing Else Matters" — intro completa',
                          ].map((step, i) => (
                            <li key={i} className="flex gap-2 text-[11px] text-white/70">
                              <span className="text-brand-400 font-bold shrink-0">{i + 1}.</span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </div>

                  {/* Input */}
                  <div className="border-t border-white/5 px-4 py-3">
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                      <span className="flex-1 text-[11px] text-white/25">Pergunte sobre seus alunos, aulas ou progresso...</span>
                      <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 transition-colors hover:bg-brand-600">
                        <ArrowRight className="h-3.5 w-3.5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ── 7. PRICING ─────────────────────────────────────────────────────── */}
        <section id="pricing" className="bg-white py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

            <FadeIn direction="up" className="text-center mb-16">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-500">Planos</p>
              <h2 className="text-4xl font-black text-[#0f172a] lg:text-5xl">
                Comece grátis.<br />Cresça no seu ritmo.
              </h2>
              <p className="mt-5 text-lg text-slate-500 max-w-lg mx-auto">
                Sem cartão de crédito para o plano gratuito. Cancele quando quiser nos planos pagos.
              </p>
            </FadeIn>

            <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
              {PLANS.map((plan, i) => (
                <FadeIn key={plan.name} direction="up" delay={i * 80}>
                  <div className={`relative flex h-full flex-col rounded-2xl border p-7 transition-all duration-300 hover:-translate-y-1 ${
                    plan.highlight
                      ? 'border-brand-200 bg-white shadow-[0_0_0_1px_rgba(26,124,250,0.3),0_20px_60px_-12px_rgba(26,124,250,0.2)]'
                      : 'border-gray-200 bg-white shadow-card hover:shadow-card-hover'
                  }`}>

                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white shadow-brand">
                          {plan.badge}
                        </span>
                      </div>
                    )}

                    <div className="mb-6">
                      <p className="mb-1 text-sm font-bold text-slate-500">{plan.name}</p>
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-4xl font-black text-[#0f172a]">{plan.price}</span>
                        <span className="text-slate-400 text-sm">{plan.period}</span>
                      </div>
                      <p className="text-sm text-slate-500">{plan.desc}</p>
                    </div>

                    <ul className="mb-8 flex-1 space-y-3">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2.5 text-sm text-slate-700">
                          <CheckCircle2 className={`h-4 w-4 shrink-0 ${plan.highlight ? 'text-brand-500' : 'text-emerald-500'}`} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/signup"
                      className={`block rounded-xl py-3.5 text-center text-sm font-semibold transition-all duration-200 ${
                        plan.highlight
                          ? 'bg-brand-500 text-white shadow-brand hover:bg-brand-600 hover:shadow-brand-lg'
                          : 'border border-gray-200 bg-white text-slate-700 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </FadeIn>
              ))}
            </div>

            {/* Credit packs */}
            <FadeIn direction="up" delay={200} className="mt-10">
              <div className="rounded-2xl border border-gray-100 bg-[#f8fafc] p-6 text-center">
                <p className="font-bold text-[#0f172a] mb-1">Precisa de mais créditos de IA?</p>
                <p className="text-sm text-slate-500 mb-4">Compre pacotes avulsos a qualquer momento, sem precisar mudar de plano.</p>
                <div className="inline-flex flex-wrap gap-3 justify-center">
                  {[
                    { amount: 50, price: 'R$ 12' },
                    { amount: 150, price: 'R$ 29' },
                    { amount: 400, price: 'R$ 59' },
                  ].map((pack) => (
                    <div key={pack.amount} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm">
                      <span className="font-bold text-[#0f172a]">{pack.amount} créditos</span>
                      <span className="text-slate-400 mx-1.5">·</span>
                      <span className="font-semibold text-brand-500">{pack.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ── 8. TESTIMONIALS ────────────────────────────────────────────────── */}
        <section className="bg-[#f8fafc] py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

            <FadeIn direction="up" className="text-center mb-16">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-500">Depoimentos</p>
              <h2 className="text-4xl font-black text-[#0f172a] lg:text-5xl">
                O que dizem os professores
              </h2>
            </FadeIn>

            <div className="grid gap-6 md:grid-cols-3">
              {TESTIMONIALS.map((t, i) => (
                <FadeIn key={t.name} direction="up" delay={i * 80}>
                  <div className="h-full rounded-2xl border border-gray-100 bg-white p-7 shadow-card">
                    <div className="mb-4 flex gap-0.5">
                      {Array.from({ length: t.stars }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="mb-6 text-[15px] leading-relaxed text-slate-600">&ldquo;{t.text}&rdquo;</p>
                    <div className="flex items-center gap-3 border-t border-gray-100 pt-5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-500">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#0f172a]">{t.name}</p>
                        <p className="text-xs text-slate-400">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── 9. FAQ ─────────────────────────────────────────────────────────── */}
        <FAQSection />

        {/* ── 10. FINAL CTA ──────────────────────────────────────────────────── */}
        <section className="bg-[#060f22] py-28">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">

            <FadeIn direction="up">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-400 mb-8">
                <Music className="h-4 w-4" />
                Comece hoje, gratuitamente
              </div>
              <h2 className="text-4xl font-black leading-tight text-white lg:text-[56px] mb-6">
                Pronto para transformar<br />sua forma de ensinar?
              </h2>
              <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-white/60">
                Junte-se a mais de 1.200 professores que já organizam seu estúdio com o Musly. Comece grátis e veja a diferença.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-8 py-4 text-base font-semibold text-white shadow-brand transition-all duration-200 hover:bg-brand-600 hover:shadow-brand-lg hover:-translate-y-0.5"
                >
                  Criar conta grátis
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white/80 transition-all duration-200 hover:border-white/30 hover:bg-white/5"
                >
                  Já tenho conta
                </Link>
              </div>
              <p className="mt-6 text-sm text-white/30">
                Plano grátis permanente · Sem cartão de crédito · Cancele quando quiser
              </p>
            </FadeIn>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
