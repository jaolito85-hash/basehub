'use client'

import { useEffect, useState } from 'react'
import { useParams, notFound, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { VideoCard } from '@/components/video-card'
import { VideoModal } from '@/components/video-modal'
import { Package, FileText, ExternalLink, ArrowLeft, Play, Pencil, Trash2, X, Check, Loader2, Upload, Video, Image, Link2, Plus, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { MAX_MEDIA_PER_PRODUCT, isMediaVideoRecord, isMediaFile } from '@/lib/products/media'

type Tab = 'sales' | 'assembly' | 'technical'

const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: 'sales', label: 'Como Vender', emoji: '🎯' },
  { key: 'assembly', label: 'Como Montar', emoji: '🔧' },
  { key: 'technical', label: 'Ficha Técnica', emoji: '📋' },
]

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [product, setProduct] = useState<any>(null)
  const [videos, setVideos] = useState<any[]>([])
  const [manuals, setManuals] = useState<any[]>([])
  const [progress, setProgress] = useState<Record<string, { watched_seconds: number; completed: boolean }>>({})
  const [activeTab, setActiveTab] = useState<Tab>('sales')
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Delete states
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Upload states
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadType, setUploadType] = useState<'video' | 'manual' | 'media'>('video')
  const [category, setCategory] = useState<'sales' | 'assembly' | 'technical'>('sales')
  const [videoSource, setVideoSource] = useState<'file' | 'url'>('file')
  const [videoUrl, setVideoUrl] = useState('')
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [
        { data: prod },
        { data: vids },
        { data: mans },
        { data: { user } },
      ] = await Promise.all([
        supabase.from('products').select('*').eq('id', id).single(),
        supabase.from('videos').select('*').eq('product_id', id).order('created_at'),
        supabase.from('manuals').select('*').eq('product_id', id).order('created_at'),
        supabase.auth.getUser(),
      ])

      if (!prod) { notFound(); return }
      setProduct(prod)
      setVideos(vids ?? [])
      setManuals(mans ?? [])

      if (user && vids && vids.length > 0) {
        const videoIds = vids.map((v: any) => v.id)
        const { data: prog } = await supabase
          .from('watch_progress')
          .select('video_id, watched_seconds, completed')
          .eq('user_id', user.id)
          .in('video_id', videoIds)

        if (prog) {
          const map: Record<string, any> = {}
          prog.forEach((p) => { map[p.video_id] = p })
          setProgress(map)
        }
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-border rounded-lg w-48 animate-pulse" />
        <div className="h-32 bg-border rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!product) return null

  const filteredVideos = videos.filter((v) => v.type === activeTab && !isMediaVideoRecord(v))
  const filteredManuals = manuals.filter((m) => m.type === activeTab)
  const filteredMedia = videos.filter((v) => v.type === activeTab && isMediaVideoRecord(v))

  async function deleteProduct() {
    setDeleting(true)
    await supabase.from('watch_progress').delete().in(
      'video_id',
      videos.map((v) => v.id)
    )
    await supabase.from('videos').delete().eq('product_id', id)
    await supabase.from('manuals').delete().eq('product_id', id)
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) {
      router.push('/produtos')
    }
    setDeleting(false)
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const isUrlVideo = uploadType === 'video' && videoSource === 'url'
    const isMedia = uploadType === 'media'
    if (!isUrlVideo && (!uploadFile || !uploadTitle)) return
    if (isUrlVideo && (!videoUrl.trim() || !uploadTitle)) return

    if (isMedia) {
      const currentMediaCount = videos.filter((v) => isMediaVideoRecord(v)).length
      if (currentMediaCount >= MAX_MEDIA_PER_PRODUCT) {
        setUploadError('Limite de ' + MAX_MEDIA_PER_PRODUCT + ' midias por produto.')
        return
      }
      if (!isMediaFile(uploadFile)) {
        setUploadError('Para midia, envie apenas arquivos de imagem.')
        return
      }
    }

    setUploading(true)
    setUploadError(null)
    setUploadProgress(0)

    if (isUrlVideo) {
      const { error: insertError } = await supabase.from('videos').insert({
        product_id: id,
        title: uploadTitle,
        description: uploadDescription || null,
        type: category,
        video_url: videoUrl.trim(),
      })
      if (insertError) {
        setUploadError('Erro ao salvar o v\u00eddeo. Tente novamente.')
        setUploading(false)
        return
      }
    } else {
      const bucket = uploadType === 'video' ? 'videos' : uploadType === 'media' ? 'product-images' : 'manuals'
      const ext = uploadFile!.name.split('.').pop()
      const path = uploadType === 'media' ? `media/${id}/${Date.now()}.${ext}` : `${id}/${Date.now()}.${ext}`

      const { error: storageError } = await supabase.storage
        .from(bucket)
        .upload(path, uploadFile!, {
          onUploadProgress: (event: { loaded: number; total?: number }) => {
            if (event.total) {
              setUploadProgress(Math.round(event.loaded / event.total * 100))
            }
          },
        } as any)

      if (storageError) {
        setUploadError('Erro ao fazer upload do arquivo.')
        setUploading(false)
        return
      }

      const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(path)

      if (uploadType === 'video' || uploadType === 'media') {
        const { error: insertError } = await supabase.from('videos').insert({
          product_id: id,
          title: uploadTitle,
          description: uploadDescription || null,
          type: category,
          video_url: publicUrl.publicUrl,
          storage_path: path,
        })
        if (insertError) {
          setUploadError(uploadType === 'media' ? 'Erro ao salvar a midia.' : 'Erro ao salvar o video.')
          setUploading(false)
          return
        }
      } else {
        const { error: insertError } = await supabase.from('manuals').insert({
          product_id: id,
          title: uploadTitle,
          type: category,
          file_url: publicUrl.publicUrl,
        })
        if (insertError) {
          setUploadError('Erro ao salvar o manual.')
          setUploading(false)
          return
        }
      }
    }

    // Refresh data
    const [{ data: vids }, { data: mans }] = await Promise.all([
      supabase.from('videos').select('*').eq('product_id', id).order('created_at'),
      supabase.from('manuals').select('*').eq('product_id', id).order('created_at'),
    ])
    setVideos(vids ?? [])
    setManuals(mans ?? [])

    setUploadSuccess(true)
    setUploading(false)
    setUploadTitle('')
    setUploadDescription('')
    setUploadFile(null)
    setVideoUrl('')
    setUploadProgress(0)
    setTimeout(() => {
      setUploadSuccess(false)
      setShowUploadForm(false)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/produtos" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Voltar para Produtos
      </Link>

      {/* Header do produto */}
      <div className="bg-card border border-border rounded-xl shadow-card p-6">
        <div className="flex flex-col md:flex-row md:items-start gap-5">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-canvas border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
            {product.thumbnail_url ? (
              <img src={product.thumbnail_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-8 h-8 md:w-10 md:h-10 text-border" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-text-primary mb-1.5">{product.name}</h1>
                {product.description && (
                  <p className="text-sm text-text-muted mt-1 leading-relaxed max-w-2xl">{product.description}</p>
                )}
                <div className="flex items-center gap-3 mt-4">
                  <span className="text-xs text-text-muted bg-canvas border border-border px-2.5 py-1 rounded-full">
                    {videos.length} vídeo{videos.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-text-muted bg-canvas border border-border px-2.5 py-1 rounded-full">
                    {manuals.length} manual{manuals.length !== 1 ? 'is' : ''}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/produtos/${id}/editar`}
                  className="px-4 py-2 bg-canvas border border-border rounded-xl text-sm font-semibold text-text-primary hover:text-accent hover:border-accent/50 transition-colors flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </Link>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-[#EF4444]/10 text-[#EF4444] rounded-xl text-sm font-semibold hover:bg-[#EF4444]/20 transition-colors flex items-center gap-2 border border-[#EF4444]/20"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vídeo do Produto */}
      {
        product.video_url && (() => {
          const url = product.video_url
          let embedUrl = ''
          const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
          if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`
          const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/)
          if (vimeoMatch) embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`

          return (
            <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                <Play className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-text-primary">Vídeo do Produto</h3>
              </div>
              {embedUrl ? (
                <div className="aspect-video">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`Vídeo - ${product.name}`}
                  />
                </div>
              ) : (
                <div className="p-5">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-xl bg-canvas border border-border hover:border-accent hover:shadow-card-hover transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Play className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
                        Assistir Vídeo
                      </p>
                      <p className="text-xs text-text-muted truncate">{url}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors flex-shrink-0" />
                  </a>
                </div>
              )}
            </div>
          )
        })()
      }

      {/* Upload de Conteúdo (inline) */}
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-canvas/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Plus className={`w-4 h-4 text-accent transition-transform duration-200 ${showUploadForm ? 'rotate-45' : ''}`} />
            <span className="text-sm font-semibold text-text-primary">Adicionar Conteúdo</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-200 ${showUploadForm ? 'rotate-180' : ''}`} />
        </button>

        {showUploadForm && (
          <form onSubmit={handleUpload} className="border-t border-border p-5 space-y-4">
            {/* Tipo de upload */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setUploadType('video'); setUploadFile(null); setVideoSource('file'); setVideoUrl('') }}
                className={`
                  p-3 rounded-lg border-2 flex items-center gap-2 transition-all text-left
                  ${uploadType === 'video'
                    ? 'border-accent bg-accent-muted'
                    : 'border-border bg-canvas hover:border-accent/50'
                  }
                `}
              >
                <Video className={`w-4 h-4 flex-shrink-0 ${uploadType === 'video' ? 'text-accent' : 'text-text-muted'}`} />
                <div>
                  <p className={`text-xs font-semibold ${uploadType === 'video' ? 'text-accent' : 'text-text-primary'}`}>Vídeo</p>
                  <p className="text-[10px] text-text-muted">MP4, YouTube, Vimeo</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => { setUploadType('manual'); setUploadFile(null); setVideoSource('file'); setVideoUrl('') }}
                className={`
                  p-3 rounded-lg border-2 flex items-center gap-2 transition-all text-left
                  ${uploadType === 'manual'
                    ? 'border-accent bg-accent-muted'
                    : 'border-border bg-canvas hover:border-accent/50'
                  }
                `}
              >
                <FileText className={`w-4 h-4 flex-shrink-0 ${uploadType === 'manual' ? 'text-accent' : 'text-text-muted'}`} />
                <div>
                  <p className={`text-xs font-semibold ${uploadType === 'manual' ? 'text-accent' : 'text-text-primary'}`}>Manual PDF</p>
                  <p className="text-[10px] text-text-muted">Até 50MB</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => { setUploadType('media'); setUploadFile(null); setVideoSource('file'); setVideoUrl('') }}
                className={`
                  p-3 rounded-lg border-2 flex items-center gap-2 transition-all text-left
                  ${uploadType === 'media'
                    ? 'border-accent bg-accent-muted'
                    : 'border-border bg-canvas hover:border-accent/50'
                  }
                `}
              >
                <Image className={`w-4 h-4 flex-shrink-0 ${uploadType === 'media' ? 'text-accent' : 'text-text-muted'}`} />
                <div>
                  <p className={`text-xs font-semibold ${uploadType === 'media' ? 'text-accent' : 'text-text-primary'}`}>Midia</p>
                  <p className="text-[10px] text-text-muted">Ate 5 imagens</p>
                </div>
              </button>
            </div>

            {/* Categoria (agora para ambos) */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Aba do Conteúdo *</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'sales', label: '🎯 Como vender' },
                  { value: 'assembly', label: '🔧 Como montar' },
                  { value: 'technical', label: '📋 Ficha técnica' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCategory(opt.value as any)}
                    className={`
                      py-2 px-2 rounded-lg text-xs font-medium border transition-all
                      ${category === opt.value
                        ? 'border-accent bg-accent-muted text-accent'
                        : 'border-border bg-canvas text-text-muted hover:border-accent/50'
                      }
                    `}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Origem do vídeo */}
            {uploadType === 'video' && (
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Origem *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setVideoSource('file'); setVideoUrl('') }}
                    className={`
                      py-2 px-3 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1.5
                      ${videoSource === 'file'
                        ? 'border-accent bg-accent-muted text-accent'
                        : 'border-border bg-canvas text-text-muted hover:border-accent/50'
                      }
                    `}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => { setVideoSource('url'); setUploadFile(null) }}
                    className={`
                      py-2 px-3 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1.5
                      ${videoSource === 'url'
                        ? 'border-accent bg-accent-muted text-accent'
                        : 'border-border bg-canvas text-text-muted hover:border-accent/50'
                      }
                    `}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    URL
                  </button>
                </div>
              </div>
            )}

            {/* Título */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Título *</label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder={uploadType === 'video' ? 'Ex: Como apresentar o produto' : uploadType === 'media' ? 'Ex: Galeria do produto' : 'Ex: Manual de Montagem'}
                required
                className="w-full px-3 py-2 rounded-lg text-sm bg-canvas border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Descrição (opcional)</label>
              <input
                type="text"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Descreva o conteúdo..."
                className="w-full px-3 py-2 rounded-lg text-sm bg-canvas border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
              />
            </div>

            {/* Arquivo ou URL */}
            {uploadType === 'video' && videoSource === 'url' ? (
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">URL do Vídeo *</label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                  className="w-full px-3 py-2 rounded-lg text-sm bg-canvas border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
                />
                {/* Preview */}
                {videoUrl.trim() && (() => {
                  const url = videoUrl.trim()
                  let embedUrl = ''
                  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
                  if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`
                  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/)
                  if (vimeoMatch) embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`
                  if (embedUrl) {
                    return (
                      <div className="mt-2 rounded-lg overflow-hidden border border-border bg-black aspect-video">
                        <iframe src={embedUrl} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Preview" />
                      </div>
                    )
                  }
                  return null
                })()}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  {uploadType === 'video' ? 'Arquivo de Video *' : uploadType === 'media' ? 'Arquivo de Midia *' : 'Arquivo PDF *'}
                </label>
                <label className="flex flex-col items-center justify-center w-full py-6 rounded-lg border-2 border-dashed border-border hover:border-accent cursor-pointer transition-colors bg-canvas">
                  <Upload className="w-5 h-5 text-text-muted mb-1.5" />
                  <span className="text-xs text-text-muted">
                    {uploadFile ? uploadFile.name : 'Clique para selecionar'}
                  </span>
                  {uploadFile && (
                    <span className="text-[10px] text-accent mt-0.5">{(uploadFile.size / 1024 / 1024).toFixed(1)} MB</span>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept={uploadType === 'video' ? 'video/*' : uploadType === 'media' ? 'image/*' : 'application/pdf'}
                    onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            )}

            {/* Progress */}
            {uploading && uploadProgress > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-text-muted">Enviando...</span>
                  <span className="text-[10px] font-medium text-accent">{uploadProgress}%</span>
                </div>
                <div className="h-1.5 bg-canvas border border-border rounded-full overflow-hidden">
                  <div className="h-full bg-accent transition-all duration-300 rounded-full" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {/* Feedback */}
            {uploadError && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-alert/10 border border-alert/20">
                <p className="text-xs text-alert">{uploadError}</p>
              </div>
            )}
            {uploadSuccess && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-success/10 border border-success/20">
                <Check className="w-3.5 h-3.5 text-success flex-shrink-0" />
                <p className="text-xs text-success">Conteúdo adicionado com sucesso!</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={uploading || !uploadTitle || (uploadType === 'video' && videoSource === 'url' ? !videoUrl.trim() : !uploadFile)}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-accent hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
            >
              {uploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
              ) : (
                <><Upload className="w-4 h-4" /> Adicionar</>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Tabs */}
      <div>
        <div className="flex border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150
                ${activeTab === tab.key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
                }
              `}
            >
              <span>{tab.emoji}</span>
              {tab.label}
              <span className="text-[11px] bg-canvas border border-border px-1.5 py-0.5 rounded-full">
                {videos.filter(v => v.type === tab.key && !isMediaVideoRecord(v)).length + manuals.filter(m => m.type === tab.key).length + videos.filter(v => v.type === tab.key && isMediaVideoRecord(v)).length}
              </span>
            </button>
          ))}
        </div>

        {/* Conteúdo das abas */}
        <div className="mt-4">
          <div className="space-y-6">
            {/* Vídeos */}
            {filteredVideos.length > 0 && (
              <div className="space-y-3">
                {filteredVideos.map((video) => {
                  const prog = progress[video.id]
                  const duration = video.duration_seconds || 1
                  const watchedPercent = prog ? Math.min(100, Math.round(prog.watched_seconds / duration * 100)) : 0
                  return (
                    <VideoCard
                      key={video.id}
                      id={video.id}
                      title={video.title}
                      description={video.description}
                      durationSeconds={video.duration_seconds}
                      videoUrl={video.video_url}
                      completed={prog?.completed ?? false}
                      watchedPercent={watchedPercent}
                      onClick={(videoId) => setSelectedVideo(videos.find(v => v.id === videoId))}
                    />
                  )
                })}
              </div>
            )}

            {/* Manuais PDF */}
            {filteredManuals.length > 0 && (
              <div className="space-y-2">
                {filteredManuals.map((manual: any) => (
                  <a
                    key={manual.id}
                    href={manual.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      flex items-center gap-3 p-4 rounded-xl
                      bg-card border border-border shadow-card
                      hover:border-accent hover:shadow-card-hover
                      transition-all duration-200 group
                    "
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#EF4444]/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-[#EF4444]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                        {manual.title}
                      </p>
                      {manual.description && (
                        <p className="text-xs text-text-muted truncate">{manual.description}</p>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors flex-shrink-0" />
                  </a>
                ))}
              </div>
            )}

            {/* Midias */}
            {filteredMedia.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredMedia.map((media: any) => (
                  <a
                    key={media.id}
                    href={media.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-card border border-border rounded-xl overflow-hidden shadow-card hover:border-accent hover:shadow-card-hover transition-all duration-200 group"
                  >
                    <div className="aspect-video bg-canvas overflow-hidden">
                      <img src={media.video_url} alt={media.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200" />
                    </div>
                    <div className="p-3 flex items-center gap-2">
                      <Image className="w-4 h-4 text-accent flex-shrink-0" />
                      <p className="text-sm font-medium text-text-primary truncate">{media.title}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {filteredVideos.length === 0 && filteredManuals.length === 0 && filteredMedia.length === 0 && (
              <div className="bg-card border border-border rounded-xl p-10 text-center shadow-card">
                <p className="text-sm text-text-muted">Nenhum conteudo adicionado nesta aba.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Modal */}
      <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />

      {/* Delete Confirmation Modal */}
      {
        showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !deleting && setShowDeleteModal(false)} />
            <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EF4444]/10 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-[#EF4444]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">Excluir Produto</h3>
                  <p className="text-xs text-text-muted">Esta ação não pode ser desfeita</p>
                </div>
              </div>
              <p className="text-sm text-text-muted leading-relaxed">
                Tem certeza que deseja excluir <strong className="text-text-primary">{product.name}</strong>?
                Todos os videos, midias e manuais associados tambem serao removidos.
              </p>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="
                  flex-1 py-2.5 rounded-lg text-sm font-semibold
                  bg-canvas border border-border text-text-muted
                  hover:text-text-primary hover:border-text-muted
                  transition-colors disabled:opacity-50
                "
                >
                  Cancelar
                </button>
                <button
                  onClick={deleteProduct}
                  disabled={deleting}
                  className="
                  flex-1 py-2.5 rounded-lg text-sm font-semibold text-white
                  bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-50
                  transition-colors flex items-center justify-center gap-2
                "
                >
                  {deleting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Excluindo...</>
                  ) : (
                    <><Trash2 className="w-4 h-4" /> Excluir</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}
