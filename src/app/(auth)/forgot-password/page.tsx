import type { Metadata } from 'next'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Recuperar senha',
}

export default function ForgotPasswordPage() {
  return (
    <div className="animate-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Esqueceu a senha?</h1>
        <p className="mt-2 text-gray-500">
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </p>
      </div>

      <ForgotPasswordForm />
    </div>
  )
}
