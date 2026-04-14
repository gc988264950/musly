import { Music, Zap, CreditCard, Check, Calendar } from 'lucide-react'

export default function DashboardMockup() {
  return (
    <div className="relative">
      {/* Ambient glow */}
      <div className="absolute -inset-6 rounded-3xl bg-brand-500/6 blur-3xl" />

      {/* Main browser frame */}
      <div className="relative overflow-hidden rounded-[18px] ring-1 ring-gray-200 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.18)] bg-white">

        {/* macOS browser chrome */}
        <div className="flex items-center gap-2 bg-[#f0f0f2] px-4 py-2.5 border-b border-gray-200">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <div className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 mx-3 bg-white rounded-md px-3 py-1 text-[11px] text-gray-400 border border-gray-200/80 font-mono">
            app.musly.com.br/dashboard
          </div>
        </div>

        {/* App shell */}
        <div className="flex" style={{ height: '370px' }}>

          {/* Sidebar */}
          <div className="w-[130px] bg-[#0f172a] py-4 px-2.5 flex flex-col gap-0.5 shrink-0">
            <div className="flex items-center gap-2 px-2 pb-3 mb-2 border-b border-white/10">
              <div className="h-6 w-6 rounded-lg bg-brand-500 flex items-center justify-center shrink-0">
                <Music className="h-3 w-3 text-white" />
              </div>
              <span className="font-black text-white text-[11px]">Musly</span>
            </div>
            {[
              { label: 'Painel',      active: true  },
              { label: 'Alunos',      active: false },
              { label: 'Agenda',      active: false },
              { label: 'Materiais',   active: false },
              { label: 'Financeiro',  active: false },
              { label: 'Assistente IA', active: false },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-lg px-2.5 py-2 text-[10px] font-medium transition-colors ${
                  item.active
                    ? 'bg-brand-500/20 text-blue-400'
                    : 'text-white/35'
                }`}
              >
                {item.label}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 bg-[#f8fafc] p-4 overflow-hidden">
            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-[#0f172a] text-[13px]">Bom dia, Prof. Ana! 👋</p>
                <p className="text-[#94a3b8] text-[10px]">Segunda-feira, 14 de abril</p>
              </div>
              <div className="flex items-center gap-1.5 bg-blue-50 rounded-lg px-2.5 py-1.5 border border-blue-100">
                <Zap className="h-3 w-3 text-brand-500" />
                <span className="text-[10px] text-brand-500 font-semibold">48 créditos</span>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Alunos',     value: '12',     sub: '+2 este mês',  textCls: 'text-brand-500',   bgCls: 'bg-blue-50 border-blue-100'  },
                { label: 'Aulas Hoje', value: '4',      sub: 'Próx: 14:00',  textCls: 'text-emerald-600', bgCls: 'bg-emerald-50 border-emerald-100' },
                { label: 'Receita',    value: 'R$3.2k', sub: '+18% ↑',       textCls: 'text-violet-600',  bgCls: 'bg-violet-50 border-violet-100' },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl border p-2.5 ${s.bgCls}`}>
                  <p className={`font-black text-[14px] leading-none ${s.textCls}`}>{s.value}</p>
                  <p className="text-[#64748b] text-[9px] mt-1">{s.label}</p>
                  <p className="text-emerald-500 text-[8px] mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Today's schedule */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
              <p className="text-[10px] font-bold text-[#0f172a] mb-2.5 flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-brand-500" />
                Agenda de Hoje
              </p>
              {[
                { time: '14:00', name: 'Pedro Alves',  sub: 'Violão',         badge: 'Agora',   cls: 'bg-emerald-100 text-emerald-600' },
                { time: '15:30', name: 'Maria Santos', sub: 'Teclado',        badge: 'Próxima', cls: 'bg-blue-100 text-brand-600'  },
                { time: '17:00', name: 'João Lima',    sub: 'Teoria Musical', badge: '',        cls: '' },
              ].map((l) => (
                <div key={l.time} className="flex items-center gap-2.5 py-1.5 border-b border-gray-50 last:border-0">
                  <span className="w-8 text-[9px] text-[#94a3b8] shrink-0">{l.time}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-[#0f172a] truncate">{l.name}</p>
                    <p className="text-[9px] text-[#94a3b8]">{l.sub}</p>
                  </div>
                  {l.badge && (
                    <span className={`text-[8px] font-semibold rounded-full px-1.5 py-0.5 shrink-0 ${l.cls}`}>{l.badge}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating chip — top-left */}
      <div className="absolute -left-8 top-10 animate-float-slow hidden sm:flex">
        <div className="bg-white rounded-2xl shadow-card-hover border border-gray-100/80 px-3 py-2.5 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <Check className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#0f172a] leading-tight">Plano enviado</p>
            <p className="text-[9px] text-[#94a3b8]">Pedro · Violão</p>
          </div>
        </div>
      </div>

      {/* Floating chip — top-right */}
      <div className="absolute -right-8 top-8 animate-float hidden sm:flex">
        <div className="bg-white rounded-2xl shadow-card-hover border border-gray-100/80 px-3 py-2.5 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Zap className="h-4 w-4 text-brand-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#0f172a] leading-tight">IA respondeu</p>
            <p className="text-[9px] text-[#94a3b8]">Análise pronta</p>
          </div>
        </div>
      </div>

      {/* Floating chip — bottom-right */}
      <div className="absolute -right-6 bottom-10 animate-float-slower hidden sm:flex">
        <div className="bg-white rounded-2xl shadow-card-hover border border-gray-100/80 px-3 py-2.5 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
            <CreditCard className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#0f172a] leading-tight">R$ 180 recebido</p>
            <p className="text-[9px] text-emerald-500 font-medium">pagamento confirmado ✓</p>
          </div>
        </div>
      </div>
    </div>
  )
}
