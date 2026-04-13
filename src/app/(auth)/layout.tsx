import Link from 'next/link'
import { MuslyLogo, MuslyMark } from '@/components/ui/MuslyLogo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh]">
      {/* ── Left panel: branding ── */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#060f22] p-12 text-white lg:flex">
        {/* Glow orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 right-0 h-[500px] w-[500px] rounded-full bg-[#1a7cfa] opacity-[0.08] blur-3xl" />
          <div className="absolute bottom-0 -left-20 h-[400px] w-[400px] rounded-full bg-[#1468d6] opacity-[0.07] blur-3xl" />
        </div>

        {/* Logo */}
        <Link href="/" className="relative">
          <MuslyLogo size="lg" variant="white" />
        </Link>

        {/* Quote */}
        <div className="relative space-y-6">
          <blockquote className="text-2xl font-medium leading-relaxed text-gray-100">
            "Ensinar música é seu dom.{' '}
            <span className="text-[#4a90ff]">
              Administrar não deveria ser um fardo.
            </span>
            "
          </blockquote>
          <p className="text-gray-500">
            Mais de 3.000 professores de música já simplificaram seu estúdio com o Musly.
          </p>

          {/* Social proof avatars */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {['SM', 'JK', 'ML'].map((initials) => (
                <div
                  key={initials}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#060f22] bg-[#1a7cfa] text-xs font-bold text-white"
                >
                  {initials}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500">Utilizado por professores em mais de 40 países</p>
          </div>
        </div>

        {/* Footer */}
        <div className="relative text-xs text-gray-700">
          © {new Date().getFullYear()} Musly. Todos os direitos reservados.
        </div>
      </div>

      {/* ── Right panel: form ── */}
      {/*
        overflow-y-auto: allows the form to scroll when the virtual keyboard
        shrinks the viewport (iOS Safari). dvh on the outer wrapper ensures
        the layout never exceeds the visible area.
      */}
      <div className="flex flex-1 flex-col overflow-y-auto bg-white px-6 py-10 sm:px-12 sm:py-12 lg:px-16">
        <div className="flex flex-1 flex-col justify-center">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <Link href="/">
              <MuslyLogo size="lg" variant="blue" />
            </Link>
          </div>

          <div className="mx-auto w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  )
}
