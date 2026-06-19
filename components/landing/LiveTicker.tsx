'use client'

import { useEffect, useState } from 'react'
import { cn, formatCurrency, formatPercent } from '@/lib/utils'

type TickerItem = {
  symbol: string
  price: number
  changePct: number
  currency: string
}

export function LiveTicker() {
  const [items, setItems] = useState<TickerItem[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const res = await fetch('/api/landing-ticker', { cache: 'no-store' })
      const data = await res.json()
      setItems(Array.isArray(data.items) ? data.items : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const interval = window.setInterval(load, 45_000)
    return () => window.clearInterval(interval)
  }, [])

  const displayItems = items.length > 0 ? [...items, ...items, ...items] : []

  return (
    <div className="relative w-full overflow-hidden rounded-full border border-border bg-surface/70 backdrop-blur-glass">
      <style jsx>{`
        @keyframes folio-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>

      {loading ? (
        <div className="h-9 animate-pulse bg-surface-raised" />
      ) : displayItems.length === 0 ? (
        <div className="px-4 py-2 text-center text-data-sm text-ink-faint">
          Live-Ticker lädt…
        </div>
      ) : (
        <div
          className="flex w-max gap-8 px-4 py-2 text-data-sm"
          style={{ animation: 'folio-marquee 32s linear infinite' }}
        >
          {displayItems.map((item, index) => (
            <div key={`${item.symbol}-${index}`} className="flex shrink-0 items-center gap-2">
              <span className="font-mono font-semibold text-ink">{item.symbol}</span>
              <span className="font-mono text-ink-muted">
                {formatCurrency(item.price, item.currency)}
              </span>
              <span
                className={cn(
                  'font-mono',
                  item.changePct >= 0 ? 'text-gain' : 'text-loss'
                )}
              >
                {formatPercent(item.changePct)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
