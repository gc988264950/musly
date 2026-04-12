// MuslyLogo — SVG wordmark component
// Usage: <MuslyLogo size="md" variant="blue" />

interface MuslyLogoProps {
  /** Controls overall height */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** "blue" = blue mark on white/transparent bg, "white" = all white (for dark bg) */
  variant?: 'blue' | 'white'
  className?: string
}

const sizeMap = {
  sm: { h: 20, mark: 20 },
  md: { h: 26, mark: 26 },
  lg: { h: 32, mark: 32 },
  xl: { h: 40, mark: 40 },
}

export function MuslyLogo({ size = 'md', variant = 'blue', className = '' }: MuslyLogoProps) {
  const { h, mark } = sizeMap[size]
  const textColor = variant === 'white' ? '#ffffff' : '#0d1f3c'
  const markColor = '#1a7cfa'

  return (
    <span
      className={`inline-flex items-center gap-2 flex-shrink-0 ${className}`}
      style={{ height: h }}
      aria-label="Musly"
    >
      {/* Music note mark */}
      <svg
        width={mark}
        height={mark}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="8" fill={markColor} />
        {/* Eighth note icon */}
        <path
          d="M20 9v10.27A3.5 3.5 0 1 1 17 16V10l-5 1.2V21.3A3.5 3.5 0 1 1 9 18V10.2L20 9Z"
          fill="white"
        />
      </svg>

      {/* Wordmark */}
      <svg
        height={h}
        viewBox={`0 0 ${Math.round(h * 2.9)} ${h}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ width: 'auto' }}
      >
        <text
          x="0"
          y={h * 0.78}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="700"
          fontSize={h * 0.88}
          letterSpacing="-0.03em"
          fill={textColor}
        >
          Musly
        </text>
      </svg>
    </span>
  )
}

// Compact icon-only variant (just the mark square)
export function MuslyMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Musly"
    >
      <rect width="32" height="32" rx="8" fill="#1a7cfa" />
      <path
        d="M20 9v10.27A3.5 3.5 0 1 1 17 16V10l-5 1.2V21.3A3.5 3.5 0 1 1 9 18V10.2L20 9Z"
        fill="white"
      />
    </svg>
  )
}
