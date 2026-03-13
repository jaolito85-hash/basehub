import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, PlayCircle, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

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

export default async function AulaPage({ params }: { params: { id: string, aulaId: string } }) {
    const supabase = await createClient()

    // Buscar a aula atual
    const { data: currentLesson } = await supabase
        .from('lessons')
        .select(`*`)
        .eq('id', params.aulaId)
        .single()

    if (!currentLesson) {
        notFound()
    }

    // Buscar o módulo e todas as suas aulas para navegação
    const { data: moduleData } = await supabase
        .from('modules')
        .select(`
      id, title,
      lessons(id, title, "order", created_at)
    `)
        .eq('id', params.id)
        .single()

    const lessonsList = [...(moduleData?.lessons || [])].sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

    const currentIndex = lessonsList.findIndex(l => l.id === params.aulaId)
    const prevLesson = currentIndex > 0 ? lessonsList[currentIndex - 1] : null
    const nextLesson = currentIndex < lessonsList.length - 1 ? lessonsList[currentIndex + 1] : null

    const videoId = extractYoutubeId(currentLesson.video_url)

    return (
        <div className="flex flex-col lg:flex-row gap-6">

            {/* Área Principal (Vídeo e Infos) */}
            <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3 pb-2">
                    <Link
                        href={`/treinamentos/${params.id}`}
                        className="flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-text-primary transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para Módulo
                    </Link>
                    <span className="text-text-muted/50">•</span>
                    <span className="text-sm font-medium text-text-primary line-clamp-1">{moduleData?.title}</span>
                </div>

                {/* Video Player */}
                <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative border border-border/10">
                    {videoId ? (
                        <iframe
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                            className="absolute top-0 left-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : currentLesson.video_url.includes('vimeo') ? (
                        <iframe
                            src={currentLesson.video_url}
                            className="absolute top-0 left-0 w-full h-full"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full text-text-muted">
                            <PlayCircle className="w-16 h-16 mb-4 opacity-50" />
                            <a href={currentLesson.video_url} target="_blank" rel="noreferrer" className="underline hover:text-white transition-colors">
                                Abrir vídeo em nova aba
                            </a>
                        </div>
                    )}
                </div>

                {/* Navegação e Infos */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-card space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-bold text-accent mb-1">Aula {currentIndex + 1}</p>
                            <h1 className="text-2xl font-bold text-text-primary mb-3 leading-tight">{currentLesson.title}</h1>
                            {currentLesson.description && (
                                <p className="text-sm text-text-muted leading-relaxed max-w-3xl whitespace-pre-wrap">
                                    {currentLesson.description}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                            {/* Controls para navegar */}
                            <div className="flex items-center gap-2">
                                {prevLesson ? (
                                    <Link
                                        href={`/treinamentos/${params.id}/aulas/${prevLesson.id}`}
                                        className="p-2 rounded-xl bg-canvas border border-border text-text-primary hover:border-accent hover:text-accent transition-all"
                                        title="Aula anterior"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </Link>
                                ) : (
                                    <div className="p-2 rounded-xl bg-canvas border border-border text-text-muted opacity-50 cursor-not-allowed">
                                        <ChevronLeft className="w-5 h-5" />
                                    </div>
                                )}

                                {nextLesson ? (
                                    <Link
                                        href={`/treinamentos/${params.id}/aulas/${nextLesson.id}`}
                                        className="p-2 rounded-xl bg-accent text-white hover:opacity-90 transition-opacity flex items-center gap-1.5 px-4 font-semibold text-sm"
                                    >
                                        Próxima
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                ) : (
                                    <div className="p-2 rounded-xl bg-success/10 border border-success/20 text-success flex items-center gap-1.5 px-4 font-semibold text-sm cursor-default">
                                        <CheckCircle className="w-4 h-4" />
                                        Módulo Concluído
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar - Lista de Aulas */}
            <div className="w-full lg:w-80 flex-shrink-0">
                <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden sticky top-6">
                    <div className="p-4 border-b border-border bg-canvas">
                        <h3 className="font-bold text-text-primary">Conteúdo do Módulo</h3>
                        <p className="text-xs text-text-muted mt-0.5">{lessonsList.length} aulas</p>
                    </div>

                    <div className="max-h-[calc(100vh-12rem)] overflow-y-auto w-full scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                        {lessonsList.map((lesson, index) => {
                            const isCurrent = lesson.id === params.aulaId

                            return (
                                <Link
                                    key={lesson.id}
                                    href={`/treinamentos/${params.id}/aulas/${lesson.id}`}
                                    className={`
                    w-full flex items-start gap-3 p-4 border-b border-border transition-colors last:border-0
                    ${isCurrent ? 'bg-accent/5' : 'hover:bg-canvas'}
                  `}
                                >
                                    <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold mt-0.5
                    ${isCurrent ? 'bg-accent text-white' : 'bg-surface border border-border text-text-muted'}
                  `}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-semibold line-clamp-2 leading-snug ${isCurrent ? 'text-accent' : 'text-text-primary'}`}>
                                            {lesson.title}
                                        </h4>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </div>

        </div>
    )
}
