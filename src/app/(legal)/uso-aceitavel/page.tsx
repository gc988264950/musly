import type { Metadata } from 'next'
import LegalDocument from '../_legalPage'
export const metadata: Metadata = { title: 'Uso Aceitável — Musly' }
export default function Page() { return <LegalDocument file="05-politica-de-uso-aceitavel.md" /> }
