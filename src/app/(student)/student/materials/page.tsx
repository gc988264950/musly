'use client'

import { useState, useEffect } from 'react'
import {
  FolderOpen, FileText, Image as ImageIcon, Music, Video, File, Eye, Download, BookOpen,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getStudentFiles } from '@/lib/db/studentFiles'
import { getFileBlob } from '@/lib/db/fileStorage'
import { FilePreviewModal } from '@/components/ui/FilePreviewModal'
import { MaterialViewerModal } from '@/components/ui/MaterialViewerModal'
import type { StudentFile } from '@/lib/db/types'
import { cn } from '@/lib/utils'

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentMaterialsPage() {
  const { user } = useAuth()
  const linkedStudentId = user?.linkedStudentId

  const [files, setFiles] = useState<StudentFile[]>([])
  const [previewFile, setPreviewFile] = useState<StudentFile | null>(null)
  const [viewerFile, setViewerFile] = useState<StudentFile | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    if (linkedStudentId) {
      getStudentFiles(linkedStudentId).then(setFiles).catch(() => {})
    }
  }, [linkedStudentId])

  async function handleDownload(file: StudentFile) {
    setDownloadingId(file.id)
    try {
      const blob = await getFileBlob(file.storagePath)
      if (!blob) { alert('Arquivo não encontrado.'); return }
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-in space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Materiais</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Partituras, exercícios e outros arquivos enviados pelo seu professor
        </p>
      </div>

      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen className="mb-3 h-12 w-12 text-gray-200" />
          <p className="text-sm font-medium text-gray-400">Nenhum material disponível</p>
          <p className="mt-0.5 text-xs text-gray-300">
            Seu professor ainda não enviou materiais
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            {files.length} arquivo{files.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-2">
            {files.map((file) => {
              const style = getFileStyle(file.mimeType)
              const Icon = style.icon
              const isDownloading = downloadingId === file.id
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-card"
                >
                  <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', style.iconBg)}>
                    <Icon size={18} className={style.iconColor} />
                  </div>
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
                  <div className="flex flex-shrink-0 items-center gap-1">
                    {(file.mimeType === 'application/pdf' || file.mimeType.startsWith('image/')) && (
                      <button
                        onClick={() => setViewerFile(file)}
                        className="hidden sm:flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                        title="Abrir material"
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
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}

      {/* Viewer — student sees content but no annotation tools */}
      {viewerFile && (
        <MaterialViewerModal
          file={viewerFile}
          isTeacher={false}
          onClose={() => setViewerFile(null)}
        />
      )}
    </div>
  )
}
