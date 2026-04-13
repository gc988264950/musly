'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordForm() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || !/\S+@\S+\.\S+/.test(trimmed)) {
      setError('Informe um e-mail válido.')
      return
    }
    setError('')
    setLoading(true)

    const { error: sbError } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    })

    setLoading(false)

    if (sbError) {
      setError('Erro ao enviar o e-mail. Tente novamente.')
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-7 w-7 text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">E-mail enviado!</h2>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            Enviamos um link de redefinição de senha para{' '}
            <strong className="text-gray-800">{email.trim()}</strong>.
            Verifique sua caixa de entrada e também a pasta de spam.
          </p>
          <p className="mt-3 text-xs text-gray-400">
            O link expira em 1 hora.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-[#1468d6]"
        >
          <ArrowLeft size={14} />
          Voltar ao login
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Input
        label="E-mail cadastrado"
        type="email"
        placeholder="voce@estudio.com"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        leftIcon={<Mail className="h-4 w-4" />}
      />

      <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
        {loading ? 'Enviando…' : 'Enviar link de redefinição'}
      </Button>

      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={13} />
          Voltar ao login
        </Link>
      </div>
    </form>
  )
}
