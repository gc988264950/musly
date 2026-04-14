import Link from 'next/link'
import { Music } from 'lucide-react'

const footerLinks = {
  Produto: [
    { label: 'Funcionalidades', href: '#features' },
    { label: 'Planos e Preços', href: '#pricing' },
    { label: 'IA Musical', href: '#ia' },
    { label: 'Roadmap', href: '#' },
  ],
  Empresa: [
    { label: 'Sobre', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Contato', href: '#' },
    { label: 'FAQ', href: '#faq' },
  ],
  Jurídico: [
    { label: 'Política de Privacidade', href: '#' },
    { label: 'Termos de Uso', href: '#' },
    { label: 'Política de Cookies', href: '#' },
  ],
}

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a7cfa]">
                <Music className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-black text-white">Musly</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/40">
              A plataforma completa de gestão de estúdio para professores de música modernos.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-white/30">{section}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 sm:flex-row">
          <p className="text-sm text-white/30">
            © {new Date().getFullYear()} Musly. Todos os direitos reservados.
          </p>
          <p className="text-sm text-white/30">
            Feito com ♪ para professores de música
          </p>
        </div>
      </div>
    </footer>
  )
}
