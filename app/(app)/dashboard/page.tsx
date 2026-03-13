import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeRole } from '@/lib/auth/roles'
import { Package, Video, Store, TrendingUp, ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Cliente admin para ler o perfil — bypassa RLS se necessário, assim como no layout
  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = normalizeRole(profile?.role)
  const isAdmin = role === 'admin'

  const [
    { count: totalProducts },
    { count: totalVideos },
    { count: totalStores },
    { count: completedVideos },
    { count: totalProgress },
    { data: recentProducts },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('videos').select('*', { count: 'exact', head: true }),
    supabase.from('stores').select('*', { count: 'exact', head: true }),
    supabase.from('watch_progress').select('*', { count: 'exact', head: true }).eq('completed', true),
    supabase.from('watch_progress').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('id, name, description, created_at').order('created_at', { ascending: false }).limit(5),
  ])

  const completionRate = totalProgress && totalProgress > 0
    ? Math.round((completedVideos ?? 0) / totalProgress * 100)
    : 0

  const allStats = [
    {
      label: 'Produtos Cadastrados',
      value: totalProducts ?? 0,
      icon: Package,
      color: 'text-accent',
      bg: 'bg-accent-muted',
      adminOnly: false,
    },
    {
      label: 'Vídeos Disponíveis',
      value: totalVideos ?? 0,
      icon: Video,
      color: 'text-[#22C55E] dark:text-[#43e97b]',
      bg: 'bg-[#22C55E]/10 dark:bg-[#43e97b]/10',
      adminOnly: false,
    },
    {
      label: 'Lojas Parceiras',
      value: totalStores ?? 0,
      icon: Store,
      color: 'text-[#F59E0B]',
      bg: 'bg-[#F59E0B]/10',
      adminOnly: true,
    },
    {
      label: 'Taxa de Conclusão',
      value: `${completionRate}%`,
      icon: TrendingUp,
      color: 'text-[#8B5CF6] dark:text-[#a78bfa]',
      bg: 'bg-[#8B5CF6]/10',
      adminOnly: false,
    },
  ]

  const stats = allStats.filter(stat => !stat.adminOnly || isAdmin)

  const allQuickActions = [
    { href: '/upload', icon: Video, label: 'Subir um novo vídeo', desc: 'Upload de conteúdo de treinamento', adminOnly: true },
    { href: '/produtos', icon: Package, label: 'Ver catálogo de produtos', desc: 'Gerenciar linha de produtos', adminOnly: false },
    { href: '/lojas', icon: Store, label: 'Gerenciar lojas parceiras', desc: 'Convidar e visualizar lojas', adminOnly: true },
    { href: '/knowbase', icon: TrendingUp, label: 'Acessar KnowBase', desc: 'Preservação de conhecimento interno', adminOnly: false },
  ]

  const quickActions = allQuickActions.filter(action => !action.adminOnly || isAdmin)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-muted mt-0.5">Visão geral da sua plataforma de treinamento</p>
      </div>

      {/* Stats Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? 'xl:grid-cols-4' : 'xl:grid-cols-3'} gap-4`}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-text-muted mb-2">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Conteúdo inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produtos Recentes */}
        <div className="bg-card border border-border rounded-xl shadow-card">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Produtos Recentes</h2>
              <p className="text-xs text-text-muted mt-0.5">Últimos produtos cadastrados</p>
            </div>
            <Link
              href="/produtos"
              className="flex items-center gap-1 text-xs font-medium text-accent hover:opacity-80 transition-opacity"
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentProducts && recentProducts.length > 0 ? (
              recentProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/produtos/${product.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-canvas transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate group-hover:text-accent transition-colors">
                      {product.name}
                    </p>
                    {product.description && (
                      <p className="text-xs text-text-muted truncate mt-0.5">{product.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-text-muted flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(product.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-5 py-8 text-center">
                <Package className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-muted">Nenhum produto cadastrado ainda</p>
                {isAdmin && (
                  <Link href="/upload" className="text-xs text-accent hover:opacity-80 transition-opacity mt-1 inline-block">
                    Fazer primeiro upload
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Início rápido */}
        <div className="bg-card border border-border rounded-xl shadow-card">
          <div className="p-5 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">Início Rápido</h2>
            <p className="text-xs text-text-muted mt-0.5">Ações mais comuns da plataforma</p>
          </div>
          <div className="p-3 space-y-1.5">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-canvas transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-accent-muted flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                  <action.icon className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">{action.label}</p>
                  <p className="text-xs text-text-muted">{action.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
