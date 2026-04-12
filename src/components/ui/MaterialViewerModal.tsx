'use client'

/**
 * MaterialViewerModal — fullscreen interactive material viewer.
 *
 * Annotation tools (teacher-only):
 *   pen · highlighter · circle · text · eraser · clear
 *   with color presets and three stroke thicknesses.
 *
 * Persistence: annotations saved per fileId+page in localStorage.
 *
 * Key fix carried from previous version:
 *   The annotation canvas lives inside a {!loading && …} block.
 *   Using a state-based callback ref (useState setter as ref=) ensures the
 *   drawing useEffect re-runs the moment the canvas actually mounts.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import {
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Pencil, Eraser, Trash2, Loader2, BookOpen,
  Highlighter, Circle, Type,
} from 'lucide-react'
import { getFileBlob } from '@/lib/db/fileStorage'
import type { StudentFile } from '@/lib/db/types'
import { cn } from '@/lib/utils'

// ─── PDF.js worker ────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
}

// ─── Annotation persistence ───────────────────────────────────────────────

const annotKey = (fileId: string, page: number) =>
  `harmoniq_annotations_${fileId}_${page}`

function persistAnnotation(fileId: string, page: number, canvas: HTMLCanvasElement) {
  try { localStorage.setItem(annotKey(fileId, page), canvas.toDataURL()) } catch { /* quota */ }
}

function restoreAnnotation(fileId: string, page: number, canvas: HTMLCanvasElement) {
  const saved = localStorage.getItem(annotKey(fileId, page))
  if (!saved) return
  const img = new Image()
  img.onload = () =>
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
  img.src = saved
}

function dropAnnotation(fileId: string, page: number) {
  localStorage.removeItem(annotKey(fileId, page))
}

// ─── Tool config ──────────────────────────────────────────────────────────

type Tool = 'pen' | 'highlighter' | 'circle' | 'text' | 'eraser'

const TOOLS: { id: Tool; icon: React.ElementType; label: string }[] = [
  { id: 'pen',         icon: Pencil,      label: 'Caneta'     },
  { id: 'highlighter', icon: Highlighter, label: 'Grifar'     },
  { id: 'circle',      icon: Circle,      label: 'Círculo'    },
  { id: 'text',        icon: Type,        label: 'Texto'      },
  { id: 'eraser',      icon: Eraser,      label: 'Borracha'   },
]

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#000000', // black
  '#ffffff', // white
]

const STROKE_WIDTHS: Record<'sm' | 'md' | 'lg', number> = { sm: 2, md: 5, lg: 10 }

type StrokeSize = 'sm' | 'md' | 'lg'

// ─── Props ────────────────────────────────────────────────────────────────

export interface MaterialViewerModalProps {
  file: StudentFile
  /** Pass false for student view — hides all annotation controls. */
  isTeacher: boolean
  onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────

export function MaterialViewerModal({ file, isTeacher, onClose }: MaterialViewerModalProps) {
  const isPDF     = file.mimeType === 'application/pdf'
  const isImage   = file.mimeType.startsWith('image/')
  const canAnnotate = isTeacher && (isPDF || isImage)

  // ── Core state ───────────────────────────────────────────────────────
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [rendering, setRendering] = useState(false)

  // ── PDF state ────────────────────────────────────────────────────────
  const [pdfDoc,      setPdfDoc]      = useState<PDFDocumentProxy | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages,  setTotalPages]  = useState(0)
  const [scale,       setScale]       = useState(1.3)

  // ── Annotation state ─────────────────────────────────────────────────
  const [tool,        setTool]       = useState<Tool>('pen')
  const [color,       setColor]      = useState('#ef4444')
  const [strokeSize,  setStrokeSize] = useState<StrokeSize>('md')
  const [textInput, setTextInput] = useState<{
    canvasX: number; canvasY: number; cssX: number; cssY: number; value: string
  } | null>(null)

  // ── Canvas refs ──────────────────────────────────────────────────────
  const pdfCanvasRef  = useRef<HTMLCanvasElement>(null)
  const imageRef      = useRef<HTMLImageElement>(null)
  const renderTaskRef = useRef<RenderTask | null>(null)

