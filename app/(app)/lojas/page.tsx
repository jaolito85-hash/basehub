'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Store, Plus, Users, X, Mail, CheckCircle, Loader2, AlertCircle } from 'lucide-react'

type Loja = {
  id: string
  name: string
  city?: string | null
  state?: string | null
  email?: string | null
  created_at: string
}

export default function LojasPage() {
  const supabase = createClient()
  const [stores, setStores] = useState<Loja[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('stores')
      .select('*')
      .order('name')
      .then(({ data }) => {
        setStores(data ?? [])
        setLoading(false)
      })
  }, [])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setInviteError(null)

    const { error } = await supabase.from('stores').insert({
      name: inviteName,
      email: inviteEmail,
    })

    if (error) {
      setInviteError(`Erro ao adicionar loja: ${error.message}`)
      setInviting(false)
      return
    }

    const { data: newStore } = await supabase
      .from('stores')
      .select('*')
      .eq('email', inviteEmail)
      .single()
    if (newStore) setStores((prev) => [...prev, newStore])
    setInviteSuccess(true)
    setTimeout(() => {
      setShowModal(false)
      setInviteSuccess(false)
      setInviteEmail('')
      setInviteName('')
    }, 2000)
    setInviting(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Lojas Parceiras</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {stores.length} loja{stores.length !== 1 ? 's' : ''} cadastrada{stores.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:opacity-90 text-white text-sm font-semibold transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Convidar Loja
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 text-text-muted animate-spin mx-auto" />
          </div>
        ) : stores.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-canvas">
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Loja</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3 hidden md:table-cell">Localização</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3 hidden sm:table-cell">E-mail</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-3">Desde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stores.map((store) => (
                <tr key={store.id} className="hover:bg-canvas transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center flex-shrink-0">
                        <Store className="w-4 h-4 text-accent" />
                      </div>
                      <span className="text-sm font-medium text-text-primary">{store.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-sm text-text-muted">
                      {store.city && store.state ? `${store.city}, ${store.state}` : store.city ?? store.state ?? '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="text-sm text-text-muted">{store.email ?? '—'}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-text-muted">
                      {new Date(store.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-border mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-text-primary mb-1">Nenhuma loja parceira ainda</h3>
            <p className="text-xs text-text-muted mb-4">Convide lojas para acessar seus treinamentos</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:opacity-90 text-white text-sm font-semibold transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Convidar Primeira Loja
            </button>
          </div>
        )}
      </div>

      {/* Modal de convite */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-text-primary">Convidar Loja</h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-canvas border border-transparent hover:border-border flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>

            {inviteSuccess ? (
              <div className="py-6 text-center">
                <CheckCircle className="w-10 h-10 text-success mx-auto mb-3" />
                <p className="text-sm font-medium text-text-primary">Loja adicionada com sucesso!</p>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Nome da Loja *</label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Ex: Casas Bahia Maringá"
                    required
                    className="
                      w-full px-3 py-2.5 rounded-lg text-sm
                      bg-canvas border border-border
                      text-text-primary placeholder:text-text-muted
                      focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
                      transition-colors
                    "
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">E-mail da Loja *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="contato@loja.com.br"
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
                {inviteError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-500">{inviteError}</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={inviting}
                  className="
                    w-full py-2.5 rounded-lg text-sm font-semibold text-white
                    bg-accent hover:opacity-90 disabled:opacity-60
                    transition-opacity flex items-center justify-center gap-2
                  "
                >
                  {inviting ? <><Loader2 className="w-4 h-4 animate-spin" /> Adicionando...</> : 'Adicionar Loja'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
