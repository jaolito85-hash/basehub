import { createClient } from '@/lib/supabase/server'
import { BookOpen, Plus, Users, Video, Clock } from 'lucide-react'
import Link from 'next/link'

const STATUS_CONFIG = {
  recording: { label: 'Gravando', bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]/20' },
  review: { label: 'Em Revisão', bg: 'bg-accent-muted', text: 'text-accent', border: 'border-accent/20' },
  published: { label: 'Publicado', bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
} as const

export default async function KnowBasePage() {
  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from('knowledge_sessions')
    .select(`
      id, title, status, created_at,
      job_roles(name, department),
      knowledge_videos(count)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">KnowBase</h1>
          <p className="text-sm text-text-muted mt-0.5">Preservação de conhecimento por cargo</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/knowbase/admin"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:border-accent text-sm text-text-muted hover:text-accent transition-all"
          >
            <Users className="w-4 h-4" />
            Painel RH
          </Link>
          <Link
            href="/knowbase/gravar"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:opacity-90 text-white text-sm font-semibold transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Nova Sessão
          </Link>
        </div>
      </div>

      {/* Grid de sessões/cargos */}
      {sessions && sessions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => {
            const statusConfig = STATUS_CONFIG[(session.status as keyof typeof STATUS_CONFIG)] ?? STATUS_CONFIG.recording
            const role = (session.job_roles as any)
            const videoCount = (session.knowledge_videos as any)?.[0]?.count ?? 0

            return (
              <Link
                key={session.id}
                href={`/knowbase/${session.id}`}
                className="
                  bg-card border border-border rounded-xl shadow-card p-5
                  hover:border-accent hover:shadow-card-hover
                  transition-all duration-200 group flex flex-col gap-3
                "
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-accent" />
                  </div>
                  <span className={`
                    text-[11px] font-semibold px-2 py-0.5 rounded-full border
                    ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}
                  `}>
                    {statusConfig.label}
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-text-primary group-hover:text-accent transition-colors leading-snug">
                    {session.title}
                  </h3>
                  {role && (
                    <p className="text-xs text-text-muted mt-0.5">
                      {role.name}{role.department ? ` • ${role.department}` : ''}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-1 border-t border-border">
                  <div className="flex items-center gap-1 text-xs text-text-muted">
                    <Video className="w-3.5 h-3.5" />
                    {videoCount} vídeo{videoCount !== 1 ? 's' : ''}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-text-muted">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(session.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 text-center shadow-card">
          <BookOpen className="w-12 h-12 text-border mx-auto mb-4" />
          <h3 className="text-base font-semibold text-text-primary mb-1">Nenhuma sessão ainda</h3>
          <p className="text-sm text-text-muted mb-4">Crie sessões de transferência de conhecimento por cargo</p>
          <Link
            href="/knowbase/gravar"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:opacity-90 text-white text-sm font-semibold transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Criar Primeira Sessão
          </Link>
        </div>
      )}
    </div>
  )
}
