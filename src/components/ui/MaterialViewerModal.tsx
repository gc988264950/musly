'use client'

/**
 * MaterialViewerModal — fullscreen interactive material viewer.
 *
 * Annotation tools (teacher-only):
 *   pen · highlighter · circle · text · eraser · undo · clear
 *
 * Text items are stored as JSON overlay elements (NOT rasterised to canvas),
 * which allows edit-in-place, drag-to-reposition, and delete.
 * All other drawing tools write directly to the annotation canvas as before.
 *
 * Persistence:
 *   drawing canvas  → harmoniq_annotations_{fileId}_{page}  (data URL)
 *   text items      → harmoniq_texts_{fileId}_{page}         (JSON)
 * Undo: per-page ImageData stack for drawing (up to 20 steps).
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import {
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Pencil, Eraser, Trash2, Loader2, BookOpen,
  Highlighter, Circle, Type, Undo2,
} from 'lucide-react'
import { getFileBlob } from '@/lib/db/fileStorage'
import type { StudentFile } from '@/lib/db/types'
import { cn } from '@/lib/utils'

// ─── PDF.js worker ────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
}

// ─── Annotation persistence (canvas) ─────────────────────────────────────

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

// ─── Text item persistence ────────────────────────────────────────────────

interface TextItem {
  id: string
  /** Fraction 0–1 of canvas CSS width */
  xFrac: number
  /** Fraction 0–1 of canvas CSS height */
  yFrac: number
  text: string
  color: string
  /** CSS font-size in px */
  fontSize: number
}

const textKey = (fileId: string, page: number) =>
  `harmoniq_texts_${fileId}_${page}`

function persistTextItems(fileId: string, page: number, items: TextItem[]) {
  try {
    if (items.length === 0) localStorage.removeItem(textKey(fileId, page))
    else localStorage.setItem(textKey(fileId, page), JSON.stringify(items))
  } catch { /* quota */ }
}

function loadTextItems(fileId: string, page: number): TextItem[] {
  try {
    const raw = localStorage.getItem(textKey(fileId, page))
    return raw ? (JSON.parse(raw) as TextItem[]) : []
  } catch { return [] }
}

function dropTextItems(fileId: string, page: number) {
  localStorage.removeItem(textKey(fileId, page))
}

// ─── Tool config ──────────────────────────────────────────────────────────

type Tool = 'pen' | 'highlighter' | 'circle' | 'text' | 'eraser'

const TOOLS: { id: Tool; icon: React.ElementType; label: string }[] = [
  { id: 'pen',         icon: Pencil,      label: 'Caneta'   },
  { id: 'highlighter', icon: Highlighter, label: 'Grifar'   },
  { id: 'circle',      icon: Circle,      label: 'Círculo'  },
  { id: 'text',        icon: Type,        label: 'Texto'    },
  { id: 'eraser',      icon: Eraser,      label: 'Borracha' },
]

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#000000', '#ffffff',
]

const STROKE_WIDTHS: Record<'sm' | 'md' | 'lg', number> = { sm: 2, md: 5, lg: 10 }
const TEXT_FONT_SIZES: Record<'sm' | 'md' | 'lg', number> = { sm: 16, md: 22, lg: 30 }

type StrokeSize = 'sm' | 'md' | 'lg'

// ─── Props ────────────────────────────────────────────────────────────────

