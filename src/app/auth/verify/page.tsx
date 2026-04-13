'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import { MuslyLogo } from '@/components/ui/MuslyLogo'

function VerifyContent() {
  const params = useSearchParams()
  const email  = params.get('email') ?? ''

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mb-8">
        <MuslyLogo size="md" />
      </div>

      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
          <Mail className="h-7 w-7 text-blue-600" />
        </div>

        <h1 className="mb-2 text-xl font-bold text-gray-900">
          Confirme seu e-mail
        </h1>

        <p className="mb-1 text-sm text-gray-500">
          Enviamos um link de confirmação para:
        </p>
        {email && (
          <p className="mb-5 font-semibold text-gray-800">{email}</p>
        )}

        <p className="mb-6 text-sm text-gray-500 leading-relaxed">
          Clique no link do e-mail para ativar sua conta e acessar o Musly.
          Verifique também a caixa de spam.
        </p>

        <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700">
          O link expira em 24 horas. Se não receber, volte ao login e tente novamente.
        </div>
      </div>

      <Link
        href="/login"
        className="mt-6 flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        <ArrowLeft size={14} />
        Voltar ao login
      </Link>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  )
}
