'use client'

import { useState, useMemo } from 'react'
import { Bot, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatWindow } from './ChatWindow'
import { useChat, type PortfolioContext } from './useChat'
import { useActivePortfolioData } from '@/features/portfolio/useActivePortfolioData'
import { useLiveMarketDataContext } from '@/features/portfolio/LiveMarketDataProvider'
import { getPortfolioAnalytics } from '@/features/portfolio/logic'

// ─── Build the portfolio context that gets sent to the AI ─────────────────────

function usePortfolioContext(): PortfolioContext | undefined {
  const { assets, transactions, hasHydrated } = useActivePortfolioData()
  const { livePrices } = useLiveMarketDataContext()

  return useMemo(() => {
    if (!hasHydrated || assets.length === 0) return undefined

    const analytics = getPortfolioAnalytics(assets, transactions, livePrices)

    return {
      totalValue:    analytics.totalValue,
      totalCost:     analytics.totalCost,
      unrealizedPnL: analytics.unrealizedPnL.amount,
      unrealizedPct: analytics.unrealizedPnL.pct,
      realizedPnL:   analytics.realizedPnL,
      currency:      'USD',
      positions:     analytics.positions
        .filter((p) => p.position.hasPosition)
        .map((p) => ({
          name:              p.asset.name,
          ticker:            p.asset.ticker,
          assetClass:        p.asset.assetClass,
          currentValue:      p.position.currentValue,
          unrealizedGain:    p.position.unrealizedGain,
          unrealizedGainPct: p.position.unrealizedGainPct,
          quantity:          p.position.quantity,
        })),
    }
  }, [assets, transactions, livePrices, hasHydrated])
}

// ─── Floating button + window ─────────────────────────────────────────────────

export function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false)
  const { messages, isLoading, sendMessage, clearChat } = useChat()
  const portfolioContext = usePortfolioContext()

  const unreadCount = 0 // placeholder for future unread badge logic

  function handleSend(text: string) {
    sendMessage(text, portfolioContext)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat window */}
      {isOpen && (
        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          onSend={handleSend}
          onClear={clearChat}
          onClose={() => setIsOpen(false)}
          portfolioReady={!!portfolioContext}
        />
      )}

      {/* Floating bubble button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? 'Chat schließen' : 'AI Chat öffnen'}
        className={cn(
          'relative flex h-14 w-14 items-center justify-center rounded-full',
          'shadow-lg transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void',
          isOpen
            ? 'bg-surface-elevated border border-border text-ink hover:bg-surface-raised'
            : 'bg-signal text-white hover:bg-signal-dim active:scale-95 shadow-signal/30'
        )}
      >
        {isOpen
          ? <X size={20} strokeWidth={2} />
          : <Bot size={22} strokeWidth={1.8} />
        }

        {/* Unread badge — shown only when chat is closed and there are messages */}
        {!isOpen && messages.length > 0 && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-loss text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}

        {/* Pulse ring — shown only when widget is closed + has no messages (first-time hint) */}
        {!isOpen && messages.length === 0 && (
          <span className="absolute inset-0 rounded-full bg-signal/40 animate-ping opacity-60 pointer-events-none" />
        )}
      </button>
    </div>
  )
}
