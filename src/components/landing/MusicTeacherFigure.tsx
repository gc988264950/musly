'use client'

// SVG illustration of a music teacher — styled similar to the RECT landing page
// Uses gradients + glow filters to create a glass/3D quality with blue accent color

export default function MusicTeacherFigure() {
  return (
    <div className="relative w-full h-[580px] select-none overflow-visible">

      {/* ── Outer ambient glow ───────────────────────────────────────────── */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(26,124,250,0.22) 0%, rgba(59,130,246,0.08) 55%, transparent 75%)',
          filter: 'blur(30px)',
        }}
      />

      {/* ── Dot grid overlay ─────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(#1a7cfa 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />

      {/* ── Main SVG figure ──────────────────────────────────────────────── */}
      <svg
        viewBox="0 0 500 580"
        className="relative w-full h-full"
        style={{ filter: 'drop-shadow(0 8px 40px rgba(26,124,250,0.18))' }}
        aria-hidden="true"
      >
        <defs>
          {/* Skin gradient — light from upper-left */}
          <radialGradient id="skin" cx="38%" cy="32%" r="65%">
            <stop offset="0%"   stopColor="#f4ddc8" />
            <stop offset="55%"  stopColor="#e0b898" />
            <stop offset="100%" stopColor="#c49068" />
          </radialGradient>

          {/* Hair gradient */}
          <linearGradient id="hair" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%"   stopColor="#1a2a4a" />
            <stop offset="100%" stopColor="#0d1520" />
          </linearGradient>

          {/* Dress / blouse — blue gradient */}
          <linearGradient id="dress" x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%"   stopColor="#2563eb" />
            <stop offset="50%"  stopColor="#1a7cfa" />
            <stop offset="100%" stopColor="#0d1f3c" />
          </linearGradient>

          {/* Dress highlight (lighter edge) */}
          <linearGradient id="dressHL" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#60a5fa" stopOpacity="0.6" />
            <stop offset="40%"  stopColor="#1a7cfa" stopOpacity="0" />
          </linearGradient>

          {/* Sheet music paper */}
          <linearGradient id="paper" x1="0" y1="0" x2="0.1" y2="1">
            <stop offset="0%"   stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e8f0fe" />
          </linearGradient>

          {/* Edge glow filter — used on figure outline */}
          <filter id="blueGlow" x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feFlood floodColor="#1a7cfa" floodOpacity="0.7" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft note glow */}
          <filter id="noteGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Clip path for figure body */}
          <clipPath id="bodyClip">
            <rect x="50" y="220" width="400" height="380" />
          </clipPath>
        </defs>

        {/* ── Staff lines (subtle background) ────────────────────────────── */}
        {[155, 168, 181, 194, 207].map((y) => (
          <line key={y} x1="30" y1={y} x2="470" y2={y}
            stroke="#1a7cfa" strokeWidth="0.6" strokeOpacity="0.2" />
        ))}

        {/* Treble clef watermark */}
        <text x="58" y="220" fontSize="72" fill="#1a7cfa" fillOpacity="0.07"
          fontFamily="serif" fontStyle="italic">𝄞</text>

        {/* ── Hair (behind head) ─────────────────────────────────────────── */}
        {/* Top of hair */}
        <path
          d="M175,148 Q185,68 250,52 Q315,68 325,148
             Q305,108 290,100 Q270,88 250,85
             Q230,88 210,100 Q195,108 175,148Z"
          fill="url(#hair)"
        />
        {/* Left side hair */}
        <path
          d="M178,152 Q155,170 148,215 Q144,250 150,290
             Q155,320 162,345 Q155,300 155,270
             Q153,235 158,200 Q163,172 182,158Z"
          fill="url(#hair)"
        />
        {/* Right side hair */}
        <path
          d="M322,152 Q345,170 352,215 Q356,250 350,290
             Q345,320 338,345 Q345,300 345,270
             Q347,235 342,200 Q337,172 318,158Z"
          fill="url(#hair)"
        />
        {/* Hair strand flowing left — elegant curve */}
        <path
          d="M155,290 Q140,330 145,380 Q148,410 155,430"
          stroke="#0d1520" strokeWidth="22" strokeLinecap="round" fill="none"
        />
        {/* Hair strand right */}
        <path
          d="M345,290 Q360,330 355,380 Q352,410 345,430"
          stroke="#1a2a4a" strokeWidth="18" strokeLinecap="round" fill="none"
        />
        {/* Small bun highlight */}
        <ellipse cx="250" cy="68" rx="28" ry="14" fill="#253a5e" />

        {/* ── Head ──────────────────────────────────────────────────────── */}
        <ellipse cx="250" cy="152" rx="74" ry="84" fill="url(#skin)" />
        {/* Edge lighting on head */}
        <ellipse cx="250" cy="152" rx="74" ry="84"
          fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeOpacity="0.35" />

        {/* Subtle facial features */}
        {/* Left eyebrow */}
        <path d="M218,130 Q228,124 238,128"
          stroke="#8b6040" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        {/* Right eyebrow */}
        <path d="M262,128 Q272,124 282,130"
          stroke="#8b6040" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        {/* Left eye */}
        <ellipse cx="228" cy="142" rx="9" ry="5.5" fill="#3a2010" />
        <ellipse cx="228" cy="142" rx="4"  ry="3"   fill="#1a0c08" />
        <ellipse cx="226" cy="140" rx="2"  ry="1.5" fill="white"   fillOpacity="0.7" />
        {/* Right eye */}
        <ellipse cx="272" cy="142" rx="9" ry="5.5" fill="#3a2010" />
        <ellipse cx="272" cy="142" rx="4"  ry="3"   fill="#1a0c08" />
        <ellipse cx="270" cy="140" rx="2"  ry="1.5" fill="white"   fillOpacity="0.7" />
        {/* Nose */}
        <path d="M250,155 Q245,168 248,172 Q252,174 256,172 Q259,168 250,155"
          fill="#c49068" fillOpacity="0.5" />
        {/* Lips */}
        <path d="M234,182 Q242,178 250,180 Q258,178 266,182
                 Q258,190 250,191 Q242,190 234,182Z"
          fill="#c27a60" />
        <path d="M234,182 Q250,186 266,182"
          stroke="#a85a40" strokeWidth="0.8" fill="none" />

        {/* ── Neck ──────────────────────────────────────────────────────── */}
        <rect x="232" y="228" width="36" height="38" rx="10" fill="#d4a882" />

        {/* ── Dress / blouse ─────────────────────────────────────────────── */}
        {/* Main body shape */}
        <path
          d="M148,278
             Q178,255 232,248 L232,265 L268,265 L268,248
             Q322,255 352,278
             Q385,318 378,440
             L122,440
             Q115,318 148,278Z"
          fill="url(#dress)"
        />
        {/* Left edge highlight (like the glowing edge in reference) */}
        <path
          d="M148,278 Q120,320 122,400 Q123,430 130,440"
          stroke="#60a5fa" strokeWidth="2.5" strokeOpacity="0.55" fill="none"
          strokeLinecap="round"
        />
        {/* Collar V-neck */}
        <path d="M232,248 L250,292 L268,248" fill="#0d2a6e" />
        {/* Dress overlay highlight */}
        <path
          d="M148,278 Q178,255 232,248 L232,265 L210,320 L148,320Z"
          fill="url(#dressHL)"
        />
        {/* Subtle music notation pattern on dress */}
        <text x="170" y="350" fontSize="18" fill="white" fillOpacity="0.12"
          fontFamily="serif">♫</text>
        <text x="298" y="370" fontSize="14" fill="white" fillOpacity="0.1"
          fontFamily="serif">♩</text>
        <text x="195" y="405" fontSize="11" fill="white" fillOpacity="0.1"
          fontFamily="serif">♪</text>
        <text x="310" y="420" fontSize="10" fill="white" fillOpacity="0.1"
          fontFamily="serif">♬</text>

        {/* ── Left arm — holding sheet music ─────────────────────────────── */}
        <path
          d="M153,288 Q100,308 68,352 Q56,368 66,378 L118,378
             Q132,365 158,318Z"
          fill="url(#dress)"
        />
        {/* Arm edge highlight */}
        <path
          d="M153,288 Q100,308 68,352 Q56,368 66,378"
          stroke="#60a5fa" strokeWidth="1.5" strokeOpacity="0.4" fill="none"
          strokeLinecap="round"
        />
        {/* Hand */}
        <ellipse cx="72" cy="374" rx="15" ry="10" fill="#d4a882" />

        {/* Sheet music paper */}
        <rect x="22" y="342" width="72" height="90" rx="4" fill="url(#paper)"
          style={{ filter: 'drop-shadow(2px 2px 6px rgba(0,0,0,0.15))' }} />
        {/* Staff lines on sheet */}
        {[358, 368, 378, 388, 398].map((y) => (
          <line key={y} x1="32" y1={y} x2="84" y2={y}
            stroke="#1a7cfa" strokeWidth="1" strokeOpacity="0.7" />
        ))}
        {/* Treble clef on sheet */}
        <text x="29" y="400" fontSize="48" fill="#1a7cfa" fillOpacity="0.8"
          fontFamily="serif" fontStyle="italic">𝄞</text>
        {/* Notes on sheet */}
        <circle cx="54" cy="366" r="3.5" fill="#0d1f3c" />
        <line x1="57.5" y1="366" x2="57.5" y2="350" stroke="#0d1f3c" strokeWidth="1.5" />
        <circle cx="66" cy="361" r="3.5" fill="#0d1f3c" />
        <line x1="69.5" y1="361" x2="69.5" y2="345" stroke="#0d1f3c" strokeWidth="1.5" />
        <circle cx="78" cy="369" r="3.5" fill="#0d1f3c" />
        <line x1="81.5" y1="369" x2="81.5" y2="353" stroke="#0d1f3c" strokeWidth="1.5" />
        {/* Sheet corner fold */}
        <path d="M82,342 L94,354 L82,354Z" fill="#dbeafe" />

        {/* ── Right arm — conducting gesture ─────────────────────────────── */}
        <path
          d="M347,288 Q400,295 432,262 Q446,248 442,236
             L416,228 Q406,242 372,268Z"
          fill="url(#dress)"
        />
        {/* Arm edge highlight */}
        <path
          d="M347,288 Q400,295 432,262 Q446,248 442,236"
          stroke="#60a5fa" strokeWidth="1.5" strokeOpacity="0.4" fill="none"
          strokeLinecap="round"
        />
        {/* Hand */}
        <ellipse cx="438" cy="234" rx="12" ry="9" fill="#d4a882" />
        {/* Baton */}
        <line x1="444" y1="228" x2="478" y2="182"
          stroke="#f1f5f9" strokeWidth="3" strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 4px rgba(26,124,250,0.7))' }}
        />
        {/* Baton tip glow */}
        <circle cx="480" cy="180" r="5" fill="#1a7cfa"
          style={{ filter: 'drop-shadow(0 0 6px rgba(26,124,250,1))' }} />
        <circle cx="480" cy="180" r="3" fill="#93c5fd" />

        {/* ── Floating musical notes (animated via CSS) ───────────────────── */}
        <g style={{ animation: 'noteFloat1 5s ease-in-out infinite' }}>
          <text x="408" y="128" fontSize="36" fill="#1a7cfa" fillOpacity="0.75"
            fontFamily="serif" filter="url(#noteGlow)">♪</text>
        </g>
        <g style={{ animation: 'noteFloat2 6.5s ease-in-out infinite 0.8s' }}>
          <text x="46" y="196" fontSize="28" fill="#3b82f6" fillOpacity="0.6"
            fontFamily="serif" filter="url(#noteGlow)">♫</text>
        </g>
        <g style={{ animation: 'noteFloat3 4.8s ease-in-out infinite 1.6s' }}>
          <text x="392" y="248" fontSize="22" fill="#1a7cfa" fillOpacity="0.55"
            fontFamily="serif" filter="url(#noteGlow)">♩</text>
        </g>
        <g style={{ animation: 'noteFloat1 7s ease-in-out infinite 2.2s' }}>
          <text x="68" y="110" fontSize="30" fill="#60a5fa" fillOpacity="0.45"
            fontFamily="serif" filter="url(#noteGlow)">♬</text>
        </g>
        <g style={{ animation: 'noteFloat2 5.5s ease-in-out infinite 0.4s' }}>
          <text x="452" y="310" fontSize="20" fill="#1a7cfa" fillOpacity="0.5"
            fontFamily="serif" filter="url(#noteGlow)">♪</text>
        </g>
        <g style={{ animation: 'noteFloat3 6s ease-in-out infinite 3s' }}>
          <text x="24" y="305" fontSize="24" fill="#3b82f6" fillOpacity="0.4"
            fontFamily="serif" filter="url(#noteGlow)">♫</text>
        </g>
        <g style={{ animation: 'noteFloat1 4.2s ease-in-out infinite 1s' }}>
          <text x="370" y="80" fontSize="18" fill="#1a7cfa" fillOpacity="0.4"
            fontFamily="serif" filter="url(#noteGlow)">♩</text>
        </g>

        {/* ── Floating label badges (like the reference) ─────────────────── */}
        {/* PIANO badge — upper right */}
        <g style={{ animation: 'badgeFloat 7s ease-in-out infinite 0.5s' }}>
          <rect x="336" y="82" width="88" height="26" rx="13"
            fill="#1a7cfa" fillOpacity="0.12" stroke="#1a7cfa" strokeOpacity="0.3" strokeWidth="1" />
          <text x="350" y="99" fontSize="10" fill="#1a7cfa" fontWeight="bold"
            fontFamily="ui-sans-serif, system-ui, sans-serif" letterSpacing="1.5">PIANO</text>
        </g>
        {/* TEORIA badge — left */}
        <g style={{ animation: 'badgeFloat 8s ease-in-out infinite 1.5s' }}>
          <rect x="30" y="160" width="88" height="26" rx="13"
            fill="#1a7cfa" fillOpacity="0.12" stroke="#1a7cfa" strokeOpacity="0.3" strokeWidth="1" />
          <text x="44" y="177" fontSize="10" fill="#1a7cfa" fontWeight="bold"
            fontFamily="ui-sans-serif, system-ui, sans-serif" letterSpacing="1.5">TEORIA</text>
        </g>
        {/* RITMO badge — lower right */}
        <g style={{ animation: 'badgeFloat 6.5s ease-in-out infinite 2.5s' }}>
          <rect x="368" y="218" width="88" height="26" rx="13"
            fill="#1a7cfa" fillOpacity="0.12" stroke="#1a7cfa" strokeOpacity="0.3" strokeWidth="1" />
          <text x="382" y="235" fontSize="10" fill="#1a7cfa" fontWeight="bold"
            fontFamily="ui-sans-serif, system-ui, sans-serif" letterSpacing="1.5">RITMO</text>
        </g>
        {/* VIOLÃO badge — lower left */}
        <g style={{ animation: 'badgeFloat 9s ease-in-out infinite 0.2s' }}>
          <rect x="18" y="410" width="95" height="26" rx="13"
            fill="#1a7cfa" fillOpacity="0.12" stroke="#1a7cfa" strokeOpacity="0.3" strokeWidth="1" />
          <text x="30" y="427" fontSize="10" fill="#1a7cfa" fontWeight="bold"
            fontFamily="ui-sans-serif, system-ui, sans-serif" letterSpacing="1.5">VIOLÃO</text>
        </g>

        {/* ── Right side glow line (edge lighting on figure) ──────────────── */}
        <path
          d="M348,280 Q375,320 376,390 Q377,425 368,448"
          stroke="#1a7cfa" strokeWidth="2" strokeOpacity="0.45"
          strokeLinecap="round" fill="none"
          style={{ filter: 'blur(1px)' }}
        />

        {/* ── Piano keyboard at bottom ────────────────────────────────────── */}
        <g transform="translate(110, 448)">
          {/* White keys */}
          {Array.from({ length: 14 }).map((_, i) => (
            <rect key={i} x={i * 20} y={0} width={18} height={55} rx="2"
              fill="white" stroke="#d1d5db" strokeWidth="0.8"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
            />
          ))}
          {/* Black keys */}
          {[1,2,4,5,6,8,9,11,12,13].map((pos) => (
            <rect key={pos} x={pos * 20 - 6} y={0} width={12} height={34} rx="2"
              fill="#1a2a4a"
            />
          ))}
          {/* Piano glow */}
          <rect x={0} y={0} width={280} height={55} rx="3"
            fill="url(#dress)" fillOpacity="0.08"
          />
        </g>
      </svg>

      {/* ── CSS animations for SVG elements ─────────────────────────────── */}
      <style>{`
        @keyframes noteFloat1 {
          0%, 100% { transform: translateY(0) rotate(-3deg); opacity: 0.75; }
          50%       { transform: translateY(-18px) rotate(3deg); opacity: 1; }
        }
        @keyframes noteFloat2 {
          0%, 100% { transform: translateY(0) rotate(2deg); opacity: 0.6; }
          50%       { transform: translateY(-14px) rotate(-4deg); opacity: 0.9; }
        }
        @keyframes noteFloat3 {
          0%, 100% { transform: translateY(0) rotate(-1deg); opacity: 0.55; }
          50%       { transform: translateY(-22px) rotate(5deg); opacity: 0.8; }
        }
        @keyframes badgeFloat {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}
