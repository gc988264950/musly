'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, Save, Plus, Trash2, AlertCircle, X, KeyRound, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getUserSettings, saveUserSettings } from '@/lib/db/userSettings'
import { getStudents, updateStudent, applyUpdate as applyStudentUpdate } from '@/lib/db/students'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import type { Student } from '@/lib/db/types'

interface StudentAccount {
  id:              string
  email:           string
  firstName:       string
  lastName:        string
  linkedStudentId: string
  createdAt:       string
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, description, children }: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card className="p-6">
      <div className="mb-5 border-b border-gray-100 pb-4">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
      </div>
      {children}
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, refresh: refreshAuth } = useAuth()

  // Profile fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState('')

  // Teaching method
  const [teachingMethod, setTeachingMethod] = useState('')
  const [methodSaving, setMethodSaving] = useState(false)
  const [methodSaved, setMethodSaved] = useState(false)

  // Student accounts
  const [students, setStudents] = useState<Student[]>([])
  const [accounts, setAccounts] = useState<StudentAccount[]>([])
  const [showAccountForm, setShowAccountForm] = useState(false)
  const [accountStudentId, setAccountStudentId] = useState('')
  const [accountEmail, setAccountEmail] = useState('')
  const [accountPassword, setAccountPassword] = useState('')
  const [accountSaving, setAccountSaving] = useState(false)
  const [accountError, setAccountError] = useState('')
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null)

  // Reset student password
  const [resetTarget,      setResetTarget]      = useState<StudentAccount | null>(null)
  const [resetPassword,    setResetPassword]    = useState('')
  const [showResetPwd,     setShowResetPwd]     = useState(false)
  const [resetSaving,      setResetSaving]      = useState(false)
  const [resetError,       setResetError]       = useState('')
  const [resetSuccess,     setResetSuccess]     = useState(false)

  const reloadAccounts = useCallback(async () => {
    if (!user) return
    const studs = await getStudents(user.id).catch(() => [] as Student[])
    setStudents(studs)
    try {
      const res = await fetch(`/api/admin/list-students?teacherId=${encodeURIComponent(user.id)}`)
      if (res.ok) {
        const data = await res.json()
        setAccounts(data.students ?? [])
      }
    } catch { /* network error — leave accounts unchanged */ }
  }, [user])

  // Load saved settings on mount
  useEffect(() => {
    if (!user) return
    getUserSettings(user.id).then((settings) => {
      setFirstName(settings?.firstName || user.firstName || '')
      setLastName(settings?.lastName  || user.lastName  || '')
      setEmail(settings?.email        || user.email     || '')
      setTeachingMethod(settings?.teachingMethod || '')
    }).catch(() => {})
    reloadAccounts()
  }, [user, reloadAccounts])

  async function handleSaveProfile() {
    if (!user) return
    if (!firstName.trim() || !email.trim()) {
      setProfileError('Nome e e-mail são obrigatórios.')
      return
    }
    setProfileError('')
    setProfileSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        ...(email.trim() !== user.email ? { email: email.trim() } : {}),
        data: {
          firstName: firstName.trim(),
          lastName:  lastName.trim(),
        },
      })
      if (error) throw new Error(error.message)

      await saveUserSettings(user.id, {
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        email:     email.trim(),
        teachingMethod,
      })
      await refreshAuth()
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setProfileSaving(false)
    }
  }

  function handleSaveMethod() {
    if (!user) return
    setMethodSaving(true)
    saveUserSettings(user.id, { teachingMethod })
      .then(() => {
        setMethodSaved(true)
        setTimeout(() => setMethodSaved(false), 3000)
      })
      .catch(() => {})
      .finally(() => setMethodSaving(false))
  }

  async function handleCreateAccount() {
    if (!user) return
    if (!accountStudentId) { setAccountError('Selecione um aluno.'); return }
    if (!accountEmail.trim()) { setAccountError('Informe o e-mail.'); return }
    if (accountPassword.length < 8) { setAccountError('A senha deve ter pelo menos 8 caracteres.'); return }
    if (!/[A-Z]/.test(accountPassword)) { setAccountError('A senha deve conter pelo menos uma letra maiúscula.'); return }
    if (!/[0-9]/.test(accountPassword)) { setAccountError('A senha deve conter pelo menos um número.'); return }
    setAccountError('')
    setAccountSaving(true)
    try {
      const student = students.find((s) => s.id === accountStudentId)
      if (!student) throw new Error('Aluno não encontrado.')
      const emailToUse = accountEmail.trim()

      const res = await fetch('/api/admin/create-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:           emailToUse,
          password:        accountPassword,
          firstName:       student.name.split(' ')[0],
          lastName:        student.name.split(' ').slice(1).join(' ') || '',
          linkedStudentId: student.id,
          teacherId:       user.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao criar conta.')

      if (!student.email) {
        try { updateStudent(applyStudentUpdate(student, { email: emailToUse })) } catch { /* noop */ }
      }
      setAccountStudentId('')
      setAccountEmail('')
      setAccountPassword('')
      setShowAccountForm(false)
      await reloadAccounts()
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : 'Erro ao criar conta.')
    } finally {
      setAccountSaving(false)
    }
  }

  async function handleResetPassword() {
    if (!resetTarget) return
    if (resetPassword.length < 8) { setResetError('A senha deve ter pelo menos 8 caracteres.'); return }
    if (!/[A-Z]/.test(resetPassword)) { setResetError('A senha deve conter pelo menos uma letra maiúscula.'); return }
    if (!/[0-9]/.test(resetPassword)) { setResetError('A senha deve conter pelo menos um número.'); return }
    setResetError('')
    setResetSaving(true)
    try {
      const res = await fetch('/api/admin/reset-student-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resetTarget.id, newPassword: resetPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao alterar senha.')
      setResetSuccess(true)
      setTimeout(() => { setResetTarget(null); setResetPassword(''); setResetSuccess(false) }, 2000)
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Erro ao alterar senha.')
    } finally {
      setResetSaving(false)
    }
  }

  async function handleDeleteAccount(accountId: string) {
    if (!confirm('Excluir esta conta de aluno? O aluno não poderá mais acessar o portal.')) return
    setDeletingAccountId(accountId)
    try {
      const res = await fetch('/api/admin/delete-student', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: accountId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao excluir.')
      await reloadAccounts()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir conta.')
    } finally {
      setDeletingAccountId(null)
    }
  }

  const studentsWithoutAccount = students.filter(
    (s) => !accounts.some((a) => a.linkedStudentId === s.id)
  )

  return (
    <div className="p-6 lg:p-8 animate-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="mt-0.5 text-sm text-gray-500">Gerencie seu perfil e preferências pedagógicas</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <Section
          title="Perfil"
          description="Suas informações pessoais visíveis na plataforma"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Nome *"
                placeholder="Ex: Ana"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Input
                label="Sobrenome"
                placeholder="Ex: Silva"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <Input
              label="E-mail *"
              type="email"
              placeholder="professor@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {profileError && (
              <p className="text-sm text-red-600">{profileError}</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <Button
                variant="primary"
                loading={profileSaving}
                onClick={handleSaveProfile}
              >
                <Save className="h-3.5 w-3.5" />
                Salvar perfil
              </Button>
              {profileSaved && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                  <Check className="h-3.5 w-3.5" /> Salvo!
                </span>
              )}
            </div>
          </div>
        </Section>

        {/* Teaching Method */}
        <Section
          title="Método de Ensino"
          description="Essas informações são usadas pela IA para personalizar os planos de aula gerados"
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <strong>Dica:</strong> Descreva seu estilo pedagógico, métodos favoritos, materiais que usa e abordagem geral. Quanto mais detalhado, melhores serão os planos gerados pela IA.
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Estilo pedagógico e método
              </label>
              <textarea
                rows={6}
                value={teachingMethod}
                onChange={(e) => setTeachingMethod(e.target.value)}
                placeholder={`Exemplos:\n• Uso o método Suzuki para iniciantes e priorizo o aprendizado por imitação\n• Foco em teoria musical desde o início para criar base sólida\n• Prefiro músicas populares para engajar alunos jovens\n• Uso o livro Mikrokosmos de Bartók para piano\n• Abordagem baseada em jazz e improvisação desde o nível intermediário`}
                className="block w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm placeholder-gray-400 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button
                variant="primary"
                loading={methodSaving}
                onClick={handleSaveMethod}
              >
                <Save className="h-3.5 w-3.5" />
                Salvar método
              </Button>
              {methodSaved && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                  <Check className="h-3.5 w-3.5" /> Salvo! A IA usará isso nos próximos planos.
                </span>
              )}
            </div>
          </div>
        </Section>

        {/* Account info */}
        <Section title="Conta">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Conta criada em</p>
                <p className="text-xs text-gray-400">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('pt-BR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* Student accounts */}
        <Section
          title="Contas de Alunos"
          description="Crie acessos para que seus alunos entrem no portal do aluno"
        >
          <div className="space-y-4">
            {/* Existing accounts */}
            {accounts.length > 0 && (
              <div className="space-y-2">
                {accounts.map((account) => {
                  const linkedStudent = students.find((s) => s.id === account.linkedStudentId)
                  const isResetting = resetTarget?.id === account.id
                  return (
                    <div key={account.id} className="rounded-xl border border-gray-100 bg-gray-50">
                      {/* Account row */}
                      <div className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {linkedStudent?.name ?? account.firstName + ' ' + account.lastName}
                          </p>
                          <p className="text-xs text-gray-400">{account.email}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              if (isResetting) {
                                setResetTarget(null); setResetPassword(''); setResetError(''); setResetSuccess(false)
                              } else {
                                setResetTarget(account); setResetPassword(''); setResetError(''); setResetSuccess(false)
                              }
                            }}
                            className={cn(
                              'rounded-lg p-1.5 transition-colors',
                              isResetting
                                ? 'bg-blue-100 text-blue-600'
                                : 'text-gray-400 hover:bg-blue-50 hover:text-blue-500'
                            )}
                            title="Alterar senha"
                          >
                            <KeyRound size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(account.id)}
                            disabled={deletingAccountId === account.id}
                            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                            title="Excluir conta"
                          >
                            {deletingAccountId === account.id
                              ? <div className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" />
                              : <Trash2 size={15} />
                            }
                          </button>
                        </div>
                      </div>

                      {/* Inline reset-password form */}
                      {isResetting && (
                        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
                          <p className="text-xs font-semibold text-gray-700">Definir nova senha</p>

                          {resetSuccess ? (
                            <div className="flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-3 py-2">
                              <Check size={14} className="text-green-600 flex-shrink-0" />
                              <p className="text-xs text-green-700">Senha alterada com sucesso!</p>
                            </div>
                          ) : (
                            <>
                              <div className="relative">
                                <Input
                                  label=""
                                  type={showResetPwd ? 'text' : 'password'}
                                  placeholder="Mín. 8 caracteres, 1 maiúscula, 1 número"
                                  value={resetPassword}
                                  onChange={(e) => setResetPassword(e.target.value)}
                                  rightElement={
                                    <button
                                      type="button"
                                      onClick={() => setShowResetPwd((v) => !v)}
                                      className="text-gray-400 hover:text-gray-600"
                                      aria-label={showResetPwd ? 'Ocultar senha' : 'Mostrar senha'}
                                    >
                                      {showResetPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                  }
                                />
                              </div>

                              {resetError && (
                                <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2">
                                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-red-500" />
                                  <p className="text-xs text-red-700">{resetError}</p>
                                </div>
                              )}

                              <div className="flex items-center gap-2">
                                <Button
                                  variant="primary"
                                  loading={resetSaving}
                                  onClick={handleResetPassword}
                                  className="text-xs py-1.5 px-3 h-auto"
                                >
                                  <KeyRound size={13} />
                                  Salvar nova senha
                                </Button>
                                <button
                                  type="button"
                                  onClick={() => { setResetTarget(null); setResetPassword(''); setResetError('') }}
                                  className="text-xs text-gray-400 hover:text-gray-600"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {accounts.length === 0 && !showAccountForm && (
              <p className="text-sm text-gray-400">Nenhuma conta de aluno criada ainda.</p>
            )}

            {/* Create form */}
            {showAccountForm ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">Nova conta de aluno</p>
                  <button
                    onClick={() => { setShowAccountForm(false); setAccountError('') }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Aluno *</label>
                  <select
                    value={accountStudentId}
                    onChange={(e) => {
                      const id = e.target.value
                      setAccountStudentId(id)
                      // Auto-populate email from student profile
                      const selected = studentsWithoutAccount.find((s) => s.id === id)
                      if (selected?.email) setAccountEmail(selected.email)
                    }}
                    className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Selecione um aluno…</option>
                    {studentsWithoutAccount.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {studentsWithoutAccount.length === 0 && (
                    <p className="mt-1 text-xs text-gray-400">
                      Todos os alunos já possuem conta vinculada.
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    label="E-mail de acesso *"
                    type="email"
                    placeholder="aluno@email.com"
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                  />
                  {accountStudentId && studentsWithoutAccount.find((s) => s.id === accountStudentId)?.email && (
                    <p className="mt-1 text-xs text-green-600">
                      E-mail preenchido automaticamente do perfil do aluno.
                    </p>
                  )}
                </div>

                <Input
                  label="Senha (mín. 8 car., 1 maiúscula, 1 número) *"
                  type="password"
                  placeholder="••••••••"
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                />

                {accountError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-red-500" />
                    <p className="text-xs text-red-700">{accountError}</p>
                  </div>
                )}

                <Button
                  variant="primary"
                  loading={accountSaving}
                  onClick={handleCreateAccount}
                  disabled={studentsWithoutAccount.length === 0}
                >
                  <Plus size={14} />
                  Criar conta
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setShowAccountForm(true)}
                className="flex items-center gap-2 rounded-xl border border-dashed border-gray-200 px-4 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 w-full"
              >
                <Plus size={15} />
                Criar conta para um aluno
              </button>
            )}
          </div>
        </Section>
      </div>
    </div>
  )
}
