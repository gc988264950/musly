'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'

const instruments = [
  'Piano', 'Violão / Guitarra', 'Violino', 'Canto', 'Bateria / Percussão',
  'Contrabaixo', 'Violoncelo', 'Flauta', 'Saxofone', 'Trompete', 'Outro',
]

export default function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', instrument: '', agreeToTerms: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router   = useRouter()
  const supabase = createClient()

  function validate() {
    const e: Record<string, string> = {}
    if (!formData.firstName.trim()) e.firstName = 'O nome é obrigatório'
    if (!formData.lastName.trim())  e.lastName  = 'O sobrenome é obrigatório'
    if (!formData.email)            e.email     = 'O e-mail é obrigatório'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Informe um e-mail válido'
    if (!formData.password)                   e.password = 'A senha é obrigatória'
    else if (formData.password.length < 8)    e.password = 'A senha deve ter pelo menos 8 caracteres'
    else if (!/[A-Z]/.test(formData.password)) e.password = 'A senha deve conter pelo menos uma letra maiúscula'
    else if (!/[0-9]/.test(formData.password)) e.password = 'A senha deve conter pelo menos um número'
    if (!formData.agreeToTerms) e.agreeToTerms = 'Você deve aceitar os termos para continuar'
    return e
  }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return }
    setErrors({})
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email:    formData.email,
      password: formData.password,
      options: {
        data: {
          firstName:  formData.firstName.trim(),
          lastName:   formData.lastName.trim(),
          instrument: formData.instrument || undefined,
          role:       'professor',
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setErrors({ form: error.message.includes('already registered')
        ? 'Este e-mail já está cadastrado. Faça login.'
        : 'Erro ao criar conta. Tente novamente.' })
      setLoading(false)
      return
    }

    // Redirect to email verification pending page
    router.push(`/auth/verify?email=${encodeURIComponent(formData.email)}`)
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setErrors({ form: 'Erro ao conectar com o Google. Tente novamente.' })
      setGoogleLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {errors.form && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.form}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Nome"
          type="text"
          placeholder="Maria"
          autoComplete="given-name"
          value={formData.firstName}
          onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
          error={errors.firstName}
          leftIcon={<User className="h-4 w-4" />}
        />
        <Input
          label="Sobrenome"
          type="text"
          placeholder="Silva"
          autoComplete="family-name"
          value={formData.lastName}
          onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
          error={errors.lastName}
        />
      </div>

      <Input
        label="E-mail"
        type="email"
        placeholder="voce@estudio.com"
        autoComplete="email"
        value={formData.email}
        onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
        error={errors.email}
        leftIcon={<Mail className="h-4 w-4" />}
      />

      <div>
        <Input
          label="Senha"
          type={showPassword ? 'text' : 'password'}
          placeholder="Mín. 8 caracteres, 1 maiúscula, 1 número"
          autoComplete="new-password"
          value={formData.password}
          onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
          error={errors.password}
          leftIcon={<Lock className="h-4 w-4" />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-gray-400 transition-colors hover:text-gray-600"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
        {formData.password && (() => {
          const strength = getPasswordStrength(formData.password)
          return (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : 'bg-gray-200'}`} />
                ))}
              </div>
              <p className="text-xs text-gray-500">Força da senha: <span className="font-medium">{strength.label}</span></p>
            </div>
          )
        })()}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Instrumento principal{' '}
          <span className="font-normal text-gray-400">(opcional)</span>
        </label>
        <select
          value={formData.instrument}
          onChange={(e) => setFormData((p) => ({ ...p, instrument: e.target.value }))}
          className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Selecione seu instrumento…</option>
          {instruments.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      <div>
        <div className="flex items-start gap-2.5">
          <input
            id="terms"
            type="checkbox"
            checked={formData.agreeToTerms}
            onChange={(e) => setFormData((p) => ({ ...p, agreeToTerms: e.target.checked }))}
            className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-gray-300 accent-blue-600"
          />
          <label htmlFor="terms" className="text-sm text-gray-500">
            Concordo com os{' '}
            <a href="#" className="text-blue-600 hover:underline">Termos de Uso</a>
            {' '}e com a{' '}
            <a href="#" className="text-blue-600 hover:underline">Política de Privacidade</a>
          </label>
        </div>
        {errors.agreeToTerms && (
          <p className="mt-1.5 text-xs text-red-600">{errors.agreeToTerms}</p>
        )}
      </div>

      <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
        {loading ? 'Criando sua conta…' : 'Criar conta grátis'}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs text-gray-400">
          <span className="bg-white px-3">ou cadastre-se com</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-60"
      >
        {googleLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
        ) : (
          <GoogleIcon />
        )}
        {googleLoading ? 'Redirecionando…' : 'Google'}
      </button>
    </form>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}
