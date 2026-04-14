'use client'

import { useEffect, useRef, useState } from 'react'

interface FadeInProps {
  children: React.ReactNode
  className?: string
  delay?: number       // ms delay before starting the animation
  direction?: 'up' | 'left' | 'right' | 'none'
  duration?: number    // ms duration (default 700)
}

/**
 * Wraps children in a div that fades in (optionally slides) when scrolled into view.
 * Uses IntersectionObserver — zero layout shift before trigger.
 */
export default function FadeIn({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  duration = 700,
}: FadeInProps) {
  const ref  = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const translateMap = {
    up:    'translateY(28px)',
    left:  'translateX(-28px)',
    right: 'translateX(28px)',
    none:  'none',
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'none' : translateMap[direction],
        transition: `opacity ${duration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms,
                     transform ${duration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}
