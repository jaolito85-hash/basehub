'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, ImagePlus, Loader2, GraduationCap, AlertCircle, X } from 'lucide-react'
import Link from 'next/link'

export default function NovoModuloPage() {
    const router = useRouter()
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Basic info
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')

    // Thumbnail
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        handleFileSelect(file)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        handleFileSelect(file)
    }

    const handleFileSelect = (file?: File) => {
        if (!file) return
        if (!file.type.startsWith('image/')) {
            setError('Por favor, selecione apenas arquivos de imagem.')
            return
        }

        setThumbnailFile(file)
        const reader = new FileReader()
        reader.onloadend = () => {
            setThumbnailPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
        setError(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title) {
            setError('O título do módulo é obrigatório.')
            return
        }

        setLoading(true)
        setError(null)

        try {
            let thumbnail_url = null

            if (thumbnailFile) {
                const fileExt = thumbnailFile.name.split('.').pop()
                const fileName = `${Math.random()}.${fileExt}`
                const filePath = `modules/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(filePath, thumbnailFile)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(filePath)

                thumbnail_url = publicUrl
            }

            // Salvar módulo
            const { data: moduleData, error: dbError } = await supabase
                .from('modules')
                .insert([
                    {
                        title,
                        description: description || null,
                        thumbnail_url
                    }
                ])
                .select()
                .single()

            if (dbError) throw dbError

            router.push(`/treinamentos/${moduleData.id}`)
        } catch (err: any) {
            console.error('Error creating module:', err)
            setError(err.message || 'Ocorreu um erro ao criar o módulo. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b border-border">
                <div className="flex items-center gap-4">
                    <Link
                        href="/treinamentos"
                        className="p-2 rounded-lg hover:bg-canvas text-text-muted hover:text-text-primary transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">Novo Módulo</h1>
                        <p className="text-sm text-text-muted mt-0.5">Crie um novo módulo de treinamento</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl text-sm text-[#EF4444] flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}

            {/* Main Info Card */}
            <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
                <div className="p-6 space-y-6">
                    <div className="flex gap-6">
                        {/* Thumbnail Upload */}
                        <div className="w-32 flex-shrink-0">
                            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                                Capa do Módulo
                            </label>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`
                  relative w-32 h-32 rounded-xl border-2 border-dashed overflow-hidden
                  flex flex-col items-center justify-center cursor-pointer transition-all
                  ${isDragging
                                        ? 'border-accent bg-accent/5'
                                        : 'border-border bg-canvas hover:border-accent/50 hover:bg-canvas/50'
                                    }
                `}
                            >
                                {thumbnailPreview ? (
                                    <>
                                        <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                            <ImagePlus className="w-6 h-6 text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-text-muted">
                                        <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center">
                                            <ImagePlus className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-medium text-center px-2">Capa</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Inputs */}
                        <div className="flex-1 space-y-5">
                            <div>
                                <label htmlFor="title" className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                                    Título do Módulo *
                                </label>
                                <input
                                    id="title"
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ex: Instalação Avançada CFTV"
                                    className="w-full px-4 py-2.5 bg-canvas border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                                    Descrição (Opcional)
                                </label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Descreva o que será ensinado neste módulo..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-canvas border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
                <Link
                    href="/treinamentos"
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
                    aria-disabled={loading}
                    onClick={(e) => loading && e.preventDefault()}
                >
                    Cancelar
                </Link>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent hover:opacity-90 text-white text-sm font-bold transition-all disabled:opacity-50 shadow-sm"
                >
                    {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Criando Módulo...</>
                    ) : (
                        <><GraduationCap className="w-4 h-4" /> Criar Módulo</>
                    )}
                </button>
            </div>
        </form>
    )
}
