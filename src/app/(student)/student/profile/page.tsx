'use client'

import { useMemo } from 'react'
import { User, Music, GraduationCap, Mail, Phone } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getStudentById } from '@/lib/db/students'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentProfilePage() {
  const { user } = useAuth()
  const linkedStudentId = user?.linkedStudentId

  const student = useMemo(
    () => (linkedStudentId ? getStudentById(linkedStudentId) : null),
    [linkedStudentId]
  )

  if (!student) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
          <User className="mx-auto mb-3 h-12 w-12 text-gray-200" />
          <p className="text-sm font-medium text-gray-500">Perfil não encontrado</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 animate-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="mt-0.5 text-sm text-gray-500">Suas informações na plataforma</p>
      </div>

      {/* Identity card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl text-white text-xl font-bold"
            style={{ backgroundColor: student.color }}
          >
            {student.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{student.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Music size={13} className="text-gray-400" />
                {student.instrument}
              </span>
              <span className="text-gray-200">·</span>
              <span className="flex items-center gap-1">
                <GraduationCap size={13} className="text-gray-400" />
                {student.level}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact info */}
      {(student.email || student.phone) && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Contato</h2>
          {student.email && (
            <div className="flex items-center gap-3 text-sm">
              <Mail size={16} className="text-gray-400" />
              <span className="text-gray-700">{student.email}</span>
            </div>
          )}
          {student.phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone size={16} className="text-gray-400" />
              <span className="text-gray-700">{student.phone}</span>
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-400">
        Membro desde{' '}
        {new Date(student.createdAt).toLocaleDateString('pt-BR', {
          day: 'numeric', month: 'long', year: 'numeric',
        })}
      </div>
    </div>
  )
}
