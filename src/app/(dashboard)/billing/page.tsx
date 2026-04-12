'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  CreditCard, ChevronLeft, ChevronRight, Check, Plus, TrendingUp,
  Users, AlertCircle, Clock, DollarSign, ArrowUpRight, Edit2, Trash2,
} from 'lucide-react'
import { useFinancial, addMonths, formatCurrency, formatMonth, currentYearMonth } from '@/hooks/useFinancial'
import { getDueDateForMonth, computePaymentStatus } from '@/lib/db/payments'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import type { PaymentStatus, Payment } from '@/lib/db/types'
import { cn, getInitials } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDatePT(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')
}

const statusStyle: Record<PaymentStatus, { badge: string; dot: string; label: string }> = {
  pago:     { badge: 'bg-green-100 text-green-700',   dot: 'bg-green-500',  label: 'Pago' },
  pendente: { badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500', label: 'Pendente' },
  atrasado: { badge: 'bg-red-100 text-red-600',       dot: 'bg-red-500',    label: 'Atrasado' },
}

const avatarGradients = [
  'from-[#1a7cfa] to-[#1468d6]',
  'from-emerald-500 to-teal-600',
  'from-indigo-500 to-blue-600',
  'from-orange-500 to-amber-600',
  'from-[#1057b0] to-[#0d2d5e]',
]

type StatusFilter = 'todos' | PaymentStatus

// ─── Payment Modal ────────────────────────────────────────────────────────────

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  studentName: string
  monthlyFee: number
  dueDayOfMonth: number
  selectedMonth: string
  existingPayment: Payment | null
  onSave: (data: { referenceMonth: string; amount: number; paidAt: string; notes: string }) => void
  saving: boolean
}

