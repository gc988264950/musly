'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, Music } from 'lucide-react'

const navLinks = [
  { label: 'Funcionalidades', href: '#features' },
  { label: 'IA Musical',      href: '#ia'       },
  { label: 'Planos',          href: '#pricing'  },
  { label: 'FAQ',             href: '#faq'      },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled,   setScrolled]   = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
          : 'bg-white/80 backdrop-blur-sm border-b border-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 shadow-brand transition-transform duration-200 group-hover:scale-105">
              <Music className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-black text-[#0f172a] tracking-tight">Musly</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-gray-50 hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth buttons */}
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-gray-50 hover:text-slate-900"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-brand transition-all duration-200 hover:bg-brand-600 hover:shadow-brand-lg"
            >
              Criar conta grátis
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-gray-100 hover:text-slate-900 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Abrir menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 pb-5 pt-3 md:hidden shadow-lg">
          <nav className="flex flex-col gap-0.5 mb-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-gray-50 hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-2 border-t border-gray-100 pt-4">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-3.5 py-2.5 text-center text-sm font-medium text-slate-600 transition-colors hover:bg-gray-50"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl bg-brand-500 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-brand"
            >
              Criar conta grátis
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
