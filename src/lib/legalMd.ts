/**
 * Minimal Markdown → HTML converter for the Musly legal documents.
 * Handles only the patterns that actually appear in /legal/*.md.
 * Safe because the source is always a repo-controlled file, never user input.
 */

// Internal links between legal documents
const CROSS_LINKS: Record<string, string> = {
  'Termos de Uso':                              '/termos',
  'Política de Privacidade':                    '/privacidade',
  'Política de Privacidade completa':           '/privacidade',
  'Política de Cookies':                        '/cookies',
  'Política de Cancelamento, Reembolso e Cobrança': '/reembolso',
  'Política de Cancelamento':                   '/reembolso',
  'Política de Uso Aceitável':                  '/uso-aceitavel',
  'Política de Conteúdo e Propriedade Intelectual': '/propriedade-intelectual',
  'Canal LGPD':                                 '/lgpd',
  'Política de Resposta a Incidentes':          '/segurança',
  'página de créditos':                         '/credits',
}

function inlineFmt(s: string): string {
  // Bold
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // External markdown links: [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    const ext = url.startsWith('http')
    return `<a href="${url}" class="text-brand-500 hover:underline break-all"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`
  })

  // Internal cross-document references: [Política de Privacidade] → real link
  s = s.replace(/\[([^\]]+)\]/g, (match, text) => {
    const href = CROSS_LINKS[text.trim()]
    if (href) {
      return `<a href="${href}" class="text-brand-500 hover:underline">${text}</a>`
    }
    // Unknown bracketed text — render as-is (should not appear after placeholder cleanup)
    return `<span class="font-medium text-gray-700">${text}</span>`
  })

  // Inline code (backticks)
  s = s.replace(/`([^`]+)`/g, '<code class="rounded bg-gray-100 px-1 py-0.5 font-mono text-sm text-gray-800">$1</code>')

  return s
}

function processTable(rows: string[]): string {
  if (rows.length < 2) return rows.join('\n')
  const headerCells = rows[0]
    .split('|')
    .filter((_, i, a) => i > 0 && i < a.length - 1)
    .map((c) => `<th class="border border-gray-200 bg-gray-50 px-4 py-2 text-left text-sm font-semibold text-gray-700">${inlineFmt(c.trim())}</th>`)
    .join('')
  const thead = `<thead><tr>${headerCells}</tr></thead>`

  const bodyRows = rows.slice(2).map((row) => {
    const cells = row
      .split('|')
      .filter((_, i, a) => i > 0 && i < a.length - 1)
      .map((c) => `<td class="border border-gray-200 px-4 py-2 text-sm text-gray-700 align-top">${inlineFmt(c.trim())}</td>`)
      .join('')
    return `<tr>${cells}</tr>`
  }).join('')

  const tbody = `<tbody>${bodyRows}</tbody>`
  return `<div class="overflow-x-auto my-5"><table class="w-full border-collapse border border-gray-200 text-sm">${thead}${tbody}</table></div>`
}

export function mdToHtml(md: string): string {
  const lines   = md.split('\n')
  const output: string[] = []
  let listOpen: 'ul' | 'ol' | null = null
  let tableRows: string[] = []
  let i = 0

  const flushTable = () => {
    if (tableRows.length) {
      output.push(processTable(tableRows))
      tableRows = []
    }
  }
  const flushList = () => {
    if (listOpen) {
      output.push(`</${listOpen}>`)
      listOpen = null
    }
  }

  while (i < lines.length) {
    const raw  = lines[i]
    const line = raw.trimEnd()

    // Table row detection
    if (line.startsWith('|')) {
      flushList()
      tableRows.push(line)
      i++; continue
    } else {
      flushTable()
    }

    // Heading 1
    if (line.startsWith('# ')) {
      flushList()
      output.push(`<h1 class="text-3xl font-black text-gray-900 mb-2 mt-2">${inlineFmt(line.slice(2))}</h1>`)
      i++; continue
    }
    // Heading 2
    if (line.startsWith('## ')) {
      flushList()
      output.push(`<h2 class="text-xl font-bold text-gray-900 mt-10 mb-3 pb-2 border-b border-gray-100">${inlineFmt(line.slice(3))}</h2>`)
      i++; continue
    }
    // Heading 3
    if (line.startsWith('### ')) {
      flushList()
      output.push(`<h3 class="text-base font-semibold text-gray-900 mt-6 mb-2">${inlineFmt(line.slice(4))}</h3>`)
      i++; continue
    }
    // Horizontal rule
    if (line === '---') {
      flushList()
      output.push('<hr class="border-gray-100 my-8" />')
      i++; continue
    }
    // Unordered list item
    if (line.startsWith('- ')) {
      if (listOpen !== 'ul') {
        flushList()
        output.push('<ul class="list-disc list-outside ml-5 space-y-1 my-3 text-gray-700">')
        listOpen = 'ul'
      }
      output.push(`<li class="text-sm leading-relaxed">${inlineFmt(line.slice(2))}</li>`)
      i++; continue
    }
    // Ordered list item (1. text)
    if (/^\d+\. /.test(line)) {
      if (listOpen !== 'ol') {
        flushList()
        output.push('<ol class="list-decimal list-outside ml-5 space-y-1 my-3 text-gray-700">')
        listOpen = 'ol'
      }
      output.push(`<li class="text-sm leading-relaxed">${inlineFmt(line.replace(/^\d+\. /, ''))}</li>`)
      i++; continue
    }
    // Checkbox list item (- [ ] or - [x])
    if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
      if (listOpen !== 'ul') {
        flushList()
        output.push('<ul class="list-none space-y-1 my-3 text-gray-700">')
        listOpen = 'ul'
      }
      const checked = line.startsWith('- [x]')
      const text = inlineFmt(line.replace(/^- \[[ x]\] /, ''))
      output.push(`<li class="flex items-start gap-2 text-sm leading-relaxed"><span>${checked ? '☑' : '☐'}</span><span>${text}</span></li>`)
      i++; continue
    }
    // Blank line
    if (line.trim() === '') {
      flushList()
      // only add spacing, not a tag
      i++; continue
    }
    // Regular paragraph text
    flushList()
    output.push(`<p class="text-sm leading-relaxed text-gray-700 my-2">${inlineFmt(line)}</p>`)
    i++
  }

  flushList()
  flushTable()
  return output.join('\n')
}
