import type { Metadata } from 'next'
import LoginForm from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Entrar',
}

export default function LoginPage() {
  return (
    <div className="animate-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Bem-vindo de volta</h1>
        <p className="mt-2 text-gray-500">Entre no seu estúdio Musly.</p>
      </div>

      <LoginForm />
    </div>
  )
}
