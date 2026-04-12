'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { signUp } from '@/lib/mock-auth'
import { useAuth } from '@/contexts/AuthContext'

const instruments = [
  'Piano',
  'Violão / Guitarra',
  'Violino',
  'Canto',
  'Bateria / Percussão',
  'Contrabaixo',
  'Violoncelo',
  'Flauta',
  'Saxofone',
  'Trompete',
  'Outro',
]

export default function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    instrument: '',
    agreeToTerms: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const { refresh } = useAuth()

  function validate() {
    const e: Record<string, string> = {}
    if (!formData.firstName.trim()) e.firstName = 'O nome é obrigatório'
    if (!formData.lastName.trim()) e.lastName = 'O sobrenome é obrigatório'
    if (!formData.email) e.email = 'O e-mail é obrigatório'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Informe um e-mail válido'
    if (!formData.password) e.password = 'A senha é obrigatória'
    else if (formData.password.length < 8) e.password = 'A senha deve ter pelo menos 8 caracteres'
    if (!formData.agreeToTerms) e.agreeToTerms = 'Você deve aceitar os termos para continuar'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})
    setLoading(true)

    try {
      signUp({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        instrument: formData.instrument || undefined,
      })
      refresh()
      router.push('/dashboard')
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : 'Erro ao criar conta. Tente novamente.',
      })
      setLoading(false)
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

      <Input
        label="Senha"
        type={showPassword ? 'text' : 'password'}
        placeholder="Mínimo 8 caracteres"
        autoComplete="new-password"
        value={formData.password}
        onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
        error={errors.password}
        hint={!errors.password ? 'Use pelo menos 8 caracteres' : undefined}
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

      {/* Instrument */}
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
          {instruments.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </div>

      {/* Terms */}
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
            <a href="#" className="text-blue-600 hover:underline">
              Termos de Uso
            </a>{' '}
            e com a{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Política de Privacidade
            </a>
          </label>
        </div>
        {errors.agreeToTerms && (
          <p className="mt-1.5 text-xs text-red-600">{errors.agreeToTerms}</p>
        )}
      </div>

      <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
        {loading ? 'Criando seu estúdio…' : 'Criar conta grátis'}
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
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
      >
        <GoogleIcon />
        Google
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
