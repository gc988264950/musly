import { readFileSync } from 'fs'
import { join }         from 'path'
import { mdToHtml }     from '@/lib/legalMd'

interface Props {
  file:  string   // filename inside /legal/, e.g. '01-termos-de-uso.md'
}

export default function LegalDocument({ file }: Props) {
  const md   = readFileSync(join(process.cwd(), 'legal', file), 'utf-8')
  const html = mdToHtml(md)

  return (
    <article>
      <div
        className="legal-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  )
}
