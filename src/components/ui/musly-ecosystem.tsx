'use client'

/**
 * MuslyEcosystem
 * ──────────────
 * Premium animated orbital visual for the Musly landing page.
 *
 * Implementation: pure React + Tailwind + SVG (SMIL animateMotion for signal
 * pulses, CSS keyframes for floating cards). Zero extra dependencies.
 *
 * Layout: 500×500 logical SVG space, rendered responsively via
 * `width: min(500px, 90vw)` so it scales naturally on all screens.
 *
 * Center: Musly logo with two pulsing rings + blue glow.
 * Inner ring (r=120): 4 satellites at 0°/90°/180°/270°.
 * Outer ring (r=200): 4 satellites at 45°/135°/225°/315°.
 * Connections: SVG lines with gradient (bright→fade) + animated signal dots.
 */

import {
  Calendar, Users, Brain, DollarSign,
  BookOpen, GraduationCap, ClipboardList,
  Sparkles, Music,
} from 'lucide-react'

// ─── Geometry helpers ─────────────────────────────────────────────────────────

const CX = 250
const CY = 250
const INNER_R = 120
const OUTER_R = 200

/** Returns SVG absolute coords + percentage strings for CSS positioning */
function orbit(ring: 'inner' | 'outer', deg: number) {
  const r = ring === 'inner' ? INNER_R : OUTER_R
  const rad = ((deg - 90) * Math.PI) / 180
  const x = CX + r * Math.cos(rad)
  const y = CY + r * Math.sin(rad)
  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
    pctX: `${(x / 500) * 100}%`,
    pctY: `${(y / 500) * 100}%`,
  }
}

// ─── Satellite definitions ─────────────────────────────────────────────────────

interface SatDef {
  id: string
  label: string
  sub: string
  Icon: React.ElementType
  ring: 'inner' | 'outer'
  deg: number
  // Colors (inline hex for SSR-safe rendering)
  cardBg: string
  cardBorder: string
  iconBg: string
  iconColor: string
  // Animation
  floatClass: string
  floatDelay: string
  // Signal pulse timing
  pulseDur: string
  pulseBegin: string
}

const SATELLITES: SatDef[] = [
  {
    id: 'agenda',
    label: 'Agenda',
    sub: '4 aulas hoje',
    Icon: Calendar,
    ring: 'inner', deg: 0,
    cardBg: '#eff6ff', cardBorder: '#bfdbfe',
    iconBg: '#dbeafe', iconColor: '#1d4ed8',
    floatClass: 'animate-float',
    floatDelay: '0ms',
    pulseDur: '3.2s', pulseBegin: '0s',
  },
  {
    id: 'alunos',
    label: 'Alunos',
    sub: '12 ativos',
    Icon: Users,
    ring: 'inner', deg: 90,
    cardBg: '#f5f3ff', cardBorder: '#ddd6fe',
    iconBg: '#ede9fe', iconColor: '#7c3aed',
    floatClass: 'animate-float-slow',
    floatDelay: '400ms',
    pulseDur: '3.8s', pulseBegin: '0.45s',
  },
  {
    id: 'ia',
    label: 'IA Musical',
    sub: 'Inteligente',
    Icon: Brain,
    ring: 'inner', deg: 180,
    cardBg: '#eef2ff', cardBorder: '#c7d2fe',
    iconBg: '#e0e7ff', iconColor: '#4338ca',
    floatClass: 'animate-float',
    floatDelay: '200ms',
    pulseDur: '3.5s', pulseBegin: '0.9s',
  },
  {
    id: 'fin',
    label: 'Financeiro',
    sub: 'R$3.2k/mês',
    Icon: DollarSign,
    ring: 'inner', deg: 270,
    cardBg: '#f0fdf4', cardBorder: '#bbf7d0',
    iconBg: '#dcfce7', iconColor: '#15803d',
    floatClass: 'animate-float-slower',
    floatDelay: '600ms',
    pulseDur: '4.2s', pulseBegin: '1.35s',
  },
  {
    id: 'mat',
    label: 'Materiais',
    sub: 'PDF & partituras',
    Icon: BookOpen,
    ring: 'outer', deg: 45,
    cardBg: '#fffbeb', cardBorder: '#fde68a',
    iconBg: '#fef3c7', iconColor: '#b45309',
    floatClass: 'animate-float-slow',
    floatDelay: '150ms',
    pulseDur: '4.8s', pulseBegin: '0.2s',
  },
  {
    id: 'portal',
    label: 'Portal Aluno',
    sub: 'Acesso exclusivo',
    Icon: GraduationCap,
    ring: 'outer', deg: 135,
    cardBg: '#f0fdfa', cardBorder: '#99f6e4',
    iconBg: '#ccfbf1', iconColor: '#0f766e',
    floatClass: 'animate-float',
    floatDelay: '800ms',
    pulseDur: '5.2s', pulseBegin: '0.65s',
  },
  {
    id: 'tarefas',
    label: 'Tarefas',
    sub: '3 pendentes',
    Icon: ClipboardList,
    ring: 'outer', deg: 225,
    cardBg: '#fff1f2', cardBorder: '#fecdd3',
    iconBg: '#ffe4e6', iconColor: '#be123c',
    floatClass: 'animate-float-slower',
    floatDelay: '300ms',
    pulseDur: '4.5s', pulseBegin: '1.1s',
  },
  {
    id: 'plan',
    label: 'Planejamento',
    sub: 'com IA',
    Icon: Sparkles,
    ring: 'outer', deg: 315,
    cardBg: '#fdf4ff', cardBorder: '#f5d0fe',
    iconBg: '#fae8ff', iconColor: '#a21caf',
    floatClass: 'animate-float',
    floatDelay: '500ms',
    pulseDur: '3.9s', pulseBegin: '1.55s',
  },
]

