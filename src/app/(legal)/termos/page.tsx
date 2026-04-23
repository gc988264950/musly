import type { Metadata } from 'next'
import LegalDocument from '../_legalPage'
export const metadata: Metadata = { title: 'Termos de Uso — Musly' }
export default function Page() { return <LegalDocument file="01-termos-de-uso.md" /> }
