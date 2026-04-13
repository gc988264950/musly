import type { Metadata } from 'next'
import StudentLoginForm from '@/components/auth/StudentLoginForm'

export const metadata: Metadata = {
  title: 'Portal do Aluno',
}

export default function StudentLoginPage() {
  return (
    <div className="animate-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Portal do Aluno</h1>
        <p className="mt-2 text-gray-500">
          Entre com as credenciais fornecidas pelo seu professor.
        </p>
      </div>

      <StudentLoginForm />
    </div>
  )
}
