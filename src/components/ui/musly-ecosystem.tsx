'use client'

/**
 * MuslyEcosystem — fixed layout
 * ─────────────────────────────
 * BUG FIX NOTES (v2):
 *
 * 1. CSS transform override (primary bug)
 *    The float animation keyframes set `transform: translateY(...)` which
 *    overrides the inline `transform: translate(-50%, -50%)` positioning on the
 *    same element. Every card's TOP-LEFT was placed at the orbit anchor instead
 *    of its CENTER, causing the asymmetrical / "too far out" appearance.
 *    Fix: two-layer structure — outer div handles positioning (stable),
 *    inner div handles the float animation (visual only, no position impact).
 *
 * 2. OUTER_R too large for small screens
 *    r=200 placed diagonal satellites at 21.7% from container edge. The widest
 *    card ("Planejamento", ~134px) overflowed on screens < 340px.
 *    Fix: OUTER_R reduced from 200 → 182. Diagonal centers are now at ≥24.2%,
 *    giving cards a safe 10+ px left edge at 320px container.
 *
 * 3. INNER_R adjusted for better ring proportion
 *    INNER_R reduced from 120 → 110. Gap between rings stays ~72px.
 *    Outer/inner ratio 182/110 ≈ 1.65 — same visual feel as before.
 *
 * Geometry (500×500 logical space, center 250,250):
 *   Inner ring r=110 → cardinals at 28%/50%/72% of container
 *   Outer ring r=182 → diagonals at ≈24.2%/75.8% of container
 */

import {
  Calendar, Users, Brain, DollarSign,
  BookOpen, GraduationCap, ClipboardList,
  Sparkles, Music,
} from 'lucide-react'

// ─── Geometry ─────────────────────────────────────────────────────────────────

const CX = 250
const CY = 250
const INNER_R = 110   // was 120 — adjusted for visual proportion
const OUTER_R = 182   // was 200 — reduced to prevent edge clipping

