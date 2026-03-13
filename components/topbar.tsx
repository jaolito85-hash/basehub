'use client'

import { Search, Bell, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { ThemeToggle } from './theme-toggle'

type TopbarProps = {
  userName?: string
  userRole?: 'admin' | 'store_user'
  avatarUrl?: string | null
}

export function Topbar({ userName = 'Usuário', userRole, avatarUrl }: TopbarProps) {
  const [searchValue, setSearchValue] = useState('')

  const initials = userName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="
      fixed top-0 left-60 right-0 h-16 z-30 flex items-center justify-between px-6
      bg-surface border-b border-border
    ">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Buscar produtos, vídeos, lojas..."
          className="
            w-full pl-9 pr-4 py-2 rounded-lg text-sm
            bg-canvas border border-border
            text-text-primary placeholder:text-text-muted
            focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
            transition-colors duration-150
          "
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-4">
        {/* Notification bell */}
        <button className="
          relative w-9 h-9 rounded-lg border border-border bg-surface
          flex items-center justify-center
          hover:border-accent hover:bg-accent-muted
          transition-all duration-150
        ">
          <Bell className="w-4 h-4 text-text-muted" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full ring-2 ring-surface" />
        </button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User avatar */}
        <button className="
          flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-lg border border-border bg-surface
          hover:border-accent hover:bg-accent-muted
          transition-all duration-150
        ">
          {avatarUrl ? (
            <img src={avatarUrl} alt={userName} className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-bold text-white">{initials}</span>
            </div>
          )}
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-text-primary leading-none">{userName}</p>
            <p className="text-[11px] text-text-muted mt-0.5 leading-none">
              {userRole === 'admin' ? 'Fabricante' : 'Loja'}
            </p>
          </div>
          <ChevronDown className="w-3 h-3 text-text-muted ml-1" />
        </button>
      </div>
    </header>
  )
}
