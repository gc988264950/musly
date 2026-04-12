import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import {
  Music,
  Calendar,
  BarChart2,
  CreditCard,
  ArrowRight,
  CheckCircle,
  Star,
  Users,
  TrendingUp,
  Shield,
  Zap,
  Clock,
  FileText,
  MessageSquare,
  Brain,
  FolderOpen,
  ListMusic,
  BookOpen,
  ChevronRight,
  CheckCircle2,
  Bell,
  DollarSign,
  Play,
  Pause,
} from 'lucide-react'

// ─── Brand constants ──────────────────────────────────────────────────────────

const BLUE = '#1a7cfa'
const BLUE_DARK = '#1468d6'
const BLUE_MUTED = '#eef5ff'

// ─── Mock screen components ───────────────────────────────────────────────────

function DashboardMock() {
  return (
    <div className="rounded-xl bg-[#f8fafc] font-sans text-[11px] leading-tight overflow-hidden">
      {/* Header bar */}
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
        {/* Sidebar */}
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
        {/* Content */}
        <div className="flex-1 p-3 space-y-2.5">
          {/* Greeting */}
          <div>
            <p className="font-bold text-gray-900 text-xs">Bom dia, Ana!</p>
            <p className="text-gray-400 text-[9px]">segunda-feira, 14 de abril</p>
          </div>
          {/* Stats row */}
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
          {/* Today's lessons */}
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

function LessonModeMock() {
  return (
    <div className="rounded-xl bg-white font-sans text-[11px] leading-tight overflow-hidden border border-gray-100">
      {/* Top bar */}
      <div className="bg-[#0d1f3c] px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-white font-bold text-xs">Modo de Aula</p>
          <p className="text-blue-300 text-[9px]">Lucas Ferreira · Violão</p>
        </div>
        <div className="text-center">
          <div className="text-white font-bold text-xl tabular-nums">32:14</div>
          <p className="text-blue-300 text-[9px]">Iniciada às 09:00</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center">
            <Pause className="h-2.5 w-2.5 text-white" />
          </div>
          <div className="rounded-lg bg-green-500 px-2 py-1">
            <p className="text-white text-[9px] font-semibold">Em andamento</p>
          </div>
        </div>
      </div>
      <div className="flex gap-0 h-[180px]">
        {/* Notes area */}
        <div className="flex-1 p-3 border-r border-gray-100">
          <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Anotações</p>
          <div className="space-y-1">
            {[
              'Bom progresso com acorde F',
              'Trabalhar mudança D→G',
              'Ritmo melhorou muito nessa aula',
            ].map((note) => (
              <div key={note} className="rounded bg-[#f8fafc] px-2 py-1">
                <p className="text-gray-700 text-[9px]">{note}</p>
              </div>
            ))}
          </div>
          {/* Performance tags */}
          <div className="mt-2 flex flex-wrap gap-1">
            {['Dedicação ★', 'Técnica ▲', 'Postura ●'].map((tag) => (
              <span key={tag} className="rounded-full bg-[#eef5ff] px-2 py-0.5 text-[8px] font-medium text-[#1a7cfa]">{tag}</span>
            ))}
          </div>
        </div>
        {/* Materials */}
        <div className="w-[100px] p-2 bg-gray-50">
          <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Materiais</p>
          <div className="space-y-1">
            {[
              { name: 'Escala G.pdf', icon: '📄' },
              { name: 'Acorde_F.pdf', icon: '📄' },
              { name: 'Tablatura.png', icon: '🖼' },
            ].map((f) => (
              <div key={f.name} className="rounded bg-white border border-gray-100 p-1.5 flex items-center gap-1">
                <span className="text-[10px]">{f.icon}</span>
                <p className="text-gray-600 text-[8px] truncate">{f.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProgressMock() {
  return (
    <div className="rounded-xl bg-[#f8fafc] font-sans text-[11px] leading-tight overflow-hidden">
      <div className="bg-white border-b border-gray-100 px-4 py-2.5 flex items-center justify-between">
        <p className="font-bold text-gray-900 text-xs">Progresso dos Alunos</p>
        <span className="rounded-full bg-[#eef5ff] px-2 py-0.5 text-[9px] font-semibold text-[#1a7cfa]">12 alunos</span>
      </div>
      <div className="p-3 space-y-2">
        {[
          { name: 'Lucas Ferreira', inst: 'Violão', level: 'Intermediário', pct: 78, color: '#1a7cfa' },
          { name: 'Marina Silva', inst: 'Piano', level: 'Iniciante', pct: 45, color: '#22c55e' },
          { name: 'Pedro Alves', inst: 'Bateria', level: 'Avançado', pct: 91, color: '#f59e0b' },
          { name: 'Sofia Costa', inst: 'Violino', level: 'Intermediário', pct: 62, color: '#8b5cf6' },
        ].map((s) => (
          <div key={s.name} className="bg-white rounded-xl border border-gray-100 px-3 py-2">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{ backgroundColor: s.color }}>
                  {s.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-[9px]">{s.name}</p>
                  <p className="text-gray-400 text-[8px]">{s.inst} · {s.level}</p>
                </div>
              </div>
              <span className="text-[9px] font-bold text-gray-700">{s.pct}%</span>
            </div>
            <div className="h-1 w-full rounded-full bg-gray-100">
              <div className="h-1 rounded-full" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FinanceiroMock() {
  return (
    <div className="rounded-xl bg-white font-sans text-[11px] leading-tight overflow-hidden border border-gray-100">
      <div className="border-b border-gray-100 px-4 py-2.5 flex items-center justify-between">
        <p className="font-bold text-gray-900 text-xs">Controle Financeiro</p>
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-semibold text-green-700">Abr 2025</span>
      </div>
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 p-3">
        <div className="rounded-xl bg-[#eef5ff] p-2">
          <p className="text-gray-500 text-[8px]">Receita</p>
          <p className="font-bold text-[#1a7cfa] text-[11px]">R$ 2.400</p>
        </div>
        <div className="rounded-xl bg-green-50 p-2">
          <p className="text-gray-500 text-[8px]">Pagos</p>
          <p className="font-bold text-green-600 text-[11px]">8</p>
        </div>
        <div className="rounded-xl bg-red-50 p-2">
          <p className="text-gray-500 text-[8px]">Em atraso</p>
          <p className="font-bold text-red-600 text-[11px]">2</p>
        </div>
      </div>
      {/* Table */}
      <div className="px-3 pb-3 space-y-1.5">
        {[
          { name: 'Lucas Ferreira', value: 'R$ 200', status: 'pago', cls: 'bg-green-100 text-green-700' },
          { name: 'Marina Silva', value: 'R$ 200', status: 'pago', cls: 'bg-green-100 text-green-700' },
          { name: 'Pedro Alves', value: 'R$ 200', status: 'atrasado', cls: 'bg-red-100 text-red-700' },
          { name: 'Sofia Costa', value: 'R$ 200', status: 'pendente', cls: 'bg-yellow-100 text-yellow-700' },
        ].map((r) => (
          <div key={r.name} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-2 py-1.5">
            <p className="text-gray-800 text-[9px] font-medium">{r.name}</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-semibold text-gray-700">{r.value}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-semibold ${r.cls}`}>{r.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Section data ─────────────────────────────────────────────────────────────

const painPoints = [
  { icon: Clock,         title: 'Horas perdidas com agendamento',   description: 'Idas e vindas de mensagens para confirmar horários, cancelamentos de última hora e agenda bagunçada.' },
  { icon: MessageSquare, title: 'Cobranças constrangedoras',         description: 'Lembrar alunos de pagar é desgastante. Pagamentos atrasados comprometem sua renda sem que você perceba.' },
  { icon: FileText,      title: 'Sem registro de progresso',        description: 'Você sabe o que cada aluno precisa, mas isso vive só na sua cabeça, sem histórico organizado.' },
  { icon: FolderOpen,    title: 'Materiais espalhados',             description: 'PDFs no WhatsApp, partituras no e-mail, vídeos no Drive, sem um lugar central para tudo isso.' },
  { icon: Brain,         title: 'Planos de aula do zero',           description: 'Preparar planos personalizados para cada aluno consome tempo que poderia ir para o próprio ensino.' },
  { icon: BarChart2,     title: 'Nenhuma visão do negócio',         description: 'Você não sabe quantos alunos ativos tem, qual a receita do mês, nem quem está prestes a desistir.' },
]

const features = [
  { icon: Users,      title: 'Gestão de Alunos',       description: 'Perfil completo, histórico, repertório e progresso de cada aluno em um só lugar.',   color: 'text-[#1a7cfa]', bg: 'bg-[#eef5ff]' },
  { icon: Calendar,   title: 'Agenda Inteligente',      description: 'Calendário semanal, agendamento fácil e visão clara de todos os compromissos.',       color: 'text-blue-700',  bg: 'bg-blue-50' },
  { icon: Brain,      title: 'Planos de Aula com IA',  description: 'Gere planos personalizados em segundos com IA treinada no seu método pedagógico.',     color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { icon: BarChart2,  title: 'Relatórios de Progresso', description: 'Documente a evolução e compartilhe relatórios com alunos e responsáveis.',             color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: CreditCard, title: 'Controle Financeiro',    description: 'Mensalidades, status de pagamentos e receita mensal sem planilhas.',                   color: 'text-violet-600', bg: 'bg-violet-50' },
  { icon: BookOpen,   title: 'Modo de Aula',           description: 'Ambiente focado para a aula, com timer persistente, anotações e materiais.',           color: 'text-orange-600', bg: 'bg-orange-50' },
  { icon: FolderOpen, title: 'Biblioteca de Materiais', description: 'Centralize partituras, PDFs e gravações por aluno, acessíveis em qualquer dispositivo.', color: 'text-rose-600',  bg: 'bg-rose-50' },
  { icon: ListMusic,  title: 'Gestão de Repertório',   description: 'Organize e acompanhe o repertório de cada aluno com status de aprendizado.',            color: 'text-teal-600',  bg: 'bg-teal-50' },
]

const showcaseSections = [
  {
    label: 'Painel Principal',
    headline: 'Tudo o que importa, em um só olhar',
    description: 'O painel do Musly reúne aulas do dia, alertas de pagamento, progresso dos alunos e próximas ações, para que você comece cada dia sabendo exatamente o que fazer.',
    bullets: ['Aulas de hoje com horário e aluno', 'Alertas de mensalidades em atraso', 'Resumo financeiro do mês', 'Atalhos para as ações mais comuns'],
    Mock: DashboardMock,
    flip: false,
  },
  {
    label: 'Modo de Aula',
    headline: 'Foco total na aula, sem distrações',
    description: 'Um ambiente dedicado para conduzir cada sessão. Timer persistente, anotações rápidas, acesso aos materiais do aluno e marcação de performance, tudo a um clique.',
    bullets: ['Timer que persiste ao navegar entre páginas', 'Acesso rápido a PDFs e partituras do aluno', 'Anotações salvas automaticamente', 'Marcadores de performance por atividade'],
    Mock: LessonModeMock,
    flip: true,
  },
  {
    label: 'Progresso dos Alunos',
    headline: 'Acompanhe a evolução de cada aluno com clareza',
    description: 'Visualize o histórico completo de cada aluno, com frequência, repertório em andamento e planos anteriores. Compartilhe relatórios elegantes com responsáveis.',
    bullets: ['Frequência e assiduidade por aluno', 'Histórico de planos de aula', 'Repertório organizado por status', 'Exportação de relatório para responsáveis'],
    Mock: ProgressMock,
    flip: false,
  },
  {
    label: 'Controle Financeiro',
    headline: 'Receba em dia, sem conversas constrangedoras',
    description: 'Configure mensalidade, dia de vencimento e link de pagamento para cada aluno. O Musly monitora quem está em dia, quem está atrasado e destaca as ações necessárias.',
    bullets: ['Status de pagamento por aluno', 'Link de pagamento (Pix, MercadoPago...)', 'Histórico de pagamentos registrado', 'Alertas automáticos para professor e aluno'],
    Mock: FinanceiroMock,
    flip: true,
  },
]

const howItWorks = [
  { step: '01', title: 'Configure seu estúdio',    description: 'Adicione suas informações, método pedagógico e instrumentos em menos de 5 minutos.' },
  { step: '02', title: 'Cadastre seus alunos',      description: 'Importe sua lista ou adicione alunos um a um com perfil completo e informações de contato.' },
  { step: '03', title: 'Crie contas de aluno',      description: 'Convide seus alunos para o Portal do Aluno, onde acompanham aulas, materiais e mensalidade.' },
  { step: '04', title: 'Ensine e cresça',            description: 'Deixe o Musly cuidar da burocracia enquanto você foca em inspirar seus alunos.' },
]

const differentials = [
  { title: 'IA treinada no seu método',       description: 'Você descreve seu estilo pedagógico uma vez. A IA gera planos personalizados para cada aluno.',                   icon: Brain },
  { title: 'Portal dedicado ao aluno',        description: 'Alunos têm acesso ao próprio portal com aulas, materiais, repertório e status da mensalidade.',                    icon: Users },
  { title: 'Modo de Aula imersivo',           description: 'Ambiente focado para conduzir cada aula com timer, materiais e anotações integrados.',                             icon: BookOpen },
  { title: 'Financeiro sem atrito',           description: 'Configure uma vez e acompanhe quem pagou, quem está atrasado e quanto você recebe no mês.',                        icon: CreditCard },
]

const stats = [
  { value: '3.000+',   label: 'Professores de Música' },
  { value: '75.000+',  label: 'Alunos Gerenciados' },
  { value: 'R$ 20M+',  label: 'em Mensalidades Acompanhadas' },
  { value: '4,9 / 5',  label: 'Avaliação Média' },
]

const testimonials = [
  {
    quote: 'O Musly me economizou cinco horas por semana em burocracia. Finalmente tenho tempo para preparar as aulas com calma.',
    name: 'Sarah M.', role: 'Professora de Piano, 12 alunos', rating: 5,
  },
  {
    quote: 'Os relatórios de progresso são lindos. Os pais adoram recebê-los. Meu estúdio ficou muito mais profissional da noite para o dia.',
    name: 'James K.', role: 'Instrutor de Violão, 28 alunos', rating: 5,
  },
  {
    quote: 'Zero aulas perdidas desde que comecei a usar. Os lembretes automáticos funcionam melhor do que qualquer outra ferramenta que já testei.',
    name: 'Maria L.', role: 'Professora de Violino, 19 alunos', rating: 5,
  },
]

const pricingPlans = [
  {
    name: 'Iniciante', price: 'Grátis', period: '',
    description: 'Ideal para quem está começando.',
    cta: 'Criar conta grátis', highlighted: false,
    features: ['Até 5 alunos', 'Agendamento básico', 'Perfis de alunos', 'Suporte por e-mail'],
  },
  {
    name: 'Profissional', price: 'R$ 59', period: '/ mês',
    description: 'Para estúdios em crescimento.',
    cta: 'Iniciar período gratuito', highlighted: true, badge: 'Mais popular',
    features: ['Até 30 alunos', 'Agendamento avançado', 'Planos de aula com IA', 'Relatórios de progresso', 'Controle financeiro', 'Portal do Aluno', 'Suporte prioritário'],
  },
  {
    name: 'Estúdio', price: 'R$ 149', period: '/ mês',
    description: 'Para estúdios consolidados e pequenas escolas.',
    cta: 'Iniciar período gratuito', highlighted: false,
    features: ['Alunos ilimitados', 'Todos os recursos Profissional', 'Membros da equipe (até 5)', 'Personalização de marca', 'Suporte dedicado'],
  },
]

const faqItems = [
  { q: 'Preciso de cartão de crédito para criar uma conta?',   a: 'Não. O plano Iniciante é gratuito para sempre, sem necessidade de cartão de crédito. Você só precisa de um e-mail para começar.' },
  { q: 'Posso migrar meus alunos de outra plataforma?',        a: 'Sim. Você pode importar seus alunos manualmente ou usar nosso importador em lote. Nossa equipe de suporte também pode ajudar na migração.' },
  { q: 'Como funciona o Portal do Aluno?',                     a: 'Você cria uma conta de acesso para cada aluno. Eles entram em um portal separado onde veem aulas, materiais, repertório e status da mensalidade.' },
  { q: 'A IA realmente personaliza os planos de aula?',        a: 'Sim. Você descreve seu método pedagógico nas configurações, e a IA usa isso como contexto ao gerar planos, levando em conta o nível e histórico de cada aluno.' },
  { q: 'O Musly processa pagamentos?',                         a: 'O Musly acompanha o status de pagamento e exibe alertas, mas o processamento é feito pelo seu link de pagamento preferido (Pix, MercadoPago, etc.).' },
  { q: 'Posso cancelar quando quiser?',                        a: 'Sim. Não há contratos ou fidelidade. Você cancela quando quiser, direto pelas configurações da conta.' },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── 1. Hero ── */}
      <section className="relative overflow-hidden bg-[#060f22] text-white pt-24 pb-32">
        {/* Glow orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 right-0 h-[700px] w-[700px] rounded-full bg-[#1a7cfa] opacity-[0.07] blur-3xl" />
          <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-[#1468d6] opacity-[0.06] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-sm text-blue-300 backdrop-blur-sm">
              <Music className="h-3.5 w-3.5" />
              A plataforma feita para educadores musicais
            </div>

            <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Seu Estúdio de Música,{' '}
              <span className="text-[#1a7cfa]">
                sem a burocracia
              </span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-gray-400 sm:text-xl">
              O Musly reúne gestão de alunos, agendamento, planos de aula com IA, controle financeiro e portal do aluno, para que você gaste mais tempo ensinando e menos tempo com papelada.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1a7cfa] px-8 py-4 text-base font-semibold shadow-brand transition-all duration-200 hover:bg-[#1468d6]"
              >
                Comece Gratuitamente <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-8 py-4 text-base font-semibold backdrop-blur-sm transition-all duration-200 hover:bg-white/10 hover:border-white/25"
              >
                Ver funcionalidades
              </Link>
            </div>

            <p className="mt-5 text-sm text-gray-600">
              Sem cartão de crédito · Plano gratuito para sempre · Pronto em 5 minutos
            </p>
          </div>

          {/* Hero mock screen */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 shadow-2xl backdrop-blur-sm">
              <DashboardMock />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Stats ── */}
      <section className="border-y border-gray-100 bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold text-[#1a7cfa]">{stat.value}</div>
                <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Pain Points ── */}
      <section className="bg-[#f8fafc] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#1a7cfa]">O problema</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-gray-900">
              Professores de música merecem ferramentas melhores
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              A burocracia do dia a dia rouba o tempo que deveria ir para o ensino. Você reconhece algum desses problemas?
            </p>
          </div>

          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {painPoints.map((point) => {
              const Icon = point.icon
              return (
                <div key={point.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                    <Icon className="h-5 w-5 text-red-400" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-gray-900">{point.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{point.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 4. Features ── */}
      <section id="features" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#1a7cfa]">Funcionalidades</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-gray-900">
              Uma plataforma completa para o seu estúdio
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Chega de planilhas, mensagens perdidas e aplicativos separados. O Musly centraliza tudo.
            </p>
          </div>

          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
                >
                  <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${feature.bg}`}>
                    <Icon className={`h-5 w-5 ${feature.color}`} />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 5. Product Showcase ── */}
      <section className="bg-[#f8fafc] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-20">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#1a7cfa]">A plataforma em detalhe</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-gray-900">Veja o Musly por dentro</h2>
          </div>

          <div className="space-y-28">
            {showcaseSections.map((item) => {
              const MockComponent = item.Mock
              return (
                <div
                  key={item.label}
                  className={`flex flex-col gap-12 lg:flex-row lg:items-center ${item.flip ? 'lg:flex-row-reverse' : ''}`}
                >
                  {/* Text */}
                  <div className="flex-1">
                    <span className="inline-block rounded-full bg-[#eef5ff] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#1a7cfa]">
                      {item.label}
                    </span>
                    <h3 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">{item.headline}</h3>
                    <p className="mt-4 text-lg leading-relaxed text-gray-500">{item.description}</p>
                    <ul className="mt-6 space-y-3">
                      {item.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-3 text-sm text-gray-600">
                          <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#1a7cfa]" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Mock screen */}
                  <div className="flex-1">
                    <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-card-hover">
                      <MockComponent />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 6. How it works ── */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#1a7cfa]">Como funciona</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-gray-900">Pronto em poucos minutos</h2>
            <p className="mt-4 text-lg text-gray-500">Sem treinamento, sem migração complexa. Você começa a usar no mesmo dia.</p>
          </div>

          <div className="mt-16 grid gap-10 lg:grid-cols-4">
            {howItWorks.map((item, i) => (
              <div key={item.step} className="relative">
                {i < howItWorks.length - 1 && (
                  <div className="absolute left-full top-7 hidden h-px w-full bg-gradient-to-r from-[#1a7cfa]/20 to-[#b0d2ff]/20 lg:block" />
                )}
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1a7cfa] text-lg font-bold text-white shadow-brand">
                  {item.step}
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">{item.title}</h3>
                <p className="leading-relaxed text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Differentials ── */}
      <section className="bg-[#060f22] py-24 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#4a90ff]">Por que o Musly</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight">Feito especificamente para professores de música</h2>
            <p className="mt-4 text-lg text-gray-400">
              Diferente de CRMs genéricos, o Musly foi construído para o fluxo de trabalho real de quem ensina música.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {differentials.map((d) => {
              const Icon = d.icon
              return (
                <div key={d.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#1a7cfa]/20">
                    <Icon className="h-5 w-5 text-[#1a7cfa]" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-white">{d.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-400">{d.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 8. Testimonials ── */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#1a7cfa]">Depoimentos</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-gray-900">Professores que transformaram seu estúdio</h2>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-gray-100 bg-[#f8fafc] p-8">
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="mb-6 leading-relaxed text-gray-700">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="text-sm text-gray-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. Pricing ── */}
      <section id="pricing" className="bg-[#f8fafc] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#1a7cfa]">Preços</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-gray-900">Simples e transparente</h2>
            <p className="mt-4 text-lg text-gray-500">Comece gratuitamente, atualize quando estiver pronto. Sem taxas ocultas.</p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative overflow-hidden rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1 ${
                  plan.highlighted
                    ? 'border-[#1a7cfa]/20 bg-[#1a7cfa] text-white shadow-brand-lg'
                    : 'border-gray-200 bg-white text-gray-900 shadow-card hover:shadow-card-hover'
                }`}
              >
                {plan.badge && (
                  <div className="absolute right-6 top-6 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
                    {plan.badge}
                  </div>
                )}
                <div>
                  <p className={`text-sm font-semibold ${plan.highlighted ? 'text-blue-100' : 'text-gray-500'}`}>{plan.name}</p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className={`text-sm ${plan.highlighted ? 'text-blue-100' : 'text-gray-500'}`}>{plan.period}</span>
                  </div>
                  <p className={`mt-2 text-sm ${plan.highlighted ? 'text-blue-100' : 'text-gray-500'}`}>{plan.description}</p>
                </div>
                <ul className="my-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <CheckCircle className={`h-4 w-4 flex-shrink-0 ${plan.highlighted ? 'text-blue-200' : 'text-[#1a7cfa]'}`} />
                      <span className={plan.highlighted ? 'text-blue-50' : 'text-gray-600'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all duration-200 ${
                    plan.highlighted
                      ? 'bg-white text-[#1a7cfa] hover:bg-blue-50'
                      : 'border border-gray-200 bg-white text-gray-900 hover:border-[#1a7cfa]/40 hover:text-[#1a7cfa]'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#1a7cfa]">FAQ</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-gray-900">Perguntas frequentes</h2>
          </div>
          <div className="space-y-3">
            {faqItems.map((item) => (
              <div key={item.q} className="rounded-2xl border border-gray-100 bg-[#f8fafc] px-6 py-5">
                <div className="flex items-start gap-3">
                  <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#1a7cfa]" />
                  <div>
                    <p className="font-semibold text-gray-900">{item.q}</p>
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. Final CTA ── */}
      <section className="bg-[#f8fafc] py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="overflow-hidden rounded-3xl bg-[#1a7cfa] px-8 py-16 shadow-brand-lg">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm text-white">
              <Zap className="h-4 w-4" />
              Pronto em menos de 5 minutos
            </div>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-white">Comece a ensinar melhor, hoje.</h2>
            <p className="mt-4 text-lg text-blue-100">
              Junte-se a milhares de professores de música que simplificaram a gestão do seu estúdio com o Musly.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-[#1a7cfa] shadow-lg transition-all duration-200 hover:bg-blue-50"
              >
                Criar conta grátis <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white transition-all duration-200 hover:bg-white/20"
              >
                Já tenho conta
              </Link>
            </div>
            <div className="mt-6 flex flex-col items-center justify-center gap-4 text-sm text-blue-100 sm:flex-row sm:gap-8">
              <span className="flex items-center gap-1.5"><Shield className="h-4 w-4" /> Sem cartão de crédito</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Plano gratuito para sempre</span>
              <span className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4" /> Cancele quando quiser</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
