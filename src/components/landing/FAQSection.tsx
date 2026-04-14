'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

const FAQS = [
  {
    q: 'O plano gratuito expira?',
    a: 'Não. O plano Grátis é permanente — use com até 3 alunos e 5 aulas por mês sem pagar nada, para sempre.',
  },
  {
    q: 'Como funciona a IA musical?',
    a: 'A Musly IA tem acesso ao histórico real do seu estúdio — alunos, aulas, tópicos e tags de desempenho. Pergunte em linguagem natural: "Como tá o Pedro?" e ela responde com dados reais das últimas aulas.',
  },
  {
    q: 'O que são créditos de IA?',
    a: 'Cada mensagem enviada para a IA custa 1 crédito. Cada plano inclui uma cota mensal renovada automaticamente. Você pode comprar créditos avulsos a qualquer momento se precisar de mais.',
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim. Sem fidelidade, sem multa. Cancele pelo painel quando quiser. Seus dados ficam disponíveis por 30 dias após o cancelamento.',
  },
  {
    q: 'Como funciona o controle financeiro?',
    a: 'Cadastre as mensalidades dos seus alunos, registre pagamentos com um clique e acompanhe sua receita mensal em tempo real — sem planilha, sem papel.',
  },
  {
    q: 'Vai ter suporte para múltiplos professores?',
    a: 'Sim. O plano Studio suportará múltiplos professores no mesmo estúdio. Esta funcionalidade está em desenvolvimento e chega em breve.',
  },
]

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="bg-[#f8fafc] py-28">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">

        <div className="text-center mb-16">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-500">FAQ</p>
          <h2 className="text-4xl font-black leading-tight text-[#0f172a] lg:text-[52px]">
            Perguntas frequentes
          </h2>
          <p className="mt-4 text-slate-500 text-lg max-w-lg mx-auto">
            Tudo que você precisa saber antes de começar.
          </p>
        </div>

        <div className="space-y-2">
          {FAQS.map((faq, i) => {
            const isOpen = open === i
            return (
              <div
                key={i}
                className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                  isOpen
                    ? 'border-brand-200 bg-blue-50/50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <button
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span className="text-[15px] font-semibold text-[#0f172a]">{faq.q}</span>
                  <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
                    isOpen ? 'bg-brand-500 text-white' : 'bg-gray-100 text-slate-500'
                  }`}>
                    {isOpen ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  </span>
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="border-t border-gray-100 px-6 pb-6 pt-4">
                    <p className="text-[14px] leading-relaxed text-slate-600">{faq.a}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