export interface MaterialViewerModalProps {
  file: StudentFile
  isTeacher: boolean
  onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────

export function MaterialViewerModal({ file, isTeacher, onClose }: MaterialViewerModalProps) {
  const isPDF      = file.mimeType === 'application/pdf'
  const isImage    = file.mimeType.startsWith('image/')
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

  // ── Drawing annotation state ─────────────────────────────────────────
  const [tool,       setTool]       = useState<Tool>('pen')
  const [color,      setColor]      = useState('#ef4444')
  const [strokeSize, setStrokeSize] = useState<StrokeSize>('md')

  // ── Text item state ──────────────────────────────────────────────────
  const [textItems, setTextItems] = useState<TextItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  // Keep a ref so closures (drag handlers) always see the latest items
  const textItemsRef = useRef<TextItem[]>([])
  useEffect(() => { textItemsRef.current = textItems }, [textItems])

  // ── Undo stack ───────────────────────────────────────────────────────
  const undoStackRef = useRef<ImageData[]>([])
  const [hasUndo, setHasUndo] = useState(false)

  // ── Canvas refs ──────────────────────────────────────────────────────
  const pdfCanvasRef  = useRef<HTMLCanvasElement>(null)
  const imageRef      = useRef<HTMLImageElement>(null)
  const renderTaskRef = useRef<RenderTask | null>(null)

  // STATE-BASED callback ref so drawing useEffect re-fires when canvas mounts
  const [annotCanvas, setAnnotCanvas] = useState<HTMLCanvasElement | null>(null)

  // ── Mutable refs for event-handler closures ───────────────────────────
  const toolRef        = useRef<Tool>('pen')
  const colorRef       = useRef('#ef4444')
  const strokeSizeRef  = useRef<StrokeSize>('md')
  const currentPageRef = useRef(1)
  const fileIdRef      = useRef(file.id)
  const circleStartRef    = useRef<{ x: number; y: number } | null>(null)
  const circleSnapshotRef = useRef<ImageData | null>(null)
  const setHasUndoRef  = useRef(setHasUndo) // stable setter ref for use inside events

  useEffect(() => { toolRef.current        = tool        }, [tool])
  useEffect(() => { colorRef.current       = color       }, [color])
  useEffect(() => { strokeSizeRef.current  = strokeSize  }, [strokeSize])
  useEffect(() => { currentPageRef.current = currentPage }, [currentPage])
  useEffect(() => { fileIdRef.current      = file.id     }, [file.id])

  // ── Reset undo + text items when page changes ─────────────────────────
  useEffect(() => {
    undoStackRef.current = []
    setHasUndo(false)
    setEditingId(null)
    setTextItems(loadTextItems(file.id, currentPage))
  }, [file.id, currentPage])

  // ── Load blob from Supabase Storage ─────────────────────────────────
  useEffect(() => {
    let url: string | null = null
    async function load() {
      try {
        setLoading(true)
        const blob = await getFileBlob(file.storagePath)
        if (!blob) { setError('Arquivo não encontrado.'); return }
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
      pdfCanvas.width = viewport.width;   pdfCanvas.height = viewport.height
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
    // Persist text items for the current page before switching
    persistTextItems(file.id, currentPageRef.current, textItemsRef.current)
    setCurrentPage(newPage)
  }, [file.id, totalPages, annotCanvas])

  const goToPageRef = useRef(goToPage)
  useEffect(() => { goToPageRef.current = goToPage }, [goToPage])

  // ── Zoom ─────────────────────────────────────────────────────────────
  const zoomIn  = () => setScale(s => Math.min(3.0, parseFloat((s + 0.2).toFixed(1))))
  const zoomOut = () => setScale(s => Math.max(0.5, parseFloat((s - 0.2).toFixed(1))))

  // ── Undo helpers (drawing canvas only) ───────────────────────────────
  function pushUndoSnapshot(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')!
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height)
    undoStackRef.current.push(snapshot)
    if (undoStackRef.current.length > 20) undoStackRef.current.shift()
    setHasUndo(true)
  }

  const undo = useCallback(() => {
    if (!annotCanvas || undoStackRef.current.length === 0) return
    const snapshot = undoStackRef.current.pop()!
    annotCanvas.getContext('2d')!.putImageData(snapshot, 0, 0)
    setHasUndo(undoStackRef.current.length > 0)
    persistAnnotation(fileIdRef.current, currentPageRef.current, annotCanvas)
  }, [annotCanvas])

  const undoRef = useRef(undo)
  useEffect(() => { undoRef.current = undo }, [undo])

  // ── Clear ALL annotations + text items on this page ──────────────────
  function clearAnnotations() {
    if (!annotCanvas) return
    pushUndoSnapshot(annotCanvas)
    annotCanvas.getContext('2d')!.clearRect(0, 0, annotCanvas.width, annotCanvas.height)
    dropAnnotation(file.id, currentPageRef.current)
    setTextItems([])
    setEditingId(null)
    dropTextItems(file.id, currentPageRef.current)
  }

  // ── Text item helpers ─────────────────────────────────────────────────

  /** Create a new text item at a fractional position, open it for editing. */
  function createTextItem(xFrac: number, yFrac: number) {
    const newItem: TextItem = {
      id:       `txt_${Date.now()}`,
      xFrac:    Math.max(0, Math.min(0.95, xFrac)),
      yFrac:    Math.max(0, Math.min(0.95, yFrac)),
      text:     '',
      color,
      fontSize: TEXT_FONT_SIZES[strokeSize],
    }
    setTextItems(prev => [...prev, newItem])
    setEditingId(newItem.id)
  }

  function updateItemText(id: string, text: string) {
    setTextItems(prev => prev.map(t => t.id === id ? { ...t, text } : t))
  }

  /** Called when the input blurs or Escape/Enter pressed — commit or discard. */
  function commitItem(id: string) {
    setTextItems(prev => {
      const item = prev.find(t => t.id === id)
      const next = item && item.text.trim() ? prev : prev.filter(t => t.id !== id)
      persistTextItems(fileIdRef.current, currentPageRef.current, next)
      return next
    })
    setEditingId(null)
  }

  function deleteItem(id: string) {
    setTextItems(prev => {
      const next = prev.filter(t => t.id !== id)
      persistTextItems(fileIdRef.current, currentPageRef.current, next)
      return next
    })
    if (editingId === id) setEditingId(null)
  }

  /**
   * Mouse-down on a text item div.
   * Small movement → open for editing.
   * Large movement → drag to reposition.
   */
  function startDragOrEdit(e: React.MouseEvent, itemId: string) {
    if (editingId === itemId) return // already in edit mode
    e.stopPropagation()
    e.preventDefault()

    const startX   = e.clientX
    const startY   = e.clientY
    const origItem = textItemsRef.current.find(t => t.id === itemId)
    if (!origItem) return
    const origXFrac = origItem.xFrac
    const origYFrac = origItem.yFrac
    let moved = false

    // Capture annotCanvas for drag calculations — stable for the duration of a drag
    const canvas = annotCanvas

    function onMove(me: MouseEvent) {
      const dx = me.clientX - startX
      const dy = me.clientY - startY
      if (!moved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) moved = true
      if (!moved || !canvas) return
      const rect = canvas.getBoundingClientRect()
      const newXFrac = Math.max(0, Math.min(0.95, origXFrac + dx / rect.width))
      const newYFrac = Math.max(0, Math.min(0.95, origYFrac + dy / rect.height))
      setTextItems(items =>
        items.map(t => t.id === itemId ? { ...t, xFrac: newXFrac, yFrac: newYFrac } : t)
      )
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
      if (!moved) {
        // Treated as a click → open editor
        setEditingId(itemId)
      } else {
        // Persist final position
        persistTextItems(fileIdRef.current, currentPageRef.current, textItemsRef.current)
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }

  // ── Canvas click: create text item or ignore ──────────────────────────
  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (tool !== 'text' || !canAnnotate || !annotCanvas) return
    const rect   = annotCanvas.getBoundingClientRect()
    const xFrac  = (e.clientX - rect.left) / rect.width
    const yFrac  = (e.clientY - rect.top)  / rect.height
    createTextItem(xFrac, yFrac)
  }

  // ── Drawing event listeners (pen / highlighter / circle / eraser) ─────
  useEffect(() => {
    if (!annotCanvas || !canAnnotate) return
    const canvas: HTMLCanvasElement = annotCanvas

    let drawing = false
    let lastX = 0; let lastY = 0
    let rafId = 0
    let pendingX = 0; let pendingY = 0
    let hasPending = false

    function getPos(e: MouseEvent | TouchEvent) {
      const rect    = canvas.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      const sx = canvas.width  / rect.width
      const sy = canvas.height / rect.height
      return { x: (clientX - rect.left) * sx, y: (clientY - rect.top) * sy }
    }

    function onStart(e: MouseEvent | TouchEvent) {
      e.preventDefault()
      if (toolRef.current === 'text') return // text items handled by React overlay

      const { x, y } = getPos(e)
      // Save undo snapshot before each stroke
      const ctx      = canvas.getContext('2d')!
      const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height)
      undoStackRef.current.push(snapshot)
      if (undoStackRef.current.length > 20) undoStackRef.current.shift()
      setHasUndoRef.current(true)

      drawing = true; lastX = x; lastY = y
      if (toolRef.current === 'circle') {
        circleStartRef.current    = { x, y }
        circleSnapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height)
      }
    }

    function drawFrame() {
      if (!hasPending || !drawing) return
      hasPending = false
      const ctx = canvas.getContext('2d')!
      const x   = pendingX; const y = pendingY
      const t   = toolRef.current
      const c   = colorRef.current
      const w   = STROKE_WIDTHS[strokeSizeRef.current]

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

    function onMove(e: MouseEvent | TouchEvent) {
      if (!drawing) return
      e.preventDefault()
      const { x, y } = getPos(e)
      pendingX = x; pendingY = y; hasPending = true
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(drawFrame)
    }

    function onEnd() {
      if (!drawing) return
      drawing = false
      cancelAnimationFrame(rafId)
      if (hasPending) drawFrame()
      hasPending = false
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
      cancelAnimationFrame(rafId)
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
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault(); undoRef.current(); return
      }
      if (e.key === 'Escape') {
        if (editingId !== null) { setEditingId(null); return }
        onClose(); return
      }
      // Don't fire page nav when focus is inside an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowLeft')  goToPageRef.current(currentPageRef.current - 1)
      if (e.key === 'ArrowRight') goToPageRef.current(currentPageRef.current + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, editingId])

  // ── Cursor style on annotation canvas ────────────────────────────────
  const cursorClass = canAnnotate
    ? tool === 'text'   ? 'cursor-crosshair' // clicking canvas creates a new item
    : tool === 'eraser' ? 'cursor-cell'
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
            <div className="flex items-center gap-1.5">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-30"
                title="Anterior (←)">
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1 text-xs text-gray-300 tabular-nums">
                <input
                  key={currentPage}
                  type="number"
                  defaultValue={currentPage}
                  min={1}
                  max={totalPages}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const n = parseInt((e.target as HTMLInputElement).value)
                      if (!isNaN(n)) goToPage(n)
                      ;(e.target as HTMLInputElement).blur()
                    }
                  }}
                  onBlur={e => {
                    const n = parseInt(e.target.value)
                    if (!isNaN(n) && n !== currentPage) goToPage(n)
                  }}
                  className="w-10 rounded bg-white/10 px-1.5 py-0.5 text-center text-xs font-medium text-white outline-none focus:ring-1 focus:ring-blue-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="text-gray-500">/</span>
                <span className="font-medium">{totalPages}</span>
              </div>

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
        <div className="flex flex-shrink-0 items-center gap-2 overflow-x-auto border-b border-white/10 bg-[#0f172a] px-4 py-2">

