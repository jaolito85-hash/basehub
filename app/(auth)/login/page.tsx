'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Building2, Store, Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react'

type ProfileType = 'fabricante' | 'loja' | null

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profileType, setProfileType] = useState<ProfileType>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos. Tente novamente.'
          : 'Ocorreu um erro. Tente novamente.'
      )
      setLoading(false)
      return
    }

    // Validar se o perfil selecionado bate com o role da conta
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Nao foi possivel validar seu perfil. Tente novamente.')
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      await supabase.auth.signOut()
      setError('Conta autenticada, mas sem perfil de acesso. Fale com o administrador.')
      setLoading(false)
      return
    }

    const rawRole = String(profile?.role ?? '').trim().toLowerCase()
    const isFabricante = rawRole === 'admin' || rawRole === 'fabricante' || rawRole === 'manufacturer'
    const isLoja = rawRole === 'store_user' || rawRole === 'loja' || rawRole === 'store'

    if ((profileType === 'fabricante' && !isFabricante) || (profileType === 'loja' && !isLoja)) {
      await supabase.auth.signOut()
      setError(
        profileType === 'fabricante'
          ? 'Esta conta nao e Fabricante. Selecione Loja para entrar.'
          : 'Esta conta nao e Loja. Selecione Fabricante para entrar.'
      )
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      {/* Glow de fundo sutil no dark mode */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent-muted rounded-full blur-3xl opacity-60 dark:opacity-100" />
      </div>

      <div className="w-full max-w-[420px] relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-3">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M16 3L29 9.5L16 16L3 9.5L16 3Z" fill="#1a2744" className="dark:fill-[#2d2b6b]" />
              <path d="M16 16L29 9.5V22.5L16 29V16Z" fill="#5bb8f5" className="dark:fill-[#4f46e5]" />
              <path d="M16 16L3 9.5V22.5L16 29V16Z" fill="#1a2744" className="dark:fill-[#3730a3]" />
              <line x1="10" y1="6.5" x2="22" y2="12.75" stroke="#5bb8f5" strokeWidth="0.75" className="dark:stroke-[#818cf8]" />
              <line x1="16" y1="3" x2="16" y2="16" stroke="#5bb8f5" strokeWidth="0.75" className="dark:stroke-[#818cf8]" />
              <line x1="4.5" y1="12" x2="27.5" y2="12" stroke="#5bb8f5" strokeWidth="0.75" opacity="0.6" className="dark:stroke-[#818cf8]" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">basehub</h1>
          <p className="text-sm text-text-muted mt-1">Plataforma de treinamento de produto</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-card p-6">

          {/* Etapa 1 — Seleção de perfil */}
          {!profileType ? (
            <div>
              <h2 className="text-base font-semibold text-text-primary mb-1">Bem-vindo de volta</h2>
              <p className="text-sm text-text-muted mb-5">
                Escolha a interface para entrar. <br />
                <span className="text-xs opacity-80">(Seu acesso real depende da sua conta.)</span>
              </p>

              <div className="grid grid-cols-2 gap-3">
                {/* Fabricante */}
                <button
                  onClick={() => setProfileType('fabricante')}
                  className="
                    p-5 rounded-xl border-2 border-border bg-canvas
                    hover:border-accent hover:bg-accent-muted
                    text-center transition-all duration-200 group
                    focus:outline-none focus:border-accent
                  "
                >
                  <div className="
                    w-10 h-10 rounded-xl bg-accent-muted border border-accent/30
                    flex items-center justify-center mx-auto mb-3
                    group-hover:bg-accent/20 transition-colors
                  ">
                    <Building2 className="w-5 h-5 text-accent" />
                  </div>
                  <p className="font-semibold text-sm text-text-primary">Fabricante</p>
                  <p className="text-xs text-text-muted mt-1">Acesso completo</p>
                </button>

                {/* Loja */}
                <button
                  onClick={() => setProfileType('loja')}
                  className="
                    p-5 rounded-xl border-2 border-border bg-canvas
                    hover:border-accent hover:bg-accent-muted
                    text-center transition-all duration-200 group
                    focus:outline-none focus:border-accent
                  "
                >
                  <div className="
                    w-10 h-10 rounded-xl bg-accent-muted border border-accent/30
                    flex items-center justify-center mx-auto mb-3
                    group-hover:bg-accent/20 transition-colors
                  ">
                    <Store className="w-5 h-5 text-accent" />
                  </div>
                  <p className="font-semibold text-sm text-text-primary">Loja</p>
                  <p className="text-xs text-text-muted mt-1">Acesso a treinamentos</p>
                </button>
              </div>
            </div>
          ) : (
            /* Etapa 2 — Formulário */
            <div>
              <div className="flex items-center gap-3 mb-5">
                <button
                  onClick={() => { setProfileType(null); setError(null) }}
                  className="p-1.5 rounded-lg hover:bg-canvas transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-text-muted" />
                </button>
                <div>
                  <h2 className="text-base font-semibold text-text-primary leading-none">
                    Entrar como {profileType === 'fabricante' ? 'Fabricante' : 'Loja'}
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    {profileType === 'fabricante' ? 'Exige permissão de administrador na conta' : 'Exige conta registrada no sistema'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className="
                        w-full pl-9 pr-4 py-2.5 rounded-lg text-sm
                        bg-canvas border border-border
                        text-text-primary placeholder:text-text-muted
                        focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
                        transition-colors
                      "
                    />
                  </div>
                </div>

                {/* Senha */}
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="
                        w-full pl-9 pr-10 py-2.5 rounded-lg text-sm
                        bg-canvas border border-border
                        text-text-primary placeholder:text-text-muted
                        focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
                        transition-colors
                      "
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Erro */}
                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-alert/10 border border-alert/20">
                    <p className="text-xs text-alert">{error}</p>
                  </div>
                )}

                {/* Botão */}
                <button
                  type="submit"
                  disabled={loading}
                  className="
                    w-full py-2.5 rounded-lg text-sm font-semibold text-white
                    bg-accent hover:opacity-90 disabled:opacity-60
                    transition-opacity flex items-center justify-center gap-2
                  "
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          BaseHub © {new Date().getFullYear()} — Todos os direitos reservados
        </p>
      </div>
    </div>
  )
}
