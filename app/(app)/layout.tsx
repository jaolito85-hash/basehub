import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeRole } from '@/lib/auth/roles'
import { Sidebar } from '@/components/sidebar'
import { Topbar } from '@/components/topbar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Cliente normal para verificar sessão
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Cliente admin para ler o perfil — bypassa RLS
  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const role = normalizeRole(profile?.role)

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar role={role} />
      <Topbar
        userName={profile?.full_name ?? user.email ?? 'Usuário'}
        userRole={role}
      />
      <main className="ml-60 pt-16 min-h-[calc(100vh-4rem)]">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
