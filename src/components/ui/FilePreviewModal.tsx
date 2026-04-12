'use client'

import { useEffect, useState } from 'react'
import { X, Download, FileText, Image as ImageIcon, Music, Video, File } from 'lucide-react'
import type { StudentFile } from '@/lib/db/types'
import { getFileBlob } from '@/lib/db/fileStorage'
import { cn } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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

// ─── Props ────────────────────────────────────────────────────────────────────

interface FilePreviewModalProps {
  file: StudentFile
  onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let url: string | null = null

    async function load() {
      try {
        const blob = await getFileBlob(file.id)
        if (!blob) {
          setError('Arquivo não encontrado no armazenamento local.')
          return
        }
        // Re-type the blob with the correct MIME type for proper browser handling
        const typed = new Blob([blob], { type: file.mimeType })
        url = URL.createObjectURL(typed)
        setObjectUrl(url)
      } catch {
        setError('Não foi possível carregar o arquivo.')
      } finally {
        setLoading(false)
      }
    }

    load()

    // Revoke the object URL when the modal closes
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [file.id, file.mimeType])

  function handleDownload() {
    if (!objectUrl) return
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const isPDF = file.mimeType === 'application/pdf'
  const isImage = file.mimeType.startsWith('image/')
  const isAudio = file.mimeType.startsWith('audio/')
  const isVideo = file.mimeType.startsWith('video/')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className={cn(
          'relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl',
          isAudio ? 'max-w-lg' : 'max-w-3xl'
        )}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-gray-100 px-5 py-4">
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-400">
              {getMimeLabel(file.mimeType)} · {formatSize(file.size)}
            </p>
          </div>
          <button
            onClick={handleDownload}
            disabled={!objectUrl}
            className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            Baixar
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          {loading && (
            <div className="flex h-48 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          )}

          {!loading && error && (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-center px-6">
              <File className="h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          )}

          {!loading && !error && objectUrl && (
            <>
              {isPDF && (
                <iframe
                  src={objectUrl}
                  title={file.name}
                  className="h-[70vh] w-full border-0"
                />
              )}

              {isImage && (
                <div className="flex max-h-[70vh] items-center justify-center overflow-auto bg-gray-50 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={objectUrl}
                    alt={file.name}
                    className="max-h-[65vh] max-w-full rounded-lg object-contain shadow-sm"
                  />
                </div>
              )}

              {isAudio && (
                <div className="flex items-center justify-center px-6 py-10">
                  <div className="w-full space-y-4">
                    <div className="flex items-center justify-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#eef5ff]">
                        <Music className="h-8 w-8 text-[#1a7cfa]" />
                      </div>
                    </div>
                    <p className="text-center text-sm font-medium text-gray-700">{file.name}</p>
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <audio controls src={objectUrl} className="w-full" />
                  </div>
                </div>
              )}

              {isVideo && (
                <div className="flex max-h-[70vh] items-center justify-center bg-black">
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <video
                    controls
                    src={objectUrl}
                    className="max-h-[70vh] max-w-full"
                  />
                </div>
              )}

              {!isPDF && !isImage && !isAudio && !isVideo && (
                <div className="flex h-48 flex-col items-center justify-center gap-3 px-6 text-center">
                  <File className="h-12 w-12 text-gray-300" />
                  <p className="text-sm text-gray-500">
                    Pré-visualização não disponível para este tipo de arquivo.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    Baixar arquivo
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
