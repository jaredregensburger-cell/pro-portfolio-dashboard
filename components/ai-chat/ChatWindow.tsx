'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { X, Send, Trash2, Bot, Loader2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatMessage, PortfolioContext } from './useChat'

// ─── Suggested starter prompts ────────────────────────────────────────────────

const SUGGESTIONS = [
  'Wie entwickelt sich mein Portfolio heute?',
  'Welche Position läuft am besten?',
  'Was sind meine größten Verlustpositionen?',
  'Erkläre mir meine Asset-Verteilung.',
]

// ─── Single message bubble ────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-2.5', isUser ? 'justify-end' : 'justify-start')}>
      {/* Avatar — only for assistant */}
      {!isUser && (
        <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-signal/15 border border-signal/30 mt-0.5">
          <Bot size={13} strokeWidth={2} className="text-signal" />
        </div>
      )}

      <div
        className={cn(
          'max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed',
          isUser
            ? 'bg-signal text-white rounded-tr-sm'
            : 'bg-surface-raised border border-border text-ink rounded-tl-sm'
        )}
      >
        {message.content || (
          /* typing dots while streaming */
          <span className="flex gap-1 items-center h-4">
            <span className="w-1.5 h-1.5 rounded-full bg-ink-faint animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-ink-faint animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-ink-faint animate-bounce [animation-delay:300ms]" />
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChatWindowProps {
  messages:        ChatMessage[]
  isLoading:       boolean
  onSend:          (text: string) => void
  onClear:         () => void
  onClose:         () => void
  portfolioReady:  boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChatWindow({
  messages,
  isLoading,
  onSend,
  onClear,
  onClose,
  portfolioReady,
}: ChatWindowProps) {
  const [input, setInput]         = useState('')
  const scrollRef                 = useRef<HTMLDivElement>(null)
  const inputRef                  = useRef<HTMLTextAreaElement>(null)
  const [showScroll, setShowScroll] = useState(false)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (isNearBottom) {
      el.scrollTop = el.scrollHeight
    } else {
      setShowScroll(true)
    }
  }, [messages])

  // Track scroll position to show/hide scroll-to-bottom button
  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
    setShowScroll(!atBottom)
  }

  function scrollToBottom() {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
    setShowScroll(false)
  }

  function handleSend() {
    const text = input.trim()
    if (!text || isLoading) return
    onSend(text)
    setInput('')
    inputRef.current?.focus()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div
      className={cn(
        'flex flex-col w-[360px] max-w-[calc(100vw-2rem)]',
        'rounded-2xl border border-border bg-surface-elevated',
        'shadow-glass-lg overflow-hidden',
        'animate-slide-up'
      )}
      style={{ height: '520px' }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-elevated shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-signal/15 border border-signal/30">
            <Bot size={14} strokeWidth={2} className="text-signal" />
          </div>
          <div>
            <p className="text-data-sm font-semibold text-ink leading-none">Folio AI</p>
            <p className="text-[11px] text-ink-faint mt-0.5 flex items-center gap-1">
              <span className={cn('inline-block w-1.5 h-1.5 rounded-full', portfolioReady ? 'bg-gain' : 'bg-ink-faint')} />
              {portfolioReady ? 'Portfolio geladen' : 'Kein Portfolio'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={onClear}
              title="Chat leeren"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint hover:text-loss hover:bg-loss/10 transition-colors duration-150"
            >
              <Trash2 size={13} strokeWidth={2} />
            </button>
          )}
          <button
            onClick={onClose}
            title="Schließen"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint hover:text-ink hover:bg-surface-raised transition-colors duration-150"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ── Message Area ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth"
      >
        {isEmpty ? (
          /* Welcome state */
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-signal/10 border border-signal/20">
              <Bot size={22} strokeWidth={1.5} className="text-signal" />
            </div>
            <div>
              <p className="text-data-sm font-semibold text-ink">Dein Portfolio-Coach</p>
              <p className="text-[12px] text-ink-faint mt-1 leading-relaxed max-w-[220px]">
                Frag mich alles über dein Portfolio — auf Deutsch oder Englisch.
              </p>
            </div>
            {/* Suggestions */}
            <div className="flex flex-col gap-1.5 w-full">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => onSend(s)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-xl text-[12px] text-ink-muted',
                    'bg-surface-raised hover:bg-surface-overlay border border-border hover:border-border-strong',
                    'transition-all duration-150 hover:text-ink'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
      </div>

      {/* Scroll-to-bottom pill */}
      {showScroll && (
        <div className="absolute bottom-[68px] left-1/2 -translate-x-1/2">
          <button
            onClick={scrollToBottom}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-elevated border border-border text-[11px] text-ink-muted hover:text-ink shadow-md transition-all duration-150"
          >
            <ChevronDown size={11} />
            Neue Nachrichten
          </button>
        </div>
      )}

      {/* ── Input ── */}
      <div className="px-3 py-3 border-t border-border bg-surface-elevated shrink-0">
        <div className={cn(
          'flex items-end gap-2 rounded-xl border bg-surface-raised px-3 py-2',
          'transition-colors duration-150',
          'focus-within:border-signal/50'
        )}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Frag mich etwas…"
            rows={1}
            disabled={isLoading}
            className={cn(
              'flex-1 resize-none bg-transparent text-[13px] text-ink placeholder:text-ink-faint',
              'focus:outline-none leading-relaxed max-h-28 overflow-y-auto',
              'disabled:opacity-50'
            )}
            style={{ scrollbarWidth: 'none' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              'shrink-0 flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-150',
              input.trim() && !isLoading
                ? 'bg-signal text-white hover:bg-signal-dim'
                : 'text-ink-faint'
            )}
          >
            {isLoading
              ? <Loader2 size={13} strokeWidth={2} className="animate-spin" />
              : <Send size={13} strokeWidth={2} />
            }
          </button>
        </div>
        <p className="text-[10px] text-ink-faint text-center mt-1.5">
          Enter zum Senden · Shift+Enter für Zeilenumbruch
        </p>
      </div>
    </div>
  )
}
