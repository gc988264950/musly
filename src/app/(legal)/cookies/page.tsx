import type { Metadata } from 'next'
import LegalDocument from '../_legalPage'
export const metadata: Metadata = { title: 'Política de Cookies — Musly' }
export default function Page() { return <LegalDocument file="03-politica-de-cookies.md" /> }
