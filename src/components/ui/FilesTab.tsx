'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Upload, FileText, Image as ImageIcon, Music, Video, File,
  Trash2, Eye, Download, FolderOpen, AlertCircle, X, BookOpen,
} from 'lucide-react'
import { getStudentFiles, saveStudentFile, deleteStudentFile } from '@/lib/db/studentFiles'
import { saveFileBlob, getFileBlob, deleteFileBlob } from '@/lib/db/fileStorage'
import { FilePreviewModal } from '@/components/ui/FilePreviewModal'
import { MaterialViewerModal } from '@/components/ui/MaterialViewerModal'
import type { StudentFile } from '@/lib/db/types'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/aac', 'audio/flac',
  'video/mp4', 'video/webm', 'video/ogg',
]
const ACCEPT_ATTR = ACCEPTED_MIME_TYPES.join(',')
const MAX_MB = 50
const MAX_BYTES = MAX_MB * 1024 * 1024

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function getMimeLabel(mimeType: string): string {
  const map: Record<string, string> = {
    'application/pdf': 'PDF',
    'image/jpeg': 'JPEG', 'image/jpg': 'JPEG', 'image/png': 'PNG',
    'image/gif': 'GIF', 'image/webp': 'WebP', 'image/svg+xml': 'SVG',
    'audio/mpeg': 'MP3', 'audio/mp3': 'MP3', 'audio/ogg': 'OGG',
    'audio/wav': 'WAV', 'audio/aac': 'AAC', 'audio/flac': 'FLAC',
    'video/mp4': 'MP4', 'video/webm': 'WebM', 'video/ogg': 'OGV',
  }
  return map[mimeType] ?? mimeType.split('/')[1]?.toUpperCase() ?? 'Arquivo'
}

interface FileStyle { icon: React.ElementType; iconColor: string; iconBg: string; badge: string }

