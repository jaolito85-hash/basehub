'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, ImagePlus, Loader2, Package, CheckCircle, AlertCircle, X, Plus, Video, FileText, Image, Link2, Upload, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { MAX_MEDIA_PER_PRODUCT, isMediaVideoRecord, isMediaFile } from '@/lib/products/media'

export default function EditarProdutoPage() {
    const router = useRouter()
    const { id } = useParams<{ id: string }>()
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [initialLoading, setInitialLoading] = useState(true)

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)

    // Existing Contents
    const [existingVideos, setExistingVideos] = useState<any[]>([])
    const [existingManuals, setExistingManuals] = useState<any[]>([])
    const [deletedVideoIds, setDeletedVideoIds] = useState<string[]>([])
    const [deletedManualIds, setDeletedManualIds] = useState<string[]>([])

    // Pending Contents
    type PendingContent = {
        id: string
        uploadType: 'video' | 'manual' | 'media'
        category: 'sales' | 'assembly' | 'technical'
        videoSource?: 'file' | 'url'
        title: string
        description: string
        file?: File
        url?: string
    }
    const [contents, setContents] = useState<PendingContent[]>([])

    // State for the inline content form
    const [showContentForm, setShowContentForm] = useState(false)
    const [uploadType, setUploadType] = useState<'video' | 'manual' | 'media'>('video')
    const [category, setCategory] = useState<'sales' | 'assembly' | 'technical'>('sales')
    const [videoSource, setVideoSource] = useState<'file' | 'url'>('file')
    const [videoUrl, setVideoUrl] = useState('')
    const [uploadTitle, setUploadTitle] = useState('')
    const [uploadDescription, setUploadDescription] = useState('')
    const [uploadFile, setUploadFile] = useState<File | null>(null)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [dragOver, setDragOver] = useState(false)

    useEffect(() => {
        async function loadData() {
            const [{ data: prod }, { data: vids }, { data: mans }] = await Promise.all([
                supabase.from('products').select('*').eq('id', id).single(),
                supabase.from('videos').select('*').eq('product_id', id).order('created_at'),
                supabase.from('manuals').select('*').eq('product_id', id).order('created_at'),
            ])

            if (prod) {
                setName(prod.name)
                setDescription(prod.description || '')
                if (prod.thumbnail_url) {
                    setImagePreview(prod.thumbnail_url)
                    setExistingImageUrl(prod.thumbnail_url)
                }
            }
            if (vids) setExistingVideos(vids)
            if (mans) setExistingManuals(mans)

            setInitialLoading(false)
        }
        loadData()
    }, [id])

    function handleImageSelect(file: File) {
        if (!file.type.startsWith('image/')) {
            setError('Selecione apenas arquivos de imagem (JPG, PNG, WebP).')
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('A imagem deve ter no máximo 5MB.')
            return
        }
        setError(null)
        setImageFile(file)
        const reader = new FileReader()
        reader.onload = (e) => setImagePreview(e.target?.result as string)
        reader.readAsDataURL(file)
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) handleImageSelect(file)
    }

    function removeImage() {
        setImageFile(null)
        setImagePreview(null)
        setExistingImageUrl(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    function handleAddContent() {
        const isUrlVideo = uploadType === 'video' && videoSource === 'url'
        const isMedia = uploadType === 'media'
        if (!uploadTitle.trim()) return
        if (!isUrlVideo && !uploadFile) return
        if (isUrlVideo && !videoUrl.trim()) return

        if (isMedia) {
            const existingMediaCount = existingVideos.filter((v) => !deletedVideoIds.includes(v.id) && isMediaVideoRecord(v)).length
            const pendingMediaCount = contents.filter((c) => c.uploadType === 'media').length
            if (existingMediaCount + pendingMediaCount >= MAX_MEDIA_PER_PRODUCT) {
                setError('Limite de ' + MAX_MEDIA_PER_PRODUCT + ' midias por produto.')
                return
            }
            if (!isMediaFile(uploadFile)) {
                setError('Para midia, envie apenas arquivos de imagem.')
                return
            }
        }

        const newContent: PendingContent = {
            id: Math.random().toString(36).slice(2),
            uploadType,
            category,
            videoSource: uploadType === 'video' ? videoSource : undefined,
            title: uploadTitle,
            description: uploadDescription,
            file: !isUrlVideo && uploadFile ? uploadFile : undefined,
            url: isUrlVideo ? videoUrl.trim() : undefined,
        }

        setError(null)
        setContents([...contents, newContent])

        // Reset form
        setUploadTitle('')
        setUploadDescription('')
        setUploadFile(null)
        setVideoUrl('')
        setShowContentForm(false)
    }

    function removePendingContent(cid: string) {
        setContents(contents.filter(c => c.id !== cid))
    }

    function markExistingVideoForDeletion(vid: string) {
        setDeletedVideoIds([...deletedVideoIds, vid])
    }

    function markExistingManualForDeletion(mid: string) {
        setDeletedManualIds([...deletedManualIds, mid])
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) return

        setLoading(true)
        setError(null)

        let finalImageUrl = existingImageUrl

        if (imageFile) {
            const ext = imageFile.name.split('.').pop()
            const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(path, imageFile, { upsert: false })

            if (uploadError) {
                setError('Erro ao fazer upload da imagem.')
                setLoading(false)
                return
            }

            const { data: publicData } = supabase.storage.from('product-images').getPublicUrl(path)
            finalImageUrl = publicData.publicUrl
        }

        // Update Product
        const { error: updateError } = await supabase.from('products').update({
            name: name.trim(),
            description: description.trim() || null,
            thumbnail_url: finalImageUrl,
        }).eq('id', id)

        if (updateError) {
            setError('Erro ao salvar o produto.')
            setLoading(false)
            return
        }

        // Delete marked videos/manuals
        if (deletedVideoIds.length > 0) {
            await supabase.from('watch_progress').delete().in('video_id', deletedVideoIds)
            await supabase.from('videos').delete().in('id', deletedVideoIds)
        }
        if (deletedManualIds.length > 0) {
            await supabase.from('manuals').delete().in('id', deletedManualIds)
        }

        // Upload pending contents com tratamento de erro explicito
        for (const content of contents) {
            if (content.uploadType === 'video' && content.videoSource === 'url' && content.url) {
                const { error: insertUrlError } = await supabase.from('videos').insert({
                    product_id: id,
                    title: content.title,
                    description: content.description || null,
                    type: content.category,
                    video_url: content.url,
                })
                if (insertUrlError) {
                    setError(`Erro ao salvar video por URL: ${content.title}`)
                    setLoading(false)
                    return
                }
                continue
            }

            if (!content.file) {
                setError(`Arquivo ausente no conteudo: ${content.title}`)
                setLoading(false)
                return
            }

            const bucket = content.uploadType === 'video' ? 'videos' : content.uploadType === 'media' ? 'product-images' : 'manuals'
            const ext = content.file.name.split('.').pop()
            const path = content.uploadType === 'media' ? `media/${id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}` : `${id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

            const { error: storageError } = await supabase.storage.from(bucket).upload(path, content.file)
            if (storageError) {
                setError(`Erro ao enviar arquivo para ${bucket}: ${content.title}`)
                setLoading(false)
                return
            }

            const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(path)

            if (content.uploadType === 'video' || content.uploadType === 'media') {
                const { error: insertVideoError } = await supabase.from('videos').insert({
                    product_id: id,
                    title: content.title,
                    description: content.description || null,
                    type: content.category,
                    video_url: publicUrl.publicUrl,
                    storage_path: path,
                })
                if (insertVideoError) {
                    setError(`Erro ao registrar ${content.uploadType === 'media' ? 'midia' : 'video'}: ${content.title}`)
                    setLoading(false)
                    return
                }
            } else {
                const { error: insertManualError } = await supabase.from('manuals').insert({
                    product_id: id,
                    title: content.title,
                    type: content.category,
                    file_url: publicUrl.publicUrl,
                })
                if (insertManualError) {
                    setError(`Erro ao registrar manual: ${content.title}`)
                    setLoading(false)
                    return
                }
            }
        }

        setSuccess(true)
        setTimeout(() => router.push(`/produtos/${id}`), 1500)
    }

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
        )
    }

    return (
        <div className="max-w-xl space-y-6">
            {/* Header */}
            <div>
                <Link
                    href={`/produtos/${id}`}
                    className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para o Produto
                </Link>
                <h1 className="text-2xl font-bold text-text-primary">Editar Produto</h1>
                <p className="text-sm text-text-muted mt-0.5">Atualize as informações, vídeos e manuais</p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl shadow-card p-6 space-y-5">
                {/* Thumbnail */}
                <div>
                    <label className="block text-xs font-medium text-text-muted mb-2">
                        Thumbnail do Produto
                    </label>

                    {imagePreview ? (
                        <div className="relative rounded-xl overflow-hidden aspect-video bg-canvas border border-border group">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-900 text-xs font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <ImagePlus className="w-3.5 h-3.5" />
                                    Trocar
                                </button>
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    Remover
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            className={`
                aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2
                cursor-pointer transition-all
                ${dragOver
                                    ? 'border-accent bg-accent-muted'
                                    : 'border-border bg-canvas hover:border-accent hover:bg-accent-muted/30'
                                }
              `}
                        >
                            <div className="w-12 h-12 rounded-xl bg-border/20 flex items-center justify-center">
                                <Package className="w-6 h-6 text-text-muted" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-text-primary">
                                    <span className="text-accent">Clique para selecionar</span> ou arraste
                                </p>
                                <p className="text-xs text-text-muted mt-0.5">JPG, PNG, WebP · máx 5MB</p>
                            </div>
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleImageSelect(file)
                        }}
                    />
                </div>

                {/* Nome */}
                <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">
                        Nome do Produto *
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Cadeira Gamer Pro X200"
                        required
                        className="
              w-full px-3 py-2.5 rounded-lg text-sm
              bg-canvas border border-border
              text-text-primary placeholder:text-text-muted
              focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
              transition-colors
            "
                    />
                </div>

                {/* Especificações / Descrição */}
                <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">
                        Especificações / Descrição
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ex: Cadeira ergonômica com apoio lombar ajustável..."
                        rows={4}
                        className="
              w-full px-3 py-2.5 rounded-lg text-sm resize-none
              bg-canvas border border-border
              text-text-primary placeholder:text-text-muted
              focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
              transition-colors
            "
                    />
                </div>

                {/* Gerenciar Conteúdos */}
                <div className="pt-4 border-t border-border">
                    <div className="flex flex-col gap-3 mb-4">
                        <h3 className="text-sm font-bold text-text-primary">Gerenciar Conteúdos</h3>
                        <p className="text-xs text-text-muted">Revise os arquivos existentes e adicione novos.</p>
                    </div>

                    <div className="space-y-2 mb-4">
                        {/* Display Existing Videos */}
                        {existingVideos.filter(v => !deletedVideoIds.includes(v.id)).map(v => (
                            <div key={v.id} className="flex items-center justify-between p-3 bg-canvas border border-border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                                        {isMediaVideoRecord(v) ? <Image className="w-4 h-4 text-accent" /> : <Video className="w-4 h-4 text-accent" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-text-primary line-clamp-1">{v.title}</p>
                                        <p className="text-xs text-text-muted">
                                            {isMediaVideoRecord(v) ? 'Mídia' : 'Vídeo'} ({
                                                v.type === 'sales' ? '🎯 Como vender' :
                                                    v.type === 'assembly' ? '🔧 Como montar' : '📋 Ficha técnica'
                                            })
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => markExistingVideoForDeletion(v.id)}
                                    className="p-1.5 rounded-md text-text-muted hover:text-alert hover:bg-alert/10 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        {/* Display Existing Manuals */}
                        {existingManuals.filter(m => !deletedManualIds.includes(m.id)).map(m => (
                            <div key={m.id} className="flex items-center justify-between p-3 bg-canvas border border-border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-4 h-4 text-accent" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-text-primary line-clamp-1">{m.title}</p>
                                        <p className="text-xs text-text-muted">
                                            Arquivo ({
                                                m.type === 'sales' ? '🎯 Como vender' :
                                                    m.type === 'assembly' ? '🔧 Como montar' : '📋 Ficha técnica'
                                            })
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => markExistingManualForDeletion(m.id)}
                                    className="p-1.5 rounded-md text-text-muted hover:text-alert hover:bg-alert/10 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        {/* Display Pending (New) Contents */}
                        {contents.map((c) => (
                            <div key={c.id} className="flex items-center justify-between p-3 bg-accent/5 border border-accent/20 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                                        {c.uploadType === 'video' ? <Video className="w-4 h-4 text-accent" /> : c.uploadType === 'media' ? <Image className="w-4 h-4 text-accent" /> : <FileText className="w-4 h-4 text-accent" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-text-primary line-clamp-1">{c.title}</p>
                                        <p className="text-xs text-text-muted">
                                            <span className="text-accent font-medium mr-1">Novo</span>
                                            {c.uploadType === 'video' ? 'Vídeo' : c.uploadType === 'media' ? 'Mídia' : 'Arquivo'} ({
                                                c.category === 'sales' ? '🎯 Como vender' :
                                                    c.category === 'assembly' ? '🔧 Como montar' : '📋 Ficha técnica'
                                            })
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removePendingContent(c.id)}
                                    className="p-1.5 rounded-md text-text-muted hover:text-alert hover:bg-alert/10 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Form inline de adicionar conteúdo */}
                    {!showContentForm ? (
                        <button
                            type="button"
                            onClick={() => setShowContentForm(true)}
                            className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm font-medium text-text-muted hover:text-accent hover:border-accent/50 hover:bg-accent-muted/30 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Adicionar Novo Conteúdo
                        </button>
                    ) : (
                        <div className="p-4 bg-canvas border border-border rounded-xl space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-bold text-text-primary">Novo Conteúdo</h4>
                                <button type="button" onClick={() => setShowContentForm(false)} className="p-1 text-text-muted hover:text-text-primary">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Tipo de upload */}
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setUploadType('video'); setUploadFile(null); setVideoSource('file'); setVideoUrl('') }}
                                    className={`
                    p-3 rounded-lg border flex items-center gap-2 transition-all text-left
                    ${uploadType === 'video' ? 'border-accent bg-accent-muted' : 'border-border bg-card hover:border-accent/50'}
                  `}
                                >
                                    <Video className={`w-4 h-4 flex-shrink-0 ${uploadType === 'video' ? 'text-accent' : 'text-text-muted'}`} />
                                    <div>
                                        <p className={`text-xs font-semibold ${uploadType === 'video' ? 'text-accent' : 'text-text-primary'}`}>Vídeo</p>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setUploadType('manual'); setUploadFile(null); setVideoSource('file'); setVideoUrl('') }}
                                    className={`
                    p-3 rounded-lg border flex items-center gap-2 transition-all text-left
                    ${uploadType === 'manual' ? 'border-accent bg-accent-muted' : 'border-border bg-card hover:border-accent/50'}
                  `}
                                >
                                    <FileText className={`w-4 h-4 flex-shrink-0 ${uploadType === 'manual' ? 'text-accent' : 'text-text-muted'}`} />
                                    <div>
                                        <p className={`text-xs font-semibold ${uploadType === 'manual' ? 'text-accent' : 'text-text-primary'}`}>Arquivo</p>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setUploadType('media'); setUploadFile(null); setVideoSource('file'); setVideoUrl('') }}
                                    className={`
                    p-3 rounded-lg border flex items-center gap-2 transition-all text-left
                    ${uploadType === 'media' ? 'border-accent bg-accent-muted' : 'border-border bg-card hover:border-accent/50'}
                  `}
                                >
                                    <Image className={`w-4 h-4 flex-shrink-0 ${uploadType === 'media' ? 'text-accent' : 'text-text-muted'}`} />
                                    <div>
                                        <p className={`text-xs font-semibold ${uploadType === 'media' ? 'text-accent' : 'text-text-primary'}`}>Mídia</p>
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
                        ${category === opt.value ? 'border-accent bg-accent-muted text-accent' : 'border-border bg-card text-text-muted hover:border-accent/50'}
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
                        ${videoSource === 'file' ? 'border-accent bg-accent-muted text-accent' : 'border-border bg-card text-text-muted hover:border-accent/50'}
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
                        ${videoSource === 'url' ? 'border-accent bg-accent-muted text-accent' : 'border-border bg-card text-text-muted hover:border-accent/50'}
                      `}
                                        >
                                            <Link2 className="w-3.5 h-3.5" />
                                            URL
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Título & Descrição */}
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={uploadTitle}
                                    onChange={(e) => setUploadTitle(e.target.value)}
                                    placeholder={uploadType === 'video' ? 'Título do vídeo *' : uploadType === 'media' ? 'Título da mídia *' : 'Título do arquivo *'}
                                    className="w-full px-3 py-2 rounded-lg text-sm bg-card border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                                />
                                <input
                                    type="text"
                                    value={uploadDescription}
                                    onChange={(e) => setUploadDescription(e.target.value)}
                                    placeholder="Descrição (opcional)"
                                    className="w-full px-3 py-2 rounded-lg text-sm bg-card border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                                />
                            </div>

                            {/* Arquivo ou URL */}
                            {uploadType === 'video' && videoSource === 'url' ? (
                                <input
                                    type="url"
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    placeholder="URL do Vídeo (YouTube/Vimeo) *"
                                    className="w-full px-3 py-2 rounded-lg text-sm bg-card border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                                />
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full py-4 rounded-lg border-2 border-dashed border-border hover:border-accent cursor-pointer transition-colors bg-card">
                                    <Upload className="w-4 h-4 text-text-muted mb-1" />
                                    <span className="text-xs text-text-muted">
                                        {uploadFile ? uploadFile.name : uploadType === 'media' ? 'Anexar Mídia *' : 'Anexar Arquivo *'}
                                    </span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept={uploadType === 'video' ? 'video/*' : uploadType === 'media' ? 'image/*' : '*/*'}
                                        onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                                    />
                                </label>
                            )}

                            <button
                                type="button"
                                onClick={handleAddContent}
                                disabled={!uploadTitle || (uploadType === 'video' && videoSource === 'url' ? !videoUrl.trim() : !uploadFile)}
                                className="w-full py-2 rounded-lg text-xs font-semibold text-white bg-accent hover:opacity-90 disabled:opacity-50 transition-opacity"
                            >
                                Salvar Conteúdo Adicional
                            </button>
                        </div>
                    )}
                </div>

                {/* Feedback */}
                {error && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-alert/10 border border-alert/20">
                        <AlertCircle className="w-4 h-4 text-alert flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-alert">{error}</p>
                    </div>
                )}
                {success && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
                        <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                        <p className="text-xs text-success">Alterações salvas com sucesso!</p>
                    </div>
                )}

                {/* Botões */}
                <div className="flex gap-3 pt-1">
                    <Link
                        href={`/produtos/${id}`}
                        className="
              flex-1 py-2.5 rounded-lg text-sm font-semibold text-center
              bg-canvas border border-border text-text-muted
              hover:text-text-primary hover:border-text-muted
              transition-colors
            "
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={loading || !name.trim() || success}
                        className="
              flex-1 py-2.5 rounded-lg text-sm font-semibold text-white
              bg-accent hover:opacity-90 disabled:opacity-50
              transition-opacity flex items-center justify-center gap-2
            "
                    >
                        {loading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                        ) : (
                            'Salvar Alterações'
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
