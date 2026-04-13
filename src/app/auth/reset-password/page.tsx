'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MuslyLogo } from '@/components/ui/MuslyLogo'
import { createClient } from '@/lib/supabase/client'

function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  let score = 0
  if (pwd.length >= 8)           score++
  if (pwd.length >= 12)          score++
  if (/[A-Z]/.test(pwd))         score++
  if (/[0-9]/.test(pwd))         score++
  if (/[^A-Za-z0-9]/.test(pwd))  score++
  if (score <= 1) return { score, label: 'Muito fraca', color: 'bg-red-500' }
  if (score === 2) return { score, label: 'Fraca',      color: 'bg-orange-500' }
  if (score === 3) return { score, label: 'Razoável',   color: 'bg-yellow-500' }
  if (score === 4) return { score, label: 'Boa',        color: 'bg-blue-500' }
  return { score, label: 'Forte', color: 'bg-green-500' }
}

export default function ResetPasswordPage() {
  const [password,     setPassword]     = useState('')
  const [confirm,      setConfirm]      = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [done,         setDone]         = useState(false)
  const [error,        setError]        = useState('')
  const [ready,        setReady]        = useState(false)
  const router  = useRouter()
  const supabase = createClient()

  // Wait for Supabase to exchange the recovery token from the URL hash
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true)
      }
    })
    // Also check if there's already a session (came from callback redirect)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  function validate(): string {
    if (!password) return 'A nova senha é obrigatória.'
    if (password.length < 8) return 'A senha deve ter pelo menos 8 caracteres.'
    if (!/[A-Z]/.test(password)) return 'A senha deve conter pelo menos uma letra maiúscula.'
    if (!/[0-9]/.test(password)) return 'A senha deve conter pelo menos um número.'
    if (password !== confirm) return 'As senhas não coincidem.'
    return ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const msg = validate()
    if (msg) { setError(msg); return }
    setError('')
    setLoading(true)

    const { error: sbError } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (sbError) {
      setError(sbError.message.includes('same password')
        ? 'A nova senha não pode ser igual à senha atual.'
        : 'Erro ao atualizar a senha. O link pode ter expirado.')
      return
    }

    setDone(true)
    // Sign out after reset so user logs in fresh
    await supabase.auth.signOut()
    setTimeout(() => router.push('/login'), 3000)
  }

  const strength = password ? getPasswordStrength(password) : null

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="mb-8"><MuslyLogo size="md" /></div>
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-gray-900">Senha atualizada!</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Sua senha foi redefinida com sucesso. Você será redirecionado para o login em instantes.
          </p>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="mb-8"><MuslyLogo size="md" /></div>
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Verificando link de redefinição…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mb-8"><MuslyLogo size="md" /></div>

      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Redefinir senha</h1>
          <p className="mt-1 text-sm text-gray-500">Escolha uma senha forte para sua conta Musly.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <Input
              label="Nova senha"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mín. 8 caracteres, 1 maiúscula, 1 número"
              autoComplete="new-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            {strength && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Força: <span className="font-medium">{strength.label}</span>
                </p>
              </div>
            )}
          </div>

          <Input
            label="Confirmar nova senha"
            type={showPassword ? 'text' : 'password'}
            placeholder="Repita a nova senha"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            leftIcon={<Lock className="h-4 w-4" />}
          />

          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
            {loading ? 'Salvando…' : 'Redefinir senha'}
          </Button>
        </form>
      </div>
    </div>
  )
}
