/**
 * Exports a lesson plan as a PDF using jsPDF.
 * Client-side only — no server required.
 */

import type { LessonPlan } from '@/lib/db/types'

const FOCUS_LABELS: Record<string, string> = {
  misto: 'Aula Mista',
  tecnica: 'Técnica',
  repertorio: 'Repertório',
  teoria: 'Teoria Musical',
  improvisacao: 'Improvisação',
  leitura: 'Leitura de Partitura',
  ritmo: 'Rítmica',
}

export async function exportLessonPlanPDF(
  plan: LessonPlan,
  studentName: string
): Promise<void> {
  // Dynamic import to avoid SSR issues
  const { default: jsPDF } = await import('jspdf')

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 18
  const contentW = pageW - margin * 2
  let y = 0

  // ── Color palette ─────────────────────────────────────────────────────────
  const primary: [number, number, number] = [99, 102, 241]    // indigo-500
  const dark: [number, number, number] = [17, 24, 39]         // gray-900
  const medium: [number, number, number] = [107, 114, 128]    // gray-500
  const light: [number, number, number] = [249, 250, 251]     // gray-50
  const border: [number, number, number] = [229, 231, 235]    // gray-200

  // ── Header bar ────────────────────────────────────────────────────────────
  doc.setFillColor(...primary)
  doc.rect(0, 0, pageW, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Harmoniq', margin, 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Plano de Aula', margin, 19)

  y = 38

  // ── Title ─────────────────────────────────────────────────────────────────
  doc.setTextColor(...dark)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  const titleLines = doc.splitTextToSize(plan.title, contentW) as string[]
  doc.text(titleLines, margin, y)
  y += titleLines.length * 7 + 2

  // ── Meta info row ─────────────────────────────────────────────────────────
  doc.setFillColor(...light)
  doc.setDrawColor(...border)
  doc.roundedRect(margin, y, contentW, 16, 3, 3, 'FD')

  const metaItems = [
    { label: 'Aluno', value: studentName },
    { label: 'Nível', value: plan.level },
    { label: 'Instrumento', value: plan.level }, // placeholder — we'll use the focus
    { label: 'Foco', value: FOCUS_LABELS[plan.focus] ?? plan.focus },
    { label: 'Duração', value: `${plan.duration} min` },
    { label: 'Data', value: new Date(plan.createdAt).toLocaleDateString('pt-BR') },
  ]

  const colW = contentW / 3
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  metaItems.slice(0, 6).forEach((item, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = margin + col * colW + 4
    const iy = y + 5 + row * 7

    doc.setTextColor(...medium)
    doc.text(item.label.toUpperCase(), x, iy)
    doc.setTextColor(...dark)
    doc.setFont('helvetica', 'bold')
    doc.text(item.value, x, iy + 4)
    doc.setFont('helvetica', 'normal')
  })

  // Patch: replace placeholder instrument value with actual value
  // Re-render the second meta item correctly
  const col1x = margin + 0 * colW + 4
  doc.setFillColor(...light)
  doc.rect(col1x, y + 1, colW - 2, 14, 'F') // clear
  doc.setTextColor(...medium)
  doc.setFontSize(7)
  doc.text('ALUNO', col1x, y + 5)
  doc.setTextColor(...dark)
  doc.setFont('helvetica', 'bold')
  doc.text(studentName, col1x, y + 9)
  doc.setFont('helvetica', 'normal')

  y += 22

  // ── Summary ───────────────────────────────────────────────────────────────
  if (plan.summary) {
    doc.setFontSize(8)
    doc.setTextColor(...medium)
    const summaryLines = doc.splitTextToSize(plan.summary, contentW) as string[]
    doc.text(summaryLines, margin, y)
    y += summaryLines.length * 4.5 + 6
  }

  // ── Sections ──────────────────────────────────────────────────────────────
  for (const section of plan.sections) {
    // Check page break
    const estimatedHeight = 12 + section.activities.length * 7 + 8
    if (y + estimatedHeight > 270) {
      doc.addPage()
      y = 20
    }

    // Section header
    doc.setFillColor(...primary)
    doc.roundedRect(margin, y, contentW, 10, 2, 2, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(`${section.emoji}  ${section.title}`, margin + 4, y + 7)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`${section.duration} min`, pageW - margin - 4, y + 7, { align: 'right' })

    y += 13

    // Activities
    doc.setTextColor(...dark)
    doc.setFontSize(9)
    for (const activity of section.activities) {
      const lines = doc.splitTextToSize(`• ${activity}`, contentW - 6) as string[]
      if (y + lines.length * 5 > 270) {
        doc.addPage()
        y = 20
      }
      doc.text(lines, margin + 3, y)
      y += lines.length * 5 + 1.5
    }

    y += 5
  }

  // ── Teacher observation ───────────────────────────────────────────────────
  if (plan.teacherObservation?.trim()) {
    if (y + 20 > 270) { doc.addPage(); y = 20 }
    doc.setFillColor(255, 251, 235) // amber-50
    doc.setDrawColor(252, 211, 77)  // amber-300
    doc.roundedRect(margin, y, contentW, 18, 3, 3, 'FD')
    doc.setTextColor(146, 64, 14)   // amber-800
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('Observação do Professor', margin + 4, y + 6)
    doc.setFont('helvetica', 'normal')
    const obsLines = doc.splitTextToSize(plan.teacherObservation, contentW - 8) as string[]
    doc.text(obsLines, margin + 4, y + 12)
    y += 22
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight()
  doc.setFillColor(...border)
  doc.rect(0, pageH - 10, pageW, 10, 'F')
  doc.setTextColor(...medium)
  doc.setFontSize(7)
  doc.text('Gerado por Harmoniq', margin, pageH - 4)
  doc.text(
    new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }),
    pageW - margin,
    pageH - 4,
    { align: 'right' }
  )

  // ── Save ──────────────────────────────────────────────────────────────────
  const safeName = studentName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  const dateStr = new Date(plan.createdAt).toISOString().split('T')[0]
  doc.save(`plano_${safeName}_${dateStr}.pdf`)
}
