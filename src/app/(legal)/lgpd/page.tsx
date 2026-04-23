import type { Metadata } from 'next'
import LegalDocument from '../_legalPage'
export const metadata: Metadata = { title: 'Direitos LGPD — Musly' }
export default function Page() { return <LegalDocument file="07-canal-lgpd-direitos-do-titular.md" /> }