          {/* Tool buttons */}
          <div className="flex items-center gap-0.5">
            {TOOLS.map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => { setTool(id); if (id !== 'text') setEditingId(null) }}
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

          {/* Stroke / text size */}
          <div className="flex items-center gap-1">
            {(['sm', 'md', 'lg'] as StrokeSize[]).map((s) => (
              <button key={s} onClick={() => setStrokeSize(s)}
                title={s === 'sm' ? 'Fino / Pequeno' : s === 'md' ? 'Médio' : 'Grosso / Grande'}
                className={cn(
                  'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-colors',
                  strokeSize === s
                    ? 'bg-blue-500/25 text-blue-300 ring-1 ring-blue-400/40'
                    : 'text-gray-400 hover:bg-white/10'
                )}>
                <div className="rounded-full bg-current"
                  style={{
                    width:  s === 'sm' ? 4 : s === 'md' ? 6 : 10,
                    height: s === 'sm' ? 4 : s === 'md' ? 6 : 10,
                  }} />
              </button>
            ))}
          </div>

          <div className="h-4 w-px flex-shrink-0 bg-white/20" />

          {/* Undo */}
          <button onClick={() => undoRef.current()} disabled={!hasUndo}
            title="Desfazer traço (Ctrl+Z)"
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
              hasUndo
                ? 'text-gray-400 hover:bg-white/10 hover:text-white'
                : 'cursor-not-allowed text-gray-600 opacity-40'
            )}>
            <Undo2 size={13} />
            <span className="hidden md:inline">Desfazer</span>
          </button>

          <div className="h-4 w-px flex-shrink-0 bg-white/20" />

          {/* Clear */}
          <button onClick={clearAnnotations}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-400 hover:bg-red-500/20 hover:text-red-400 whitespace-nowrap"
            title="Limpar todas as anotações desta página">
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
            {/* Canvas + text overlay container */}
            <div className="relative inline-block shadow-2xl">

              {isPDF && <canvas ref={pdfCanvasRef} className="block" />}

              {isImage && objectUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img ref={imageRef} src={objectUrl} alt={file.name} className="block max-w-4xl" />
              )}

              {/* Drawing annotation canvas */}
              {(isPDF || isImage) && (
                <canvas
                  ref={setAnnotCanvas}
                  onClick={handleCanvasClick}
                  className={cn('absolute inset-0 h-full w-full', cursorClass)}
                  style={{ touchAction: 'none' }}
                />
              )}

              {/* ── Text items overlay ─────────────────────────────────── */}
              {canAnnotate && textItems.map(item => {
                const isEditing    = editingId === item.id
                const isTextActive = tool === 'text'
                return (
                  <div
                    key={item.id}
                    style={{
                      position:      'absolute',
                      left:          `${item.xFrac * 100}%`,
                      top:           `${item.yFrac * 100}%`,
                      zIndex:        20,
                      pointerEvents: isTextActive ? 'auto' : 'none',
                      cursor:        isEditing ? 'text' : 'move',
                      userSelect:    'none',
                    }}
                    onMouseDown={!isEditing ? (e) => startDragOrEdit(e, item.id) : undefined}
                  >
                    {isEditing ? (
                      /* ── Edit mode ── */
                      <input
                        autoFocus
                        value={item.text}
                        placeholder="Digite aqui"
                        onChange={e => updateItemText(item.id, e.target.value)}
                        onKeyDown={e => {
                          e.stopPropagation()
                          if (e.key === 'Enter' || e.key === 'Escape') commitItem(item.id)
                        }}
                        onBlur={() => commitItem(item.id)}
                        style={{
                          background:   'rgba(255,255,255,0.96)',
                          border:       `2px solid ${item.color}`,
                          borderRadius: 5,
                          padding:      '3px 8px',
                          color:        item.color,
                          fontSize:     item.fontSize,
                          fontWeight:   'bold',
                          fontFamily:   'sans-serif',
                          minWidth:     140,
                          outline:      'none',
                          boxShadow:    `0 0 0 3px ${item.color}30, 0 2px 12px rgba(0,0,0,0.35)`,
                          cursor:       'text',
                        }}
                      />
                    ) : (
                      /* ── Display mode ── */
                      <div
                        style={{
                          display:    'inline-flex',
                          alignItems: 'flex-start',
                          gap:        4,
                          outline:    isTextActive ? `1.5px dashed ${item.color}99` : 'none',
                          borderRadius: 4,
                          padding:    isTextActive ? '2px 4px' : '0',
                        }}
                      >
                        <span
                          style={{
                            color:      item.color,
                            fontSize:   item.fontSize,
                            fontWeight: 'bold',
                            fontFamily: 'sans-serif',
                            textShadow: '0 1px 4px rgba(0,0,0,0.55)',
                            whiteSpace: 'pre',
                            lineHeight: '1.25',
                            cursor:     isTextActive ? 'move' : 'default',
                          }}
                        >
                          {item.text}
                        </span>

                        {/* Delete button — only visible when text tool is active */}
                        {isTextActive && (
                          <button
                            onMouseDown={e => { e.stopPropagation(); deleteItem(item.id) }}
                            title="Deletar texto"
                            style={{
                              flexShrink:     0,
                              background:     '#ef4444',
                              color:          '#fff',
                              border:         'none',
                              borderRadius:   '50%',
                              width:          16,
                              height:         16,
                              fontSize:       11,
                              lineHeight:     '16px',
                              cursor:         'pointer',
                              display:        'flex',
                              alignItems:     'center',
                              justifyContent: 'center',
                              marginTop:      2,
                              boxShadow:      '0 1px 3px rgba(0,0,0,0.4)',
                            }}
                          >×</button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

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
              ? tool === 'text'
                ? 'Texto — clique para adicionar · arraste para mover · × para deletar'
                : `${TOOLS.find(t => t.id === tool)?.label ?? ''} ativo`
              : 'Modo visualização'}
          </span>
          <span>← → navegar · Ctrl+Z desfazer · Esc fechar</span>
        </div>
      )}
    </div>
  )
}