// ─── Component ─────────────────────────────────────────────────────────────────

export default function MuslyEcosystem() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto aspect-square select-none"
      style={{ width: 'min(500px, 90vw)' }}
    >
      {/* ── SVG: rings, gradient lines, signal pulses ────────────────────── */}
      <svg
        viewBox="0 0 500 500"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          {/* Radial glow behind center */}
          <radialGradient id="eco-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#1a7cfa" stopOpacity="0.10" />
            <stop offset="50%"  stopColor="#1a7cfa" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#1a7cfa" stopOpacity="0"    />
          </radialGradient>

          {/* Per-satellite line gradient: bright at center, fades toward satellite */}
          {SATELLITES.map(s => {
            const p = orbit(s.ring, s.deg)
            return (
              <linearGradient
                key={`grad-${s.id}`}
                id={`grad-${s.id}`}
                x1={CX} y1={CY}
                x2={p.x} y2={p.y}
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%"   stopColor="#1a7cfa" stopOpacity="0.40" />
                <stop offset="100%" stopColor="#1a7cfa" stopOpacity="0.04" />
              </linearGradient>
            )
          })}
        </defs>

        {/* Background radial glow */}
        <circle cx={CX} cy={CY} r="230" fill="url(#eco-glow)" />

        {/* Outer orbit ring */}
        <circle
          cx={CX} cy={CY} r={OUTER_R + 4}
          fill="none"
          stroke="#1a7cfa" strokeWidth="0.5" strokeOpacity="0.07"
          strokeDasharray="8 6"
        />
        <circle
          cx={CX} cy={CY} r={OUTER_R}
          fill="none"
          stroke="#1a7cfa" strokeWidth="0.5" strokeOpacity="0.10"
          strokeDasharray="5 5"
        />

        {/* Inner orbit ring */}
        <circle
          cx={CX} cy={CY} r={INNER_R + 2}
          fill="none"
          stroke="#1a7cfa" strokeWidth="0.5" strokeOpacity="0.08"
          strokeDasharray="4 4"
        />
        <circle
          cx={CX} cy={CY} r={INNER_R}
          fill="none"
          stroke="#1a7cfa" strokeWidth="0.75" strokeOpacity="0.16"
          strokeDasharray="3 3"
        />

        {/* Connection lines */}
        {SATELLITES.map(s => {
          const p = orbit(s.ring, s.deg)
          return (
            <line
              key={`line-${s.id}`}
              x1={CX} y1={CY}
              x2={p.x} y2={p.y}
              stroke={`url(#grad-${s.id})`}
              strokeWidth="0.8"
            />
          )
        })}

        {/* Signal pulses: small dots travelling from center → satellite */}
        {SATELLITES.map(s => {
          const p = orbit(s.ring, s.deg)
          return (
            <circle key={`pulse-${s.id}`} r="2.5" fill={s.iconColor} fillOpacity="0.55">
              <animateMotion
                dur={s.pulseDur}
                begin={s.pulseBegin}
                repeatCount="indefinite"
                path={`M${CX},${CY} L${p.x},${p.y}`}
              />
            </circle>
          )
        })}
      </svg>

      {/* ── Center element ─────────────────────────────────────────────────── */}
      <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
        {/* Outer slow pulse ring */}
        <div className="animate-pulse-ring-slow absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-500/20" />
        {/* Inner fast pulse ring */}
        <div className="animate-pulse-ring absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand-500/25" />
        {/* Soft glow disc */}
        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/10 blur-xl" />
        {/* Core */}
        <div className="relative flex h-[72px] w-[72px] flex-col items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 shadow-brand-lg ring-4 ring-white ring-offset-0">
          <Music className="h-6 w-6 text-white" />
          <span className="mt-0.5 text-[8px] font-black tracking-[0.12em] text-white/80">MUSLY</span>
        </div>
      </div>

      {/* ── Satellite cards ─────────────────────────────────────────────────── */}
      {SATELLITES.map(s => {
        const p = orbit(s.ring, s.deg)
        const Icon = s.Icon
        return (
          <div
            key={s.id}
            className={`absolute z-10 ${s.floatClass}`}
            style={{
              left: p.pctX,
              top: p.pctY,
              transform: 'translate(-50%, -50%)',
              animationDelay: s.floatDelay,
            }}
          >
            <div
              className="flex items-center gap-2 rounded-xl border shadow-sm transition-shadow duration-300 hover:shadow-md"
              style={{
                backgroundColor: s.cardBg,
                borderColor: s.cardBorder,
                padding: '8px 10px',
              }}
            >
              {/* Icon badge */}
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: s.iconBg }}
              >
                <Icon style={{ color: s.iconColor }} className="h-3.5 w-3.5" />
              </div>

              {/* Text */}
              <div>
                <p
                  className="whitespace-nowrap font-bold text-[#0f172a]"
                  style={{ fontSize: 'clamp(9px, 2.2vw, 12px)' }}
                >
                  {s.label}
                </p>
                <p
                  className="hidden whitespace-nowrap text-slate-400 sm:block"
                  style={{ fontSize: 'clamp(8px, 1.8vw, 10px)' }}
                >
                  {s.sub}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