  // STATE-BASED callback ref: annotCanvas updates trigger dependent effects
  const [annotCanvas, setAnnotCanvas] = useState<HTMLCanvasElement | null>(null)

  // ── Mutable refs for event-handler closures ───────────────────────────
  const toolRef        = useRef<Tool>('pen')
  const colorRef       = useRef('#ef4444')
  const strokeSizeRef  = useRef<StrokeSize>('md')
  const currentPageRef = useRef(1)
  const fileIdRef      = useRef(file.id)
  // Circle preview
  const circleStartRef    = useRef<{ x: number; y: number } | null>(null)
  const circleSnapshotRef = useRef<ImageData | null>(null)

  useEffect(() => { toolRef.current        = tool        }, [tool])
  useEffect(() => { colorRef.current       = color       }, [color])
  useEffect(() => { strokeSizeRef.current  = strokeSize  }, [strokeSize])
  useEffect(() => { currentPageRef.current = currentPage }, [currentPage])
  useEffect(() => { fileIdRef.current      = file.id     }, [file.id])

  // ── Load blob from IndexedDB ─────────────────────────────────────────
  useEffect(() => {
    let url: string | null = null
    async function load() {
      try {
        setLoading(true)
        const blob = await getFileBlob(file.id)
        if (!blob) { setError('Arquivo não encontrado no armazenamento local.'); return }
        url = URL.createObjectURL(new Blob([blob], { type: file.mimeType }))
        setObjectUrl(url)
        if (isPDF) {
          const doc = await pdfjsLib.getDocument(url).promise
          setPdfDoc(doc); setTotalPages(doc.numPages)
        }
      } catch {
        setError('Não foi possível carregar o arquivo.')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [file.id, file.mimeType, isPDF])

  // ── Render PDF page ──────────────────────────────────────────────────
  const renderPage = useCallback(async (doc: PDFDocumentProxy, pageNum: number, sc: number) => {
    const pdfCanvas = pdfCanvasRef.current
    if (!pdfCanvas || !annotCanvas) return
    setRendering(true)
    try {
      if (renderTaskRef.current) { renderTaskRef.current.cancel(); renderTaskRef.current = null }
      const page = await doc.getPage(pageNum)
      const viewport = page.getViewport({ scale: sc })
      pdfCanvas.width = viewport.width;  pdfCanvas.height = viewport.height
      annotCanvas.width = viewport.width; annotCanvas.height = viewport.height
      const task = page.render({ canvasContext: pdfCanvas.getContext('2d')!, viewport })
      renderTaskRef.current = task
      await task.promise
      restoreAnnotation(file.id, pageNum, annotCanvas)
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'RenderingCancelledException')
        console.error('[MaterialViewer]', err)
    } finally { setRendering(false) }
  }, [file.id, annotCanvas])

  useEffect(() => {
    if (!pdfDoc || !annotCanvas) return
    renderPage(pdfDoc, currentPage, scale)
  }, [pdfDoc, currentPage, scale, renderPage, annotCanvas])

  // ── Image: sync canvas dimensions after img load ─────────────────────
  useEffect(() => {
    if (!isImage || !annotCanvas || !objectUrl) return
    const img = imageRef.current; if (!img) return
    function setup() {
      if (!annotCanvas) return
      annotCanvas.width  = img!.naturalWidth
      annotCanvas.height = img!.naturalHeight
      restoreAnnotation(file.id, 1, annotCanvas)
    }
    if (img.complete && img.naturalWidth > 0) setup()
    else img.addEventListener('load', setup, { once: true })
  }, [isImage, file.id, objectUrl, annotCanvas])

  // ── Page navigation ──────────────────────────────────────────────────
  const goToPage = useCallback((newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    if (annotCanvas) persistAnnotation(file.id, currentPageRef.current, annotCanvas)
    setCurrentPage(newPage)
  }, [file.id, totalPages, annotCanvas])

  const goToPageRef = useRef(goToPage)
  useEffect(() => { goToPageRef.current = goToPage }, [goToPage])

  // ── Zoom ─────────────────────────────────────────────────────────────
  const zoomIn  = () => setScale(s => Math.min(3.0, parseFloat((s + 0.2).toFixed(1))))
  const zoomOut = () => setScale(s => Math.max(0.5, parseFloat((s - 0.2).toFixed(1))))

  // ── Clear page annotations ───────────────────────────────────────────
  function clearAnnotations() {
    if (!annotCanvas) return
    annotCanvas.getContext('2d')!.clearRect(0, 0, annotCanvas.width, annotCanvas.height)
    dropAnnotation(file.id, currentPageRef.current)
  }

  // ── Text tool: place text on click ───────────────────────────────────
  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (tool !== 'text' || !canAnnotate || !annotCanvas) return
    const rect = annotCanvas.getBoundingClientRect()
    const sx = annotCanvas.width  / rect.width
    const sy = annotCanvas.height / rect.height
    setTextInput({
      canvasX: (e.clientX - rect.left) * sx,
      canvasY: (e.clientY - rect.top)  * sy,
      cssX: e.clientX - rect.left,
      cssY: e.clientY - rect.top,
      value: '',
    })
  }

  function confirmText() {
    if (!textInput || !annotCanvas) return
    if (textInput.value.trim()) {
      const ctx = annotCanvas.getContext('2d')!
      const fontSize = STROKE_WIDTHS[strokeSize] * 5 + 10
      ctx.globalCompositeOperation = 'source-over'
      ctx.font  = `bold ${fontSize}px sans-serif`
      ctx.fillStyle = color
      ctx.fillText(textInput.value, textInput.canvasX, textInput.canvasY)
      persistAnnotation(file.id, currentPageRef.current, annotCanvas)
    }
    setTextInput(null)
  }

  // ── Drawing event listeners ──────────────────────────────────────────
  // Re-runs when `annotCanvas` state changes (canvas mounts → effect fires)
  useEffect(() => {
    if (!annotCanvas || !canAnnotate) return
    const canvas: HTMLCanvasElement = annotCanvas // narrow to non-null for inner fns

    let drawing = false
    let lastX = 0; let lastY = 0

    function getPos(e: MouseEvent | TouchEvent) {
      const rect = canvas.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      const sx = canvas.width / rect.width; const sy = canvas.height / rect.height
      return { x: (clientX - rect.left) * sx, y: (clientY - rect.top) * sy }
    }

    function onStart(e: MouseEvent | TouchEvent) {
      e.preventDefault()
      const { x, y } = getPos(e)
      if (toolRef.current === 'text') return // handled by React onClick
      drawing = true; lastX = x; lastY = y
      if (toolRef.current === 'circle') {
        circleStartRef.current = { x, y }
        circleSnapshotRef.current = canvas.getContext('2d')!
          .getImageData(0, 0, canvas.width, canvas.height)
      }
    }

    function onMove(e: MouseEvent | TouchEvent) {
      if (!drawing) return
      e.preventDefault()
      const ctx = canvas.getContext('2d')!
      const { x, y } = getPos(e)
      const t = toolRef.current
      const c = colorRef.current
      const w = STROKE_WIDTHS[strokeSizeRef.current]

      ctx.lineCap = 'round'; ctx.lineJoin = 'round'

      if (t === 'pen') {
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = c; ctx.lineWidth = w
        ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(x, y); ctx.stroke()

      } else if (t === 'highlighter') {
        ctx.save()
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 0.35
        ctx.strokeStyle = c; ctx.lineWidth = w * 5 + 10
        ctx.lineCap = 'square'
        ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(x, y); ctx.stroke()
        ctx.restore()

      } else if (t === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.lineWidth = 28
        ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(x, y); ctx.stroke()
        ctx.globalCompositeOperation = 'source-over'

      } else if (t === 'circle' && circleStartRef.current && circleSnapshotRef.current) {
        // Restore snapshot to erase previous preview frame
        ctx.putImageData(circleSnapshotRef.current, 0, 0)
        const { x: sx, y: sy } = circleStartRef.current
        const rx = Math.abs(x - sx) / 2; const ry = Math.abs(y - sy) / 2
        if (rx > 1 && ry > 1) {
          ctx.globalCompositeOperation = 'source-over'
          ctx.strokeStyle = c; ctx.lineWidth = w
          ctx.beginPath()
          ctx.ellipse((sx + x) / 2, (sy + y) / 2, rx, ry, 0, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      lastX = x; lastY = y
    }

    function onEnd() {
      if (!drawing) return
      drawing = false
      circleStartRef.current = null; circleSnapshotRef.current = null
      persistAnnotation(fileIdRef.current, currentPageRef.current, canvas)
    }

    canvas.addEventListener('mousedown',  onStart)
    canvas.addEventListener('mousemove',  onMove)
    canvas.addEventListener('mouseup',    onEnd)
    canvas.addEventListener('mouseleave', onEnd)
    canvas.addEventListener('touchstart', onStart, { passive: false })
    canvas.addEventListener('touchmove',  onMove,  { passive: false })
    canvas.addEventListener('touchend',   onEnd)

    return () => {
      canvas.removeEventListener('mousedown',  onStart)
      canvas.removeEventListener('mousemove',  onMove)
      canvas.removeEventListener('mouseup',    onEnd)
      canvas.removeEventListener('mouseleave', onEnd)
      canvas.removeEventListener('touchstart', onStart)
      canvas.removeEventListener('touchmove',  onMove)
      canvas.removeEventListener('touchend',   onEnd)
    }
  }, [annotCanvas, canAnnotate])

  // ── Keyboard shortcuts ────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape')     { if (textInput) { setTextInput(null); return } onClose(); return }
      if (e.key === 'ArrowLeft')  goToPageRef.current(currentPageRef.current - 1)
      if (e.key === 'ArrowRight') goToPageRef.current(currentPageRef.current + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, textInput])

  // ── Cursor style ──────────────────────────────────────────────────────
  const cursorClass = canAnnotate
    ? tool === 'text'    ? 'cursor-text'
    : tool === 'eraser'  ? 'cursor-cell'
    : tool === 'circle'  ? 'cursor-crosshair'
    : 'cursor-crosshair'
    : 'pointer-events-none'

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#1a1a2e]">

      {/* ── Row 1: navigation + zoom + close ────────────────────────────── */}
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-white/10 bg-[#16213e] px-4 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <BookOpen size={15} className="flex-shrink-0 text-blue-400" />
          <span className="truncate text-sm font-medium text-white">{file.name}</span>
        </div>

        {isPDF && totalPages > 0 && (
          <>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center gap-1">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-30"
                title="Anterior (←)">
                <ChevronLeft size={16} />
              </button>
              <span className="min-w-[3.5rem] text-center text-xs font-medium text-gray-300 tabular-nums">
                {currentPage} / {totalPages}
              </span>
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-30"
                title="Próxima (→)">
                <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}

        {isPDF && (
          <>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center gap-1">
              <button onClick={zoomOut} disabled={scale <= 0.5}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-30"
                title="Reduzir zoom">
                <ZoomOut size={15} />
              </button>
              <span className="w-12 text-center text-xs font-medium text-gray-300 tabular-nums">
                {Math.round(scale * 100)}%
              </span>
              <button onClick={zoomIn} disabled={scale >= 3.0}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-30"
                title="Aumentar zoom">
                <ZoomIn size={15} />
              </button>
            </div>
          </>
        )}

        <div className="h-4 w-px bg-white/20" />
        <button onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-red-400"
          title="Fechar (Esc)">
          <X size={16} />
        </button>
      </div>

      {/* ── Row 2: annotation toolbar (teacher only) ─────────────────────── */}
      {canAnnotate && (
        <div className="flex flex-shrink-0 items-center gap-3 overflow-x-auto border-b border-white/10 bg-[#0f172a] px-4 py-2">
          {/* Drawing tools */}
          <div className="flex items-center gap-0.5">
            {TOOLS.map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setTool(id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                  tool === id
                    ? 'bg-blue-500/25 text-blue-300 ring-1 ring-blue-400/40'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                )}
                title={label}>
                <Icon size={13} />
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </div>

          <div className="h-4 w-px flex-shrink-0 bg-white/20" />

          {/* Color presets */}
          <div className="flex items-center gap-1">
            {PRESET_COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)}
                title={c}
                className={cn(
                  'h-5 w-5 flex-shrink-0 rounded-full border-2 transition-transform hover:scale-110',
                  color === c ? 'border-white scale-110' : 'border-transparent'
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="h-4 w-px flex-shrink-0 bg-white/20" />

          {/* Stroke thickness */}
          <div className="flex items-center gap-1">
            {(['sm', 'md', 'lg'] as StrokeSize[]).map((s) => (
              <button key={s} onClick={() => setStrokeSize(s)}
                title={s === 'sm' ? 'Fino' : s === 'md' ? 'Médio' : 'Grosso'}
                className={cn(
                  'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-colors',
                  strokeSize === s
                    ? 'bg-blue-500/25 text-blue-300 ring-1 ring-blue-400/40'
                    : 'text-gray-400 hover:bg-white/10'
                )}>
                <div className="rounded-full bg-current"
                  style={{
                    width: s === 'sm' ? 4 : s === 'md' ? 6 : 10,
                    height: s === 'sm' ? 4 : s === 'md' ? 6 : 10,
                  }} />
              </button>
            ))}
          </div>

          <div className="h-4 w-px flex-shrink-0 bg-white/20" />

          {/* Clear */}
          <button onClick={clearAnnotations}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-400 hover:bg-red-500/20 hover:text-red-400 whitespace-nowrap"
            title="Limpar anotações desta página">
            <Trash2 size={13} />
            <span className="hidden md:inline">Limpar</span>
          </button>
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="flex h-full items-center justify-center gap-3 text-gray-400">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm">Carregando arquivo…</span>
          </div>
        )}
        {!loading && error && (
          <div className="flex h-full items-center justify-center px-6 text-center text-gray-400">
            <p className="text-sm">{error}</p>
          </div>
        )}
        {!loading && !error && (
          <div className="flex min-h-full items-start justify-center p-6">
            {/* Canvas container */}
            <div className="relative inline-block shadow-2xl">

              {isPDF && <canvas ref={pdfCanvasRef} className="block" />}

              {isImage && objectUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img ref={imageRef} src={objectUrl} alt={file.name} className="block max-w-4xl" />
              )}

              {/* Annotation canvas — callback ref triggers drawing effect when it mounts */}
              {(isPDF || isImage) && (
                <canvas
                  ref={setAnnotCanvas}
                  onClick={handleCanvasClick}
                  className={cn('absolute inset-0 h-full w-full', cursorClass)}
                  style={{ touchAction: 'none' }}
                />
              )}

              {/* Text input overlay */}
              {textInput && (
                <div style={{ position: 'absolute', left: textInput.cssX, top: textInput.cssY, zIndex: 20 }}>
                  <input
                    autoFocus
                    value={textInput.value}
                    onChange={e => setTextInput(t => t ? { ...t, value: e.target.value } : null)}
                    onKeyDown={e => { if (e.key === 'Enter') confirmText(); if (e.key === 'Escape') setTextInput(null) }}
                    onBlur={confirmText}
                    placeholder="Digite…"
                    style={{
                      background: 'rgba(255,255,255,0.92)',
                      border: `2px solid ${color}`,
                      borderRadius: 6,
                      padding: '2px 6px',
                      color: color,
                      fontSize: STROKE_WIDTHS[strokeSize] * 5 + 10,
                      fontWeight: 'bold',
                      fontFamily: 'sans-serif',
                      minWidth: 120,
                      outline: 'none',
                    }}
                  />
                </div>
              )}

              {rendering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Loader2 size={24} className="animate-spin text-white" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Status bar ───────────────────────────────────────────────────── */}
      {isPDF && totalPages > 0 && (
        <div className="flex flex-shrink-0 items-center justify-between border-t border-white/10 bg-[#16213e] px-4 py-1.5 text-[11px] text-gray-500">
          <span>
            {canAnnotate
              ? `${TOOLS.find(t => t.id === tool)?.label ?? ''} ativo`
              : 'Modo visualização'}
          </span>
          <span>← → navegar · Esc fechar</span>
        </div>
      )}
    </div>
  )
}
