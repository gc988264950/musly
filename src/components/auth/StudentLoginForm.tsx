'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, GraduationCap, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'

export default function StudentLoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors,   setErrors]   = useState<Record<string, string>>({})
  const router   = useRouter()
  const supabase = createClient()

  function validate() {
    const e: Record<string, string> = {}
    if (!formData.email) e.email = 'O e-mail é obrigatório'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Informe um e-mail válido'
    if (!formData.password) e.password = 'A senha é obrigatória'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return }
    setErrors({})
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email:    formData.email,
      password: formData.password,
    })

    if (error) {
      setErrors({ form: 'E-mail ou senha incorretos. Verifique suas credenciais.' })
      setLoading(false)
      return
    }

    const role = data.user?.user_metadata?.role ?? 'professor'
    if (role !== 'aluno') {
      setErrors({ form: 'Este acesso é exclusivo para alunos. Professores devem usar o login principal.' })
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    router.push('/student/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {errors.form && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.form}
        </div>
      )}

      <div className="flex items-center gap-3 rounded-xl border border-[#b0d2ff]/50 bg-[#eef5ff] px-4 py-3">
        <GraduationCap className="h-5 w-5 flex-shrink-0 text-[#1a7cfa]" />
        <p className="text-sm text-[#1057b0]">
          Portal exclusivo para alunos. Suas credenciais foram enviadas pelo seu professor.
        </p>
      </div>

      <Input
        label="E-mail"
        type="email"
        placeholder="seu@email.com"
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
          placeholder="Sua senha"
          autoComplete="current-password"
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

        {/* Forgot password — students must contact their teacher */}
        <ForgotPasswordNote />
      </div>

      <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
        {loading ? 'Entrando…' : 'Entrar no portal'}
      </Button>

      <p className="text-center text-sm text-gray-500">
        É professor?{' '}
        <Link href="/login" className="font-semibold text-blue-600 transition-colors hover:text-[#1468d6]">
          Acessar como professor
        </Link>
      </p>
    </form>
  )
}

// ─── Forgot password note for students ───────────────────────────────────────

function ForgotPasswordNote() {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        Esqueci minha senha
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 leading-relaxed">
          <strong>Para redefinir sua senha, entre em contato com seu professor.</strong>
          <br />
          O professor pode alterar suas credenciais de acesso diretamente pelo painel deles.
        </div>
      )}
    </div>
  )
}
