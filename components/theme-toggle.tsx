'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg border border-border bg-surface" />
    )
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
      className="
        w-9 h-9 rounded-lg border border-border bg-surface
        flex items-center justify-center
        hover:border-accent hover:bg-accent-muted
        transition-all duration-150
      "
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-text-muted" />
      ) : (
        <Moon className="w-4 h-4 text-text-muted" />
      )}
    </button>
  )
}
