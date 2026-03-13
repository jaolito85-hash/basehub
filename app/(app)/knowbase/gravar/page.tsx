'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Video, Upload, CheckCircle, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type JobRole = { id: string; name: string; department?: string | null }

export default function GravarPage() {
  const supabase = createClient()
  const [jobRoles, setJobRoles] = useState<JobRole[]>([])
  const [sessionTitle, setSessionTitle] = useState('')
  const [jobRoleId, setJobRoleId] = useState('')
  const [videoTitle, setVideoTitle] = useState('')
  const [videoDesc, setVideoDesc] = useState('')
  const [whenToUse, setWhenToUse] = useState('')
  const [stepByStep, setStepByStep] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('job_roles').select('id, name, department').order('name').then(({ data }) => {
      setJobRoles(data ?? [])
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !videoTitle) return

    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Não autenticado.'); setLoading(false); return }

    // Criar sessão se título foi informado
    let sessionId: string | null = null
    if (sessionTitle && jobRoleId) {
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()

      const { data: newSession, error: sessionError } = await supabase
        .from('knowledge_sessions')
        .insert({
          title: sessionTitle,
          job_role_id: jobRoleId,
          outgoing_user_id: user.id,
          company_id: (profile as any)?.company_id,
          status: 'recording',
        })
        .select('id')
        .single()

      if (sessionError) {
        setError('Erro ao criar sessão.')
        setLoading(false)
        return
      }
      sessionId = newSession.id
    }

    // Upload do vídeo
    const ext = file.name.split('.').pop()
    const path = `knowbase/${sessionId ?? 'geral'}/${Date.now()}.${ext}`

    const { error: storageError } = await supabase.storage
      .from('knowledge-videos')
      .upload(path, file, {
        onUploadProgress: (e: { loaded: number; total?: number }) => {
          if (e.total) setProgress(Math.round(e.loaded / e.total * 100))
        },
      } as any)

    if (storageError) {
      setError('Erro ao fazer upload do vídeo.')
      setLoading(false)
      return
    }

    const { data: publicUrl } = supabase.storage.from('knowledge-videos').getPublicUrl(path)

    if (sessionId) {
      const { error: videoError } = await supabase.from('knowledge_videos').insert({
        session_id: sessionId,
        title: videoTitle,
        description: videoDesc || null,
        when_to_use: whenToUse || null,
        video_url: publicUrl.publicUrl,
        storage_path: path,
      })

      if (videoError) {
        setError('Erro ao salvar o vídeo.')
        setLoading(false)
        return
      }
    }

    setSuccess(true)
    setLoading(false)
    setSessionTitle('')
    setVideoTitle('')
    setVideoDesc('')
    setWhenToUse('')
    setStepByStep('')
    setFile(null)
    setProgress(0)
    setTimeout(() => setSuccess(false), 4000)
  }

  const inputClass = `
    w-full px-3 py-2.5 rounded-lg text-sm
    bg-canvas border border-border
    text-text-primary placeholder:text-text-muted
    focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
    transition-colors
  `

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/knowbase" className="p-1.5 rounded-lg hover:bg-card border border-transparent hover:border-border transition-all">
          <ArrowLeft className="w-4 h-4 text-text-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Gravar Conhecimento</h1>
          <p className="text-sm text-text-muted mt-0.5">Documente como você executa suas funções</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Sessão */}
        <div className="bg-card border border-border rounded-xl shadow-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-accent text-white text-xs flex items-center justify-center font-bold">1</span>
            Informações da Sessão
          </h2>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Cargo / Função *</label>
            <select value={jobRoleId} onChange={(e) => setJobRoleId(e.target.value)} required className={inputClass}>
              <option value="">Selecione o cargo</option>
              {jobRoles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}{r.department ? ` — ${r.department}` : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Título da Sessão *</label>
            <input
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="Ex: Transferência de Conhecimento — Analista Financeiro"
              required
              className={inputClass}
            />
          </div>
        </div>

        {/* Vídeo */}
        <div className="bg-card border border-border rounded-xl shadow-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-accent text-white text-xs flex items-center justify-center font-bold">2</span>
            Detalhes do Vídeo
          </h2>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Título do Vídeo *</label>
            <input type="text" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="Ex: Como processar o fechamento mensal" required className={inputClass} />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Descrição</label>
            <textarea value={videoDesc} onChange={(e) => setVideoDesc(e.target.value)} placeholder="O que você mostra neste vídeo?" rows={2} className={`${inputClass} resize-none`} />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Quando acontece?</label>
            <input type="text" value={whenToUse} onChange={(e) => setWhenToUse(e.target.value)} placeholder="Ex: Todo dia 5 do mês, quando chega o boleto X" className={inputClass} />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Passo a passo (opcional)</label>
            <textarea value={stepByStep} onChange={(e) => setStepByStep(e.target.value)} placeholder="1. Abra o sistema Y&#10;2. Acesse a seção Z&#10;3. ..." rows={4} className={`${inputClass} resize-none font-mono text-xs`} />
          </div>

          {/* Upload */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Arquivo de Vídeo *</label>
            <label className="flex flex-col items-center justify-center w-full py-8 rounded-xl border-2 border-dashed border-border hover:border-accent cursor-pointer transition-colors bg-canvas">
              <Upload className="w-6 h-6 text-text-muted mb-2" />
              <span className="text-sm text-text-muted">{file ? file.name : 'Clique para selecionar'}</span>
              {file && <span className="text-xs text-accent mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</span>}
              <input type="file" className="hidden" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </div>

        {/* Progress */}
        {loading && progress > 0 && (
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs text-text-muted">Enviando vídeo...</span>
              <span className="text-xs font-medium text-accent">{progress}%</span>
            </div>
            <div className="h-2 bg-canvas border border-border rounded-full overflow-hidden">
              <div className="h-full bg-accent transition-all rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-alert/10 border border-alert/20">
            <AlertCircle className="w-4 h-4 text-alert flex-shrink-0" />
            <p className="text-xs text-alert">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
            <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
            <p className="text-xs text-success">Vídeo enviado com sucesso!</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !file || !videoTitle || !sessionTitle || !jobRoleId}
          className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-accent hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <><Video className="w-4 h-4" /> Salvar Conhecimento</>}
        </button>
      </form>
    </div>
  )
}
