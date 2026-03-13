import { createClient } from '@/lib/supabase/server'
import { Users, BookOpen, CheckCircle, Clock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const STATUS_CONFIG = {
  recording: { label: 'Gravando', bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]/20' },
  review: { label: 'Em Revisão', bg: 'bg-accent-muted', text: 'text-accent', border: 'border-accent/20' },
  published: { label: 'Publicado', bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
} as const

export default async function KnowBaseAdminPage() {
  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from('knowledge_sessions')
    .select(`
      id, title, status, created_at, published_at,
      job_roles(name, department),
      knowledge_videos(count)
    `)
    .order('created_at', { ascending: false })

  const stats = {
    total: sessions?.length ?? 0,
    recording: sessions?.filter((s) => s.status === 'recording').length ?? 0,
    review: sessions?.filter((s) => s.status === 'review').length ?? 0,
    published: sessions?.filter((s) => s.status === 'published').length ?? 0,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/knowbase" className="p-1.5 rounded-lg hover:bg-card border border-transparent hover:border-border transition-all">
          <ArrowLeft className="w-4 h-4 text-text-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Painel de RH</h1>
          <p className="text-sm text-text-muted mt-0.5">Gerencie sessões de transferência de conhecimento</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total de Sessões', value: stats.total, icon: BookOpen, color: 'text-accent', bg: 'bg-accent-muted' },
          { label: 'Em Gravação', value: stats.recording, icon: Clock, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10' },
          { label: 'Em Revisão', value: stats.review, icon: Users, color: 'text-accent', bg: 'bg-accent-muted' },
          { label: 'Publicadas', value: stats.published, icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-text-muted mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabela de sessões */}
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">Todas as Sessões</h2>
        </div>
        {sessions && sessions.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-canvas">
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Sessão / Cargo</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3 hidden md:table-cell">Vídeos</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Data</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sessions.map((session) => {
                const statusConfig = STATUS_CONFIG[(session.status as keyof typeof STATUS_CONFIG)] ?? STATUS_CONFIG.recording
                const role = session.job_roles as any
                const videoCount = (session.knowledge_videos as any)?.[0]?.count ?? 0

                return (
                  <tr key={session.id} className="hover:bg-canvas transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-text-primary">{session.title}</p>
                      {role && (
                        <p className="text-xs text-text-muted mt-0.5">{role.name}{role.department ? ` • ${role.department}` : ''}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm text-text-muted">{videoCount}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-sm text-text-muted">
                        {new Date(session.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/knowbase/${session.id}`}
                        className="text-xs font-medium text-accent hover:opacity-80 transition-opacity"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <BookOpen className="w-10 h-10 text-border mx-auto mb-3" />
            <p className="text-sm text-text-muted">Nenhuma sessão cadastrada ainda</p>
          </div>
        )}
      </div>
    </div>
  )
}
