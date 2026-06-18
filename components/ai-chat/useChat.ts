'use client'

import { useState, useCallback, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface PortfolioContext {
  totalValue: number
  totalCost: number
  unrealizedPnL: number
  unrealizedPct: number
  realizedPnL: number
  currency: string
  positions: Array<{
    name: string
    ticker: string
    assetClass: string
    currentValue: number
    unrealizedGain: number
    unrealizedGainPct: number
    quantity: number
  }>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChat() {
  const [messages, setMessages]   = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(
    async (userText: string, portfolioContext?: PortfolioContext) => {
      if (!userText.trim() || isLoading) return

      const userMsg: ChatMessage = {
        id:        crypto.randomUUID(),
        role:      'user',
        content:   userText.trim(),
        timestamp: new Date(),
      }

      // Optimistically add user message + placeholder
      const placeholderId = crypto.randomUUID()
      const placeholder: ChatMessage = {
        id:        placeholderId,
        role:      'assistant',
        content:   '',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMsg, placeholder])
      setIsLoading(true)
      setError(null)

      // Build history for the API (exclude the placeholder)
      const history = [...messages, userMsg].map((m) => ({
        role:    m.role,
        content: m.content,
      }))

      try {
        abortRef.current = new AbortController()

        const res = await fetch('/api/ai-chat', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ messages: history, portfolioContext }),
          signal:  abortRef.current.signal,
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? `Request failed (${res.status})`)
        }

        // ── Stream the response ──────────────────────────────────────────────
        const reader  = res.body?.getReader()
        const decoder = new TextDecoder()
        let   accumulated = ''

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })

            // Parse SSE lines
            for (const line of chunk.split('\n')) {
              if (!line.startsWith('data: ')) continue
              const raw = line.slice(6).trim()
              if (raw === '[DONE]') break
              try {
                const parsed = JSON.parse(raw)
                const delta  = parsed.choices?.[0]?.delta?.content ?? ''
                accumulated += delta
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === placeholderId ? { ...m, content: accumulated } : m
                  )
                )
              } catch {
                // ignore malformed chunks
              }
            }
          }
        }

        // Fallback: if nothing streamed, show a generic error
        if (!accumulated) {
          throw new Error('Keine Antwort erhalten.')
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return

        const msg =
          err instanceof Error ? err.message : 'Unbekannter Fehler'

        setError(msg)
        // Replace placeholder with error message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === placeholderId
              ? {
                  ...m,
                  content: `⚠️ ${msg}`,
                }
              : m
          )
        )
      } finally {
        setIsLoading(false)
        abortRef.current = null
      }
    },
    [messages, isLoading]
  )

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  const cancelRequest = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return { messages, isLoading, error, sendMessage, clearChat, cancelRequest }
}