function getFileStyle(mimeType: string): FileStyle {
  if (mimeType === 'application/pdf')
    return { icon: FileText, iconColor: 'text-red-600',    iconBg: 'bg-red-50',    badge: 'bg-red-100 text-red-700' }
  if (mimeType.startsWith('image/'))
    return { icon: ImageIcon, iconColor: 'text-blue-600',   iconBg: 'bg-blue-50',   badge: 'bg-blue-100 text-blue-700' }
  if (mimeType.startsWith('audio/'))
    return { icon: Music,     iconColor: 'text-[#1a7cfa]', iconBg: 'bg-[#eef5ff]', badge: 'bg-[#d6eaff] text-[#1057b0]' }
  if (mimeType.startsWith('video/'))
    return { icon: Video,     iconColor: 'text-orange-600', iconBg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-700' }
  return   { icon: File,      iconColor: 'text-gray-500',   iconBg: 'bg-gray-50',   badge: 'bg-gray-100 text-gray-600' }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface FilesTabProps {
  studentId: string
  teacherId: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FilesTab({ studentId, teacherId }: FilesTabProps) {
  const [files, setFiles] = useState<StudentFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [dragging, setDragging] = useState(false)
  const [previewFile, setPreviewFile] = useState<StudentFile | null>(null)
  const [viewerFile, setViewerFile] = useState<StudentFile | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  const reload = useCallback(() => setFiles(getStudentFiles(studentId)), [studentId])
  useEffect(() => { reload() }, [reload])

  // ── Validation ──────────────────────────────────────────────────────────
  function validate(file: File): string | null {
    if (!ACCEPTED_MIME_TYPES.includes(file.type))
      return `"${file.name}": tipo não suportado (${file.type || 'desconhecido'}).`
    if (file.size > MAX_BYTES)
      return `"${file.name}": muito grande. Máximo ${MAX_MB} MB.`
    return null
  }

  // ── Upload ──────────────────────────────────────────────────────────────
  /**
   * Two-step upload:
   * 1. Blob → IndexedDB with a pre-generated UUID
   * 2. Metadata → localStorage with the same UUID
   * This keeps blob and metadata in sync without a separate lookup.
   */
  const processFiles = useCallback(
    async (raw: FileList | File[]) => {
      const list = Array.from(raw)
      if (!list.length) return

      setUploadErrors([])
      setUploading(true)
      const errors: string[] = []

      for (const f of list) {
        const err = validate(f)
        if (err) { errors.push(err); continue }

        try {
          const id = crypto.randomUUID()
          await saveFileBlob(id, f)
          saveStudentFile({
            id,
            studentId,
            teacherId,
            name: f.name,
            mimeType: f.type,
            size: f.size,
            createdAt: new Date().toISOString(),
          })
        } catch {
          errors.push(`"${f.name}": erro ao salvar arquivo. Tente novamente.`)
        }
      }

      if (errors.length) setUploadErrors(errors)
      reload()
      setUploading(false)
    },
    [studentId, teacherId, reload]
  )

  // ── Drag & drop ─────────────────────────────────────────────────────────
  function onDragOver(e: React.DragEvent) { e.preventDefault(); setDragging(true) }
  function onDragLeave(e: React.DragEvent) { e.preventDefault(); setDragging(false) }
  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    processFiles(e.dataTransfer.files)
  }

  // ── Delete ──────────────────────────────────────────────────────────────
  async function handleDelete(file: StudentFile) {
    if (!confirm(`Excluir "${file.name}"? Esta ação não pode ser desfeita.`)) return
    setDeletingId(file.id)
    try {
      await deleteFileBlob(file.id)
      deleteStudentFile(file.id)
      reload()
    } catch {
      alert('Erro ao excluir o arquivo. Tente novamente.')
    } finally {
      setDeletingId(null)
    }
  }

  // ── Download ────────────────────────────────────────────────────────────
  async function handleDownload(file: StudentFile) {
    setDownloadingId(file.id)
    try {
      const blob = await getFileBlob(file.id)
      if (!blob) { alert('Arquivo não encontrado no armazenamento local.'); return }
      const url = URL.createObjectURL(new Blob([blob], { type: file.mimeType }))
      const a = document.createElement('a')
      a.href = url; a.download = file.name
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      alert('Erro ao baixar o arquivo.')
    } finally {
      setDownloadingId(null)
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 transition-colors select-none',
          dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50',
          uploading && 'cursor-default opacity-60'
        )}
      >
        {uploading ? (
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
            <Upload className="h-6 w-6 text-blue-500" />
          </div>
        )}
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700">
            {uploading ? 'Enviando arquivo…' : 'Clique ou arraste arquivos aqui'}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">
            PDF, imagens, áudio, vídeo · máx. {MAX_MB} MB por arquivo
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          className="sr-only"
          onChange={(e) => { processFiles(e.target.files ?? []); e.target.value = '' }}
        />
      </div>

      {/* Upload errors */}
      {uploadErrors.length > 0 && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
              <div className="space-y-0.5">
                {uploadErrors.map((e, i) => (
                  <p key={i} className="text-xs text-red-700">{e}</p>
                ))}
              </div>
            </div>
            <button onClick={() => setUploadErrors([])} className="shrink-0 text-red-400 hover:text-red-600">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* File list */}
      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FolderOpen className="mb-3 h-12 w-12 text-gray-200" />
          <p className="text-sm font-medium text-gray-400">Nenhum material enviado</p>
          <p className="mt-0.5 text-xs text-gray-300">
            Envie partituras, exercícios, gravações ou qualquer arquivo relevante
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {files.length} arquivo{files.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-2">
            {files.map((file) => {
              const style = getFileStyle(file.mimeType)
              const Icon = style.icon
              const isDeleting = deletingId === file.id
              const isDownloading = downloadingId === file.id

              return (
                <div
                  key={file.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-card transition-shadow hover:shadow-card-hover"
                >
                  {/* Icon */}
                  <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', style.iconBg)}>
                    <Icon size={18} className={style.iconColor} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900" title={file.name}>
                      {file.name}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-semibold', style.badge)}>
                        {getMimeLabel(file.mimeType)}
                      </span>
                      <span className="text-[11px] text-gray-400">{formatSize(file.size)}</span>
                      <span className="text-gray-200">·</span>
                      <span className="text-[11px] text-gray-400">{formatDate(file.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-shrink-0 items-center gap-1">
                    {/* "Abrir material" — full viewer with annotation (PDF + images only) */}
                    {(file.mimeType === 'application/pdf' || file.mimeType.startsWith('image/')) && (
                      <button
                        onClick={() => setViewerFile(file)}
                        className="hidden sm:flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                        title="Abrir material no visualizador"
                      >
                        <BookOpen size={13} />
                        <span>Abrir</span>
                      </button>
                    )}
                    <button
                      onClick={() => setPreviewFile(file)}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                      title="Visualizar"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => handleDownload(file)}
                      disabled={isDownloading}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600 disabled:opacity-50"
                      title="Baixar"
                    >
                      {isDownloading
                        ? <div className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" />
                        : <Download size={15} />
                      }
                    </button>
                    <button
                      onClick={() => handleDelete(file)}
                      disabled={isDeleting}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                      title="Excluir"
                    >
                      {isDeleting
                        ? <div className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" />
                        : <Trash2 size={15} />
                      }
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Quick preview modal (existing) */}
      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}

      {/* Interactive material viewer (annotation layer — teacher only) */}
      {viewerFile && (
        <MaterialViewerModal
          file={viewerFile}
          isTeacher={true}
          onClose={() => setViewerFile(null)}
        />
      )}
    </div>
  )
}
