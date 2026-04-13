import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Prevents iOS auto-zoom on input focus without disabling manual zoom
  // The real fix is input font-size ≥ 16px (see globals.css)
}

export const metadata: Metadata = {
  title: {
    default: 'Musly — Gestão de Estúdio para Professores de Música',
    template: '%s | Musly',
  },
  description:
    'O Musly é a plataforma completa para professores de música. Gerencie alunos, agende aulas, acompanhe o progresso e receba pagamentos, de forma simples e elegante.',
  keywords: ['professor de música', 'gestão de estúdio', 'agendamento de aulas', 'gestão de alunos'],
  authors: [{ name: 'Musly' }],
  openGraph: {
    type: 'website',
    siteName: 'Musly',
    title: 'Musly — Gestão de Estúdio para Professores de Música',
    description:
      'A plataforma completa para professores de música. Gerencie alunos, agende aulas e receba pagamentos.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
