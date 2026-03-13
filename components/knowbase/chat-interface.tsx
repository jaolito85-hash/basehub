'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Message = {
  id?: string
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

type ChatInterfaceProps = {
  sessionId: string
  sessionTitle: string
}

export function ChatInterface({ sessionId, sessionTitle }: ChatInterfaceProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)

      // Carregar histórico
      supabase
        .from('knowledge_chat_history')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .order('created_at')
        .then(({ data }) => {
          if (data) setMessages(data as Message[])
        })
    })
  }, [sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading || !userId) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // Salvar mensagem do usuário
    await supabase.from('knowledge_chat_history').insert({
      user_id: userId,
      session_id: sessionId,
      role: 'user',
      content: userMessage.content,
    })

    // Chamar API de chat
    const assistantMessage: Message = { role: 'assistant', content: '' }
    setMessages((prev) => [...prev, assistantMessage])

    try {
      const response = await fetch('/api/knowbase/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId,
          userId,
          history: messages.slice(-6),
        }),
      })

      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        fullContent += chunk
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: fullContent },
        ])
      }

      // Salvar resposta do assistente
      await supabase.from('knowledge_chat_history').insert({
        user_id: userId,
        session_id: sessionId,
        role: 'assistant',
        content: fullContent,
      })
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Desculpe, ocorreu um erro. Tente novamente.' },
      ])
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-canvas flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center">
          <Bot className="w-4 h-4 text-accent" />
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">Agente IA</p>
          <p className="text-[11px] text-text-muted truncate max-w-[160px]">{sessionTitle}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-text-muted">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-12 h-12 rounded-xl bg-accent-muted flex items-center justify-center mb-3">
              <Bot className="w-6 h-6 text-accent" />
            </div>
            <p className="text-sm font-medium text-text-primary mb-1">Olá! Sou o assistente deste cargo.</p>
            <p className="text-xs text-text-muted max-w-[200px] leading-relaxed">
              Fui treinado com os vídeos e documentos desta função. Pergunte o que quiser!
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
              ${msg.role === 'user' ? 'bg-accent' : 'bg-canvas border border-border'}
            `}>
              {msg.role === 'user'
                ? <User className="w-3 h-3 text-white" />
                : <Bot className="w-3 h-3 text-accent" />
              }
            </div>
            <div className={`
              max-w-[85%] px-3 py-2.5 rounded-xl text-sm leading-relaxed
              ${msg.role === 'user'
                ? 'bg-accent text-white rounded-tr-sm'
                : 'bg-canvas border border-border text-text-primary rounded-tl-sm'
              }
            `}>
              {msg.content || (loading && i === messages.length - 1 && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-text-muted" />
              ))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t border-border flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Faça uma pergunta sobre este cargo..."
          disabled={loading}
          className="
            flex-1 px-3 py-2 rounded-lg text-sm
            bg-canvas border border-border
            text-text-primary placeholder:text-text-muted
            focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
            disabled:opacity-60 transition-colors
          "
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="
            w-9 h-9 rounded-lg bg-accent hover:opacity-90 disabled:opacity-40
            flex items-center justify-center flex-shrink-0 transition-opacity
          "
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </form>
    </div>
  )
}
