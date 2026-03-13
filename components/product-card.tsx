import Link from 'next/link'
import { Package, Video, FileText } from 'lucide-react'

type ProductCardProps = {
  id: string
  name: string
  description?: string | null
  videoCount?: number
  manualCount?: number
  imageUrl?: string | null
}

export function ProductCard({ id, name, description, videoCount = 0, manualCount = 0, imageUrl }: ProductCardProps) {
  return (
    <Link
      href={`/produtos/${id}`}
      className="
        bg-card border border-border rounded-xl shadow-card
        hover:border-accent hover:shadow-card-hover
        transition-all duration-200 group flex flex-col overflow-hidden
      "
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-canvas relative overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-border" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-sm text-text-primary group-hover:text-accent transition-colors leading-snug">
          {name}
        </h3>
        {description && (
          <p className="text-xs text-text-muted mt-1 line-clamp-2 flex-1">{description}</p>
        )}

        {/* Badges */}
        <div className="flex items-center gap-2 mt-3">
          {videoCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-accent bg-accent-muted px-2 py-0.5 rounded-full">
              <Video className="w-3 h-3" />
              {videoCount} vídeo{videoCount !== 1 ? 's' : ''}
            </span>
          )}
          {manualCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-text-muted bg-canvas px-2 py-0.5 rounded-full border border-border">
              <FileText className="w-3 h-3" />
              {manualCount} manual{manualCount !== 1 ? 'is' : ''}
            </span>
          )}
          {videoCount === 0 && manualCount === 0 && (
            <span className="text-[11px] text-text-muted">Sem conteúdo ainda</span>
          )}
        </div>
      </div>
    </Link>
  )
}