function PaymentModal({
  isOpen, onClose, studentName, monthlyFee, dueDayOfMonth, selectedMonth,
  existingPayment, onSave, saving,
}: PaymentModalProps) {
  const [form, setForm] = useState({
    referenceMonth: selectedMonth,
    amount: existingPayment?.amount?.toString() ?? monthlyFee.toString(),
    paidAt: existingPayment?.paidAt ?? new Date().toISOString().split('T')[0],
    notes: existingPayment?.notes ?? '',
  })

  // Reset form when opening
  if (isOpen && form.referenceMonth !== selectedMonth && !existingPayment) {
    setForm({
      referenceMonth: selectedMonth,
      amount: monthlyFee.toString(),
      paidAt: new Date().toISOString().split('T')[0],
      notes: '',
    })
  }

  const dueDate = getDueDateForMonth(dueDayOfMonth, form.referenceMonth)
  const amount = parseFloat(form.amount)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Registrar pagamento — ${studentName}`} size="sm">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Mês de referência *</label>
          <input
            type="month"
            value={form.referenceMonth}
            onChange={(e) => setForm((p) => ({ ...p, referenceMonth: e.target.value }))}
            className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <p className="mt-1 text-xs text-gray-400">Vencimento: {formatDatePT(dueDate)}</p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Valor pago (R$) *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
            className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Data do pagamento *</label>
          <input
            type="date"
            value={form.paidAt}
            onChange={(e) => setForm((p) => ({ ...p, paidAt: e.target.value }))}
            className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Observação <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <input
            type="text"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            placeholder="Ex: Pix, transferência, desconto…"
            className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button
          variant="primary"
          loading={saving}
          disabled={isNaN(amount) || amount <= 0 || !form.paidAt}
          onClick={() => onSave({ referenceMonth: form.referenceMonth, amount, paidAt: form.paidAt, notes: form.notes })}
        >
          <Check className="h-4 w-4" /> {existingPayment ? 'Atualizar' : 'Confirmar pagamento'}
        </Button>
      </div>
    </Modal>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const {
    rows, summary, selectedMonth, setSelectedMonth,
    loading, registerPayment, deletePayment,
  } = useFinancial()

  // ── Filter ────────────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos')

  const filteredRows = useMemo(() => {
    if (statusFilter === 'todos') return rows.filter((r) => r.financial !== null)
    return rows.filter((r) => r.status === statusFilter)
  }, [rows, statusFilter])

  const noSettingsRows = rows.filter((r) => r.financial === null)

  // ── Payment modal ─────────────────────────────────────────────────────────
  const [paymentModal, setPaymentModal] = useState<{
    studentId: string
    studentName: string
    monthlyFee: number
    dueDayOfMonth: number
    existingPayment: Payment | null
  } | null>(null)
  const [savingPayment, setSavingPayment] = useState(false)

  // ── Delete ────────────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<{ payment: Payment; studentName: string } | null>(null)

  function openPaymentModal(row: typeof rows[number]) {
    if (!row.financial) return
    setPaymentModal({
      studentId: row.student.id,
      studentName: row.student.name,
      monthlyFee: row.financial.monthlyFee,
      dueDayOfMonth: row.financial.dueDayOfMonth,
      existingPayment: row.currentPayment,
    })
  }

  function handleSavePayment(data: { referenceMonth: string; amount: number; paidAt: string; notes: string }) {
    if (!paymentModal) return
    setSavingPayment(true)
    try {
      registerPayment({
        studentId: paymentModal.studentId,
        referenceMonth: data.referenceMonth,
        dueDate: getDueDateForMonth(paymentModal.dueDayOfMonth, data.referenceMonth),
        paidAt: data.paidAt,
        amount: data.amount,
        notes: data.notes,
      })
      setPaymentModal(null)
    } finally {
      setSavingPayment(false)
    }
  }

  // ── Navigation helpers ────────────────────────────────────────────────────
  const isCurrentMonth = selectedMonth === currentYearMonth()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  const studentsWithSettings = rows.filter((r) => r.financial !== null)

  return (
    <div className="p-6 lg:p-8 animate-in">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="mt-0.5 text-sm text-gray-500">Gestão de pagamentos e receitas</p>
        </div>

        {/* Month selector */}
        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1">
          <button
            onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[160px] text-center text-sm font-semibold text-gray-900">
            {formatMonth(selectedMonth)}
          </span>
          <button
            onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
            disabled={isCurrentMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {studentsWithSettings.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Nenhuma cobrança configurada"
          description="Configure o valor e vencimento nos perfis dos alunos para começar a gerenciar pagamentos."
          action={
            <Link href="/students">
              <Button variant="primary">
                <Users className="h-4 w-4" /> Ir para Alunos
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* Summary cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {/* Revenue */}
            <div className="xl:col-span-1 rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Receita do mês</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(summary.revenue)}</p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {summary.paidCount > 0
                      ? `${summary.paidCount} pagamento${summary.paidCount !== 1 ? 's' : ''} confirmado${summary.paidCount !== 1 ? 's' : ''}`
                      : 'Nenhum pagamento ainda'}
                  </p>
                </div>
                <div className="rounded-xl bg-green-50 p-3">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
              {summary.forecast > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                    <span>{Math.round((summary.revenue / summary.forecast) * 100)}% da previsão</span>
                    <span>{formatCurrency(summary.forecast)}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100">
                    <div
                      className="h-1.5 rounded-full bg-green-500 transition-all"
                      style={{ width: `${Math.min(100, Math.round((summary.revenue / summary.forecast) * 100))}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Forecast */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Previsão total</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(summary.forecast)}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{summary.totalWithSettings} aluno{summary.totalWithSettings !== 1 ? 's' : ''} com cobrança</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Paid */}
            <div
              className="cursor-pointer rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
              onClick={() => setStatusFilter(statusFilter === 'pago' ? 'todos' : 'pago')}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Pagos</p>
                  <p className="mt-1 text-3xl font-bold text-green-600">{summary.paidCount}</p>
                  <p className="mt-0.5 text-xs text-gray-400">alunos confirmados</p>
                </div>
                <div className="rounded-xl bg-green-50 p-3">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>

            {/* Pending */}
            <div
              className="cursor-pointer rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
              onClick={() => setStatusFilter(statusFilter === 'pendente' ? 'todos' : 'pendente')}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Pendentes</p>
                  <p className="mt-1 text-3xl font-bold text-yellow-600">{summary.pendingCount}</p>
                  <p className="mt-0.5 text-xs text-gray-400">aguardando pagamento</p>
                </div>
                <div className="rounded-xl bg-yellow-50 p-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Overdue */}
            <div
              className={cn(
                'cursor-pointer rounded-2xl border p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover',
                summary.overdueCount > 0 ? 'border-red-100 bg-red-50' : 'border-gray-100 bg-white'
              )}
              onClick={() => setStatusFilter(statusFilter === 'atrasado' ? 'todos' : 'atrasado')}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className={cn('text-xs font-medium', summary.overdueCount > 0 ? 'text-red-500' : 'text-gray-500')}>
                    Atrasados
                  </p>
                  <p className={cn('mt-1 text-3xl font-bold', summary.overdueCount > 0 ? 'text-red-600' : 'text-gray-400')}>
                    {summary.overdueCount}
                  </p>
                  <p className={cn('mt-0.5 text-xs', summary.overdueCount > 0 ? 'text-red-400' : 'text-gray-400')}>
                    após vencimento
                  </p>
                </div>
                <div className={cn('rounded-xl p-3', summary.overdueCount > 0 ? 'bg-red-100' : 'bg-gray-50')}>
                  <AlertCircle className={cn('h-5 w-5', summary.overdueCount > 0 ? 'text-red-600' : 'text-gray-400')} />
                </div>
              </div>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="mb-4 flex gap-2 flex-wrap">
            {([
              { key: 'todos', label: 'Todos', count: studentsWithSettings.length },
              { key: 'pago', label: 'Pagos', count: summary.paidCount },
              { key: 'pendente', label: 'Pendentes', count: summary.pendingCount },
              { key: 'atrasado', label: 'Atrasados', count: summary.overdueCount },
            ] as { key: StatusFilter; label: string; count: number }[]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors',
                  statusFilter === tab.key
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                )}
              >
                {tab.label}
                <span className={cn(
                  'rounded-full px-1.5 py-0.5 text-[11px] font-bold',
                  statusFilter === tab.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Student rows */}
          {filteredRows.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white py-10 text-center">
              <p className="text-sm text-gray-400">Nenhum aluno neste filtro.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-card">
              <div className="divide-y divide-gray-50">
                {filteredRows.map((row, i) => {
                  const { student, financial, currentPayment, status, dueDate } = row
                  if (!financial || !status) return null
                  const style = statusStyle[status]
                  const gradient = avatarGradients[i % avatarGradients.length]

                  return (
                    <div key={student.id} className="group flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50">
                      {/* Avatar */}
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-sm font-bold text-white`}>
                        {getInitials(student.name)}
                      </div>

                      {/* Name + instrument */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/students/${student.id}?tab=financeiro`}
                          className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-sm"
                        >
                          {student.name}
                        </Link>
                        <p className="text-xs text-gray-400">{student.instrument}</p>
                      </div>

                      {/* Fee info */}
                      <div className="hidden sm:block text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(financial.monthlyFee)}</p>
                        <p className="text-xs text-gray-400">
                          {dueDate ? `Vence ${formatDatePT(dueDate)}` : `Dia ${financial.dueDayOfMonth}`}
                        </p>
                      </div>

                      {/* Status badge */}
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold flex-shrink-0', style.badge)}>
                        {style.label}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {status !== 'pago' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => openPaymentModal(row)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Registrar</span>
                          </Button>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="flex items-center gap-1 rounded-xl bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700">
                              <Check className="h-3 w-3" />
                              {currentPayment?.paidAt ? formatDatePT(currentPayment.paidAt) : 'Pago'}
                            </span>
                            <button
                              onClick={() => openPaymentModal(row)}
                              className="rounded-lg p-1.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50 hover:text-blue-500"
                              title="Editar pagamento"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            {currentPayment && (
                              <button
                                onClick={() => setDeleteTarget({ payment: currentPayment, studentName: student.name })}
                                className="rounded-lg p-1.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500"
                                title="Remover pagamento"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                        <Link
                          href={`/students/${student.id}`}
                          className="ml-1 rounded-lg p-1.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 hover:text-gray-600"
                          title="Ver perfil"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Students without billing config notice */}
          {noSettingsRows.length > 0 && statusFilter === 'todos' && (
            <div className="mt-4 rounded-2xl border border-dashed border-gray-200 p-4">
              <p className="text-sm text-gray-500">
                <span className="font-semibold">{noSettingsRows.length} aluno{noSettingsRows.length !== 1 ? 's' : ''}</span>
                {' '}sem cobrança configurada:{' '}
                {noSettingsRows.map((r, i) => (
                  <span key={r.student.id}>
                    <Link href={`/students/${r.student.id}`} className="text-blue-600 hover:underline">
                      {r.student.name}
                    </Link>
                    {i < noSettingsRows.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </p>
            </div>
          )}
        </>
      )}

      {/* Payment modal */}
      {paymentModal && (
        <PaymentModal
          isOpen={!!paymentModal}
          onClose={() => setPaymentModal(null)}
          studentName={paymentModal.studentName}
          monthlyFee={paymentModal.monthlyFee}
          dueDayOfMonth={paymentModal.dueDayOfMonth}
          selectedMonth={selectedMonth}
          existingPayment={paymentModal.existingPayment}
          onSave={handleSavePayment}
          saving={savingPayment}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deletePayment(deleteTarget.payment.id)
            setDeleteTarget(null)
          }
        }}
        title="Remover pagamento"
        description={`Remover o pagamento registrado para ${deleteTarget?.studentName}? O aluno voltará ao status Pendente ou Atrasado.`}
        confirmLabel="Remover pagamento"
      />
    </div>
  )
}
