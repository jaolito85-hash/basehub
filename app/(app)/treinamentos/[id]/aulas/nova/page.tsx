'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, PlaySquare, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function NovaAulaPage() {
    const router = useRouter()
    const params = useParams()
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Basic info
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [videoUrl, setVideoUrl] = useState('')

    const extractYoutubeId = (url: string) => {
        if (!url) return null
        try {
            if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0]
            if (url.includes('youtube.com/watch')) {
                const urlParams = new URL(url).searchParams
                return urlParams.get('v')
            }
            return null
        } catch {
            return null
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title || !videoUrl) {
            setError('O título e o link do vídeo são obrigatórios.')
            return
        }

        const videoId = extractYoutubeId(videoUrl)
        if (!videoId && !videoUrl.includes('vimeo')) {
            setError('Por favor, insira um link válido do YouTube ou Vimeo.')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const { data: moduleData, error: dbError } = await supabase
                .from('lessons')
                .insert([
                    {
                        module_id: params.id,
                        title,
                        description: description || null,
                        video_url: videoUrl
                    }
                ])
                .select()
                .single()

            if (dbError) throw dbError

            router.push(`/treinamentos/${params.id}`)
        } catch (err: any) {
            console.error('Error creating lesson:', err)
            setError(err.message || 'Ocorreu um erro ao criar a aula. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 pb-6 border-b border-border">
                <Link
                    href={`/treinamentos/${params.id}`}
                    className="p-2 rounded-lg hover:bg-canvas text-text-muted hover:text-text-primary transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Nova Aula</h1>
                    <p className="text-sm text-text-muted mt-0.5">Adicione um novo conteúdo em vídeo ao módulo</p>
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
                <div className="p-6 space-y-5">
                    <div>
                        <label htmlFor="title" className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                            Título da Aula *
                        </label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: 01. Montagem do Equipamento"
                            className="w-full px-4 py-2.5 bg-canvas border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="videoUrl" className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                            Link do Vídeo (YouTube/Vimeo) *
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <PlaySquare className="h-4 w-4 text-text-muted/70" />
                            </div>
                            <input
                                id="videoUrl"
                                type="url"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="w-full pl-10 pr-4 py-2.5 bg-canvas border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                required
                            />
                        </div>
                        {videoUrl && extractYoutubeId(videoUrl) && (
                            <div className="mt-3 rounded-lg overflow-hidden border border-border aspect-video max-w-sm">
                                <iframe
                                    src={`https://www.youtube.com/embed/${extractYoutubeId(videoUrl)}`}
                                    className="w-full h-full"
                                    allowFullScreen
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                            Descrição (Opcional)
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descreva o conteúdo desta aula..."
                            rows={4}
                            className="w-full px-4 py-2.5 bg-canvas border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
                <Link
                    href={`/treinamentos/${params.id}`}
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
                        <><Loader2 className="w-4 h-4 animate-spin" /> Adicionando...</>
                    ) : (
                        <>Adicionar Aula</>
                    )}
                </button>
            </div>
        </form>
    )
}
