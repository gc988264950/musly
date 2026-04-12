import type { Metadata } from 'next'
import Link from 'next/link'
import SignupForm from '@/components/auth/SignupForm'

export const metadata: Metadata = {
  title: 'Criar conta',
}

export default function SignupPage() {
  return (
    <div className="animate-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Crie seu estúdio</h1>
        <p className="mt-2 text-gray-500">Grátis — sem necessidade de cartão de crédito.</p>
      </div>

      <SignupForm />

      <p className="mt-6 text-center text-sm text-gray-500">
        Já tem uma conta?{' '}
        <Link
          href="/login"
          className="font-semibold text-blue-600 transition-colors hover:text-[#1468d6]"
        >
          Entrar
        </Link>
      </p>
    </div>
  )
}
