'use client'

import { Play, Clock, CheckCircle } from 'lucide-react'

type VideoCardProps = {
  id: string
  title: string
  description?: string | null
  durationSeconds?: number | null
  videoUrl?: string | null
  thumbnailUrl?: string | null
  completed?: boolean
  watchedPercent?: number
  onClick: (videoId: string) => void
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function VideoCard({
  id,
  title,
  description,
  durationSeconds,
  thumbnailUrl,
  completed = false,
  watchedPercent = 0,
  onClick,
}: VideoCardProps) {
  return (
    <button
      onClick={() => onClick(id)}
      className="
        w-full text-left bg-card border border-border rounded-xl shadow-card
        hover:border-accent hover:shadow-card-hover
        transition-all duration-200 group flex gap-4 p-4 items-start
      "
    >
      {/* Thumbnail */}
      <div className="relative w-32 flex-shrink-0 aspect-video rounded-lg bg-canvas overflow-hidden">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-6 h-6 text-border" />
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-4 h-4 text-text-primary ml-0.5" fill="currentColor" />
          </div>
        </div>
        {/* Progress bar */}
        {watchedPercent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${watchedPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors leading-snug">
            {title}
          </h3>
          {completed && (
            <CheckCircle className="w-4 h-4 text-[#22C55E] dark:text-[#43e97b] flex-shrink-0 mt-0.5" />
          )}
        </div>
        {description && (
          <p className="text-xs text-text-muted mt-1 line-clamp-2">{description}</p>
        )}
        {durationSeconds && (
          <div className="flex items-center gap-1 mt-2">
            <Clock className="w-3 h-3 text-text-muted" />
            <span className="text-xs text-text-muted">{formatDuration(durationSeconds)}</span>
          </div>
        )}
      </div>
    </button>
  )
}