/** Returns SVG absolute coords + percentage strings for CSS positioning. */
function orbit(ring: 'inner' | 'outer', deg: number) {
  const r = ring === 'inner' ? INNER_R : OUTER_R
  // offset by -90° so deg=0 points to the top of the circle
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface SatDef {
  id: string
  label: string
  sub: string
  Icon: React.ElementType
  ring: 'inner' | 'outer'
  deg: number
  cardBg: string
  cardBorder: string
  iconBg: string
  iconColor: string
  floatClass: string
  floatDelay: string
  pulseDur: string
  pulseBegin: string
}

// ─── Satellite definitions ─────────────────────────────────────────────────────

const SATELLITES: SatDef[] = [
  // ── Inner ring (cardinals) ─────────────────────────────────────────────────
  {
    id: 'agenda',
    label: 'Agenda',
    sub: '4 aulas hoje',
    Icon: Calendar,
    ring: 'inner', deg: 0,       // top
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
    ring: 'inner', deg: 90,      // right
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
    ring: 'inner', deg: 180,     // bottom
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
    ring: 'inner', deg: 270,     // left
    cardBg: '#f0fdf4', cardBorder: '#bbf7d0',
    iconBg: '#dcfce7', iconColor: '#15803d',
    floatClass: 'animate-float-slower',
    floatDelay: '600ms',
    pulseDur: '4.2s', pulseBegin: '1.35s',
  },

  // ── Outer ring (diagonals) ─────────────────────────────────────────────────
  {
    id: 'mat',
    label: 'Materiais',
    sub: 'PDF & partituras',
    Icon: BookOpen,
    ring: 'outer', deg: 45,      // top-right
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
    ring: 'outer', deg: 135,     // bottom-right
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
    ring: 'outer', deg: 225,     // bottom-left
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
    ring: 'outer', deg: 315,     // top-left
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
    /*
     * Container: square, scales with viewport via min().
     * overflow:visible so float animation's vertical travel doesn't get clipped.
     * The hero section's background clip is scoped separately (see page.tsx).
     */
    <div
      aria-hidden="true"
      className="relative mx-auto aspect-square select-none"
      style={{ width: 'min(500px, 90vw)', overflow: 'visible' }}
    >

      {/* ── SVG: rings, gradient lines, signal pulses ─────────────────────── */}
      <svg
        viewBox="0 0 500 500"
        className="absolute inset-0 h-full w-full"
        style={{ overflow: 'visible' }}
        aria-hidden="true"
      >
        <defs>
          {/* Radial glow behind center */}
          <radialGradient id="eco-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#1a7cfa" stopOpacity="0.11" />
            <stop offset="50%"  stopColor="#1a7cfa" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#1a7cfa" stopOpacity="0"    />
          </radialGradient>

          {/* Per-satellite gradient: bright at center → transparent at satellite */}
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
                <stop offset="0%"   stopColor="#1a7cfa" stopOpacity="0.38" />
                <stop offset="100%" stopColor="#1a7cfa" stopOpacity="0.04" />
              </linearGradient>
            )
          })}
        </defs>

        {/* Background glow blob */}
        <circle cx={CX} cy={CY} r="220" fill="url(#eco-glow)" />

        {/* Outer orbit ring — two concentric strokes for depth */}
        <circle
          cx={CX} cy={CY} r={OUTER_R + 5}
          fill="none" stroke="#1a7cfa"
          strokeWidth="0.4" strokeOpacity="0.06"
          strokeDasharray="8 6"
        />
        <circle
          cx={CX} cy={CY} r={OUTER_R}
          fill="none" stroke="#1a7cfa"
          strokeWidth="0.6" strokeOpacity="0.10"
          strokeDasharray="5 5"
        />

        {/* Inner orbit ring */}
        <circle
          cx={CX} cy={CY} r={INNER_R + 2}
          fill="none" stroke="#1a7cfa"
          strokeWidth="0.4" strokeOpacity="0.07"
          strokeDasharray="4 4"
        />
        <circle
          cx={CX} cy={CY} r={INNER_R}
          fill="none" stroke="#1a7cfa"
          strokeWidth="0.7" strokeOpacity="0.15"
          strokeDasharray="3 3"
        />

        {/* Connection lines (gradient: center bright → edge fade) */}
        {SATELLITES.map(s => {
          const p = orbit(s.ring, s.deg)
          return (
            <line
              key={`line-${s.id}`}
              x1={CX} y1={CY} x2={p.x} y2={p.y}
              stroke={`url(#grad-${s.id})`}
              strokeWidth="0.8"
            />
          )
        })}

        {/* Signal pulses: colored dots travelling from center to each satellite */}
        {SATELLITES.map(s => {
          const p = orbit(s.ring, s.deg)
          return (
            <circle
              key={`pulse-${s.id}`}
              r="2.5"
              fill={s.iconColor}
              fillOpacity="0.55"
            >
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

      {/* ── Center element ──────────────────────────────────────────────────── */}
      <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
        {/* Slow outer pulse ring */}
        <div
          className="animate-pulse-ring-slow absolute rounded-full border border-brand-500/20"
          style={{
            width: 96, height: 96,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
        {/* Fast inner pulse ring */}
        <div
          className="animate-pulse-ring absolute rounded-full border-2 border-brand-500/25"
          style={{
            width: 80, height: 80,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
        {/* Soft glow disc */}
        <div
          className="absolute rounded-full bg-brand-500/10 blur-xl"
          style={{
            width: 64, height: 64,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
        {/* Core badge */}
        <div className="relative flex h-[72px] w-[72px] flex-col items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 shadow-brand-lg ring-4 ring-white">
          <Music className="h-6 w-6 text-white" />
          <span className="mt-0.5 text-[8px] font-black tracking-[0.12em] text-white/80">
            MUSLY
          </span>
        </div>
      </div>

      {/* ── Satellite cards ─────────────────────────────────────────────────── */}
      {SATELLITES.map(s => {
        const p = orbit(s.ring, s.deg)
        const Icon = s.Icon
        return (
          /*
           * KEY FIX: two-layer structure.
           *
           * OUTER div (anchor):
           *   - Positions the card center at the orbit point via left/top + translate(-50%,-50%)
           *   - Has NO animation class — this transform must remain stable
           *
           * INNER div (float layer):
           *   - Applies the float animation (translateY only)
           *   - Since it has no position offset of its own, the animation's
           *     transform doesn't fight the centering transform above
           */
          <div
            key={s.id}
            className="absolute z-10"
            style={{
              left: p.pctX,
              top: p.pctY,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className={s.floatClass}
              style={{ animationDelay: s.floatDelay }}
            >
              <div
                className="flex items-center gap-2 rounded-xl border shadow-sm transition-shadow duration-300 hover:shadow-md"
                style={{
                  backgroundColor: s.cardBg,
                  borderColor: s.cardBorder,
                  padding: '7px 10px',
                  whiteSpace: 'nowrap',
                }}
              >
                {/* Icon */}
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: s.iconBg }}
                >
                  <Icon style={{ color: s.iconColor }} className="h-3.5 w-3.5" />
                </div>

                {/* Label + subtitle */}
                <div className="min-w-0">
                  <p className="text-[11px] font-bold leading-tight text-[#0f172a]">
                    {s.label}
                  </p>
                  <p className="hidden text-[9px] leading-tight text-slate-400 sm:block">
                    {s.sub}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
