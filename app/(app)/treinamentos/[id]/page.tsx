import { createClient } from '@/lib/supabase/server'
import { normalizeRole } from '@/lib/auth/roles'
import { GraduationCap, ArrowLeft, Plus, Play, MoreVertical, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function DetalhesModuloPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user!.id)
        .single()

    const isAdmin = normalizeRole(profile?.role) === 'admin'

    const { data: moduleData } = await supabase
        .from('modules')
        .select(`
      *,
      lessons(*)
    `)
        .eq('id', params.id)
        .single()

    if (!moduleData) {
        notFound()
    }

    // Ordenar aulas pela coluna order ou created_at
    const lessons = [...(moduleData.lessons || [])].sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

    return (
        <div className="space-y-6">
            {/* Back & Header */}
            <div className="flex items-start gap-4">
                <Link
                    href="/treinamentos"
                    className="p-2 mt-1 rounded-lg hover:bg-canvas text-text-muted hover:text-text-primary transition-colors border border-transparent hover:border-border"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-text-primary mb-1.5">{moduleData.title}</h1>
                            {moduleData.description && (
                                <p className="text-sm text-text-muted leading-relaxed max-w-3xl">{moduleData.description}</p>
                            )}
                        </div>

                        {isAdmin && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <Link
                                    href={`/treinamentos/${moduleData.id}/aulas/nova`}
                                    className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Nova Aula
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lista de Aulas */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-base font-bold text-text-primary">Conteúdo do Módulo</h2>
                    <span className="text-xs font-medium text-text-muted bg-canvas border border-border px-2.5 py-1 rounded-full">
                        {lessons.length} aula{lessons.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {lessons.length > 0 ? (
                    <div className="grid gap-3">
                        {lessons.map((lesson, index) => (
                            <Link
                                key={lesson.id}
                                href={`/treinamentos/${moduleData.id}/aulas/${lesson.id}`}
                                className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-accent hover:shadow-card-hover transition-all duration-300"
                            >
                                {/* Thumb/Ícone da Aula */}
                                <div className="relative w-full sm:w-40 aspect-video bg-canvas border-border rounded-lg overflow-hidden flex-shrink-0">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-accent transition-all duration-300">
                                            <Play className="w-4 h-4 text-accent group-hover:text-white" />
                                        </div>
                                    </div>
                                    {/* Se tiver thumb do YouTube pode por no futuro, hoje é só um bg */}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-accent">Aula {index + 1}</span>
                                    </div>
                                    <h3 className="text-base font-bold text-text-primary line-clamp-1 mb-1 group-hover:text-accent transition-colors">
                                        {lesson.title}
                                    </h3>
                                    {lesson.description && (
                                        <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                                            {lesson.description}
                                        </p>
                                    )}
                                </div>

                                {/* Ações / Play */}
                                <div className="hidden sm:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs font-semibold text-accent px-3 py-1.5 rounded-lg bg-accent/10">Assistir</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-xl p-12 text-center shadow-card">
                        <Play className="w-12 h-12 text-border mx-auto mb-4 opacity-50" />
                        <h3 className="text-base font-semibold text-text-primary mb-1">Este módulo ainda não possui aulas</h3>
                        <p className="text-sm text-text-muted mb-4">
                            {isAdmin
                                ? 'Adicione a primeira aula para começar a treinar suas lojas parceiras.'
                                : 'O fabricante ainda está preparando o conteúdo deste módulo.'
                            }
                        </p>
                        {isAdmin && (
                            <Link
                                href={`/treinamentos/${moduleData.id}/aulas/nova`}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:opacity-90 text-white text-sm font-semibold transition-opacity"
                            >
                                <Plus className="w-4 h-4" />
                                Adicionar Aula
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
