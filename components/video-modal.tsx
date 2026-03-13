'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Video = {
  id: string
  title: string
  description?: string | null
  video_url?: string | null
  duration_seconds?: number | null
}

type VideoModalProps = {
  video: Video | null
  onClose: () => void
}

export function VideoModal({ video, onClose }: VideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  // Fechar com Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Salvar progresso ao fechar
  const saveProgress = async () => {
    if (!video || !userId || !videoRef.current) return
    const watched = videoRef.current.currentTime
    const duration = videoRef.current.duration || video.duration_seconds || 1
    const completed = watched / duration >= 0.9

    await supabase.from('watch_progress').upsert({
      user_id: userId,
      video_id: video.id,
      watched_seconds: Math.round(watched),
      completed,
    }, { onConflict: 'user_id,video_id' })
  }

  const handleClose = async () => {
    await saveProgress()
    onClose()
  }

  if (!video) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="font-semibold text-text-primary leading-snug">{video.title}</h2>
            {video.duration_seconds && (
              <div className="flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3 text-text-muted" />
                <span className="text-xs text-text-muted">
                  {Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg hover:bg-canvas border border-transparent hover:border-border flex items-center justify-center transition-all flex-shrink-0"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        {/* Video */}
        <div className="aspect-video bg-black">
          {video.video_url ? (
            <video
              ref={videoRef}
              src={video.video_url}
              controls
              autoPlay
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-sm text-text-muted">Vídeo não disponível</p>
            </div>
          )}
        </div>

        {/* Description */}
        {video.description && (
          <div className="p-5 border-t border-border">
            <p className="text-sm text-text-muted leading-relaxed">{video.description}</p>
          </div>
        )}
      </div>
    </div>
  )
}
