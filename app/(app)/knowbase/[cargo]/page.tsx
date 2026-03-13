import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ChatInterface } from '@/components/knowbase/chat-interface'
import { ArrowLeft, Video, Play, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function KnowBaseCargoPage({ params }: { params: { cargo: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: session } = await supabase
    .from('knowledge_sessions')
    .select(`
      id, title, status,
      job_roles(name, department),
      knowledge_videos(id, title, description, duration_seconds, video_url, order_index)
    `)
    .eq('id', params.cargo)
    .single()

  if (!session) notFound()

  const videos = ((session.knowledge_videos as any[]) ?? []).sort((a, b) => a.order_index - b.order_index)
  const role = session.job_roles as any

  // Progresso do usuário
  let progressMap: Record<string, { completed: boolean; watched_seconds: number }> = {}
  if (user && videos.length > 0) {
    const { data: prog } = await supabase
      .from('knowledge_progress')
      .select('video_id, completed, watched_seconds')
      .eq('user_id', user.id)
      .in('video_id', videos.map((v) => v.id))

    if (prog) {
      prog.forEach((p) => { progressMap[p.video_id] = p })
    }
  }

  const completedCount = Object.values(progressMap).filter((p) => p.completed).length
  const progressPercent = videos.length > 0 ? Math.round(completedCount / videos.length * 100) : 0

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link href="/knowbase" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Voltar para KnowBase
      </Link>

      {/* Header */}
      <div className="bg-card border border-border rounded-xl shadow-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary">{session.title}</h1>
            {role && (
              <p className="text-sm text-text-muted mt-0.5">
                {role.name}{role.department ? ` • ${role.department}` : ''}
              </p>
            )}
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-success/10 text-success border border-success/20 flex-shrink-0">
            {progressPercent}% concluído
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-text-muted">{completedCount} de {videos.length} vídeos assistidos</span>
          </div>
          <div className="h-2 bg-canvas border border-border rounded-full overflow-hidden">
            <div
              className="h-full bg-success transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Split layout: vídeos + chat */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 items-start">
        {/* Lista de vídeos */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-text-primary">
            Vídeos do Cargo <span className="text-text-muted font-normal">({videos.length})</span>
          </h2>
          {videos.length > 0 ? (
            videos.map((video, index) => {
              const prog = progressMap[video.id]
              return (
                <div
                  key={video.id}
                  className="bg-card border border-border rounded-xl shadow-card p-4 flex items-start gap-4"
                >
                  <div className="w-8 h-8 rounded-full bg-canvas border border-border flex items-center justify-center flex-shrink-0 text-xs font-bold text-text-muted">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium text-text-primary leading-snug">{video.title}</h3>
                      {prog?.completed && (
                        <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                    {video.description && (
                      <p className="text-xs text-text-muted mt-1 line-clamp-2">{video.description}</p>
                    )}
                    {video.duration_seconds && (
                      <div className="flex items-center gap-1 mt-2">
                        <Clock className="w-3 h-3 text-text-muted" />
                        <span className="text-xs text-text-muted">
                          {Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, '0')}
                        </span>
                      </div>
                    )}
                  </div>
                  {video.video_url && (
                    <a
                      href={video.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
                        w-9 h-9 rounded-lg bg-accent-muted border border-accent/20
                        flex items-center justify-center flex-shrink-0
                        hover:bg-accent/20 transition-colors
                      "
                    >
                      <Play className="w-4 h-4 text-accent ml-0.5" />
                    </a>
                  )}
                </div>
              )
            })
          ) : (
            <div className="bg-card border border-border rounded-xl p-10 text-center shadow-card">
              <Video className="w-8 h-8 text-border mx-auto mb-2" />
              <p className="text-sm text-text-muted">Nenhum vídeo nesta sessão ainda</p>
            </div>
          )}
        </div>

        {/* Chat IA */}
        <div className="lg:sticky lg:top-[88px]" style={{ height: 'calc(100vh - 120px)' }}>
          <ChatInterface sessionId={session.id} sessionTitle={session.title} />
        </div>
      </div>
    </div>
  )
}
