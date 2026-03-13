import { createClient } from '@/lib/supabase/server'
import { normalizeRole } from '@/lib/auth/roles'
import { GraduationCap, Plus, PlayCircle } from 'lucide-react'
import Link from 'next/link'

export default async function TreinamentosPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user!.id)
        .single()

    const isAdmin = normalizeRole(profile?.role) === 'admin'

    // Buscar módulos com contagem de aulas
    const { data: modules } = await supabase
        .from('modules')
        .select(`
      id, title, description, thumbnail_url, created_at,
      lessons(count)
    `)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Treinamentos</h1>
                    <p className="text-sm text-text-muted mt-0.5">
                        {modules?.length ?? 0} módulo{modules?.length !== 1 ? 's' : ''} disponível{modules?.length !== 1 ? 'is' : ''}
                    </p>
                </div>
                {isAdmin && (
                    <Link
                        href="/treinamentos/novo"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:opacity-90 text-white text-sm font-semibold transition-opacity"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Módulo
                    </Link>
                )}
            </div>

            {/* Grid */}
            {modules && modules.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {modules.map((moduleItem) => {
                        const lessonCount = (moduleItem.lessons as any)?.[0]?.count ?? 0;
                        return (
                            <Link
                                key={moduleItem.id}
                                href={`/treinamentos/${moduleItem.id}`}
                                className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:border-accent hover:shadow-card-hover transition-all duration-300"
                            >
                                {/* Imagem (Thumbnail) */}
                                <div className="relative aspect-video bg-canvas border-b border-border overflow-hidden">
                                    {moduleItem.thumbnail_url ? (
                                        <img
                                            src={moduleItem.thumbnail_url}
                                            alt={moduleItem.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <GraduationCap className="w-10 h-10 text-border" />
                                        </div>
                                    )}
                                    {/* Overlay gradiente inferior para destacar texto se precisasse, mas vamos manter clean */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    {/* Play icon overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white">
                                            <PlayCircle className="w-6 h-6" />
                                        </div>
                                    </div>
                                </div>

                                {/* Conteúdo */}
                                <div className="flex flex-col flex-1 p-4">
                                    <h3 className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors line-clamp-1 mb-1.5 flex-none">
                                        {moduleItem.title}
                                    </h3>

                                    {moduleItem.description && (
                                        <p className="text-xs text-text-muted line-clamp-2 mb-3 flex-1">
                                            {moduleItem.description}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border">
                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-text-muted bg-canvas px-2 py-1 rounded-md border border-border">
                                            <PlayCircle className="w-3 h-3" />
                                            {lessonCount} {lessonCount === 1 ? 'aula' : 'aulas'}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            ) : (
                <div className="bg-card border border-border rounded-xl p-12 text-center shadow-card">
                    <GraduationCap className="w-12 h-12 text-border mx-auto mb-4" />
                    <h3 className="text-base font-semibold text-text-primary mb-1">Nenhum módulo disponível</h3>
                    <p className="text-sm text-text-muted mb-4">
                        {isAdmin
                            ? 'Crie o primeiro módulo para organizar seus treinamentos em vídeo.'
                            : 'Nenhum treinamento foi disponibilizado pelo fabricante ainda.'
                        }
                    </p>
                    {isAdmin && (
                        <Link
                            href="/treinamentos/novo"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:opacity-90 text-white text-sm font-semibold transition-opacity"
                        >
                            <Plus className="w-4 h-4" />
                            Criar Módulo
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}
