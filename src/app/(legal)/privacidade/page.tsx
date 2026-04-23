import type { Metadata } from 'next'
import LegalDocument from '../_legalPage'
export const metadata: Metadata = { title: 'Política de Privacidade — Musly' }
export default function Page() { return <LegalDocument file="02-politica-de-privacidade.md" /> }
