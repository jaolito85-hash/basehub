import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  const { message, sessionId, userId, history = [] } = await req.json()

  if (!message || !sessionId) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const supabase = await createClient()

  // Buscar dados da sessão e vídeos
  const { data: session } = await supabase
    .from('knowledge_sessions')
    .select(`
      title,
      job_roles(name, department),
      knowledge_videos(title, description, when_to_use),
      knowledge_docs(title, content)
    `)
    .eq('id', sessionId)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
  }

  const role = session.job_roles as any
  const videos = (session.knowledge_videos as any[]) ?? []
  const docs = (session.knowledge_docs as any[]) ?? []

  // Montar contexto
  const contextParts: string[] = []
  contextParts.push(`Sessão: ${session.title}`)
  if (role) contextParts.push(`Cargo: ${role.name}${role.department ? ` (${role.department})` : ''}`)

  if (videos.length > 0) {
    contextParts.push('\n=== VÍDEOS DISPONÍVEIS ===')
    videos.forEach((v, i) => {
      contextParts.push(`\n${i + 1}. "${v.title}"`)
      if (v.description) contextParts.push(`   Descrição: ${v.description}`)
      if (v.when_to_use) contextParts.push(`   Quando usar: ${v.when_to_use}`)
    })
  }

  if (docs.length > 0) {
    contextParts.push('\n=== DOCUMENTOS ===')
    docs.forEach((d) => {
      contextParts.push(`\n"${d.title}"`)
      if (d.content) contextParts.push(d.content.slice(0, 500))
    })
  }

  const systemPrompt = `Você é o assistente de conhecimento do cargo "${role?.name ?? 'indefinido'}" na plataforma BaseHub.

Seu objetivo é ajudar o novo funcionário a entender como executar as funções deste cargo, com base EXCLUSIVAMENTE no conteúdo a seguir:

${contextParts.join('\n')}

REGRAS:
- Responda SOMENTE com base no conteúdo acima
- Se não souber, diga: "Esse assunto não foi coberto nos vídeos deste cargo. Consulte seu gestor."
- Responda sempre em português brasileiro
- Seja direto e prático
- Quando relevante, mencione o nome do vídeo específico onde o usuário pode aprender mais`

  // Montar histórico para o Claude
  const messages: Anthropic.MessageParam[] = [
    ...history.slice(-6).map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: message },
  ]

  // Stream
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = await anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: systemPrompt,
          messages,
        })

        for await (const chunk of claudeStream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
      } catch (error) {
        controller.enqueue(encoder.encode('Erro ao processar sua pergunta. Tente novamente.'))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  })
}
