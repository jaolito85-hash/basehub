'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Store,
  BookOpen,
  Settings,
  HelpCircle,
  LogOut,
  Sparkles,
  ChevronRight,
  Building2,
  ShoppingBag,
  GraduationCap,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Role = 'admin' | 'store_user'

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  adminOnly?: boolean
}

const menuItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/produtos', label: 'Produtos', icon: Package },
  { href: '/treinamentos', label: 'Treinamentos', icon: GraduationCap },
  { href: '/lojas', label: 'Lojas Parceiras', icon: Store, adminOnly: true },
  { href: '/knowbase', label: 'KnowBase', icon: BookOpen },
]

const generalItems: NavItem[] = [
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
  { href: '/suporte', label: 'Suporte', icon: HelpCircle },
]

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

  return (
    <Link
      href={item.href}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
        transition-all duration-150 group
        ${isActive
          ? 'bg-accent-muted text-accent'
          : 'text-text-muted hover:text-text-primary hover:bg-canvas'
        }
      `}
    >
      <item.icon
        className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-accent' : 'text-text-muted group-hover:text-text-primary'
          }`}
      />
      <span className="flex-1">{item.label}</span>
      {isActive && <ChevronRight className="w-3 h-3 text-accent" />}
    </Link>
  )
}

type SidebarProps = {
  role: Role
}

export function Sidebar({ role }: SidebarProps) {
  const router = useRouter()
  const supabase = createClient()
  const isAdmin = role === 'admin'

  const visibleMenuItems = menuItems.filter((item) => !item.adminOnly || isAdmin)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="
      fixed top-0 left-0 h-screen w-60 z-40 flex flex-col
      bg-surface border-r border-border
    ">
      {/* Logo + badge de perfil */}
      <div className="px-5 py-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 flex-shrink-0">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M16 3L29 9.5L16 16L3 9.5L16 3Z" fill="#1a2744" className="dark:fill-[#2d2b6b]" />
              <path d="M16 16L29 9.5V22.5L16 29V16Z" fill="#5bb8f5" className="dark:fill-[#4f46e5]" />
              <path d="M16 16L3 9.5V22.5L16 29V16Z" fill="#1a2744" className="dark:fill-[#3730a3]" />
              <line x1="10" y1="6.5" x2="22" y2="12.75" stroke="#5bb8f5" strokeWidth="0.75" className="dark:stroke-[#818cf8]" />
              <line x1="16" y1="3" x2="16" y2="16" stroke="#5bb8f5" strokeWidth="0.75" className="dark:stroke-[#818cf8]" />
              <line x1="4.5" y1="12" x2="27.5" y2="12" stroke="#5bb8f5" strokeWidth="0.75" opacity="0.6" className="dark:stroke-[#818cf8]" />
            </svg>
          </div>
          <span className="font-bold text-lg text-text-primary tracking-tight">basehub</span>
        </div>

        {/* Badge de perfil */}
        <div className={`
          flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium
          ${isAdmin
            ? 'bg-accent-muted border-accent/20 text-accent'
            : 'bg-[#22C55E]/10 border-[#22C55E]/20 text-[#16A34A] dark:text-[#43e97b]'
          }
        `}>
          {isAdmin
            ? <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
            : <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" />
          }
          <span>{isAdmin ? 'Fabricante' : 'Loja Parceira'}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        <div>
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-3 mb-1.5">
            Menu
          </p>
          <div className="space-y-0.5">
            {visibleMenuItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-3 mb-1.5">
            Geral
          </p>
          <div className="space-y-0.5">
            {generalItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
            <button
              onClick={handleLogout}
              className="
                w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                text-text-muted hover:text-alert hover:bg-alert/10
                transition-all duration-150 group
              "
            >
              <LogOut className="w-4 h-4 flex-shrink-0 group-hover:text-alert transition-colors" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Card inferior diferente por perfil */}
      <div className="p-3 border-t border-border flex-shrink-0">
        {isAdmin ? (
          <div className="
            rounded-xl p-4 text-center
            bg-gradient-to-br from-accent-muted to-transparent
            border border-accent/20
          ">
            <div className="
              w-9 h-9 rounded-lg bg-accent-muted border border-accent/20
              flex items-center justify-center mx-auto mb-2.5
            ">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <p className="text-sm font-semibold text-text-primary mb-0.5">BaseHub Pro</p>
            <p className="text-xs text-text-muted mb-3 leading-relaxed">
              IA avancada + analytics detalhados
            </p>
            <button className="
              w-full py-1.5 rounded-lg text-xs font-semibold text-white
              bg-accent hover:opacity-90 transition-opacity
            ">
              Fazer Upgrade
            </button>
          </div>
        ) : (
          <div className="rounded-xl p-4 bg-[#22C55E]/5 border border-[#22C55E]/20">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-[#22C55E]/10 flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#43e97b]" />
              </div>
              <p className="text-xs font-semibold text-text-primary">Precisa de ajuda?</p>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Fale com o suporte da empresa fabricante.
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
