'use client'

import { useEffect, useState } from 'react'
import { formatCurrency, formatPercent, cn } from '@/lib/utils'

type TickerItem = {
  symbol: string
  price: number
  changePct: number
  currency: string
}

export function LandingDashboardPreview() {
  const [items, setItems] = useState<TickerItem[]>([])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/landing-ticker', { cache: 'no-store' })
        const data = await res.json()
        setItems(Array.isArray(data.items) ? data.items : [])
      } catch {
        setItems([])
      }
    }

    load()
    const interval = window.setInterval(load, 60_000)
    return () => window.clearInterval(interval)
  }, [])

  const shown = items.slice(0, 3)
  const fallbackItems: TickerItem[] = [
    { symbol: 'BTC', price: 0, changePct: 0, currency: 'EUR' },
    { symbol: 'AAPL', price: 0, changePct: 0, currency: 'USD' },
    { symbol: 'GOOGL', price: 0, changePct: 0, currency: 'USD' },
  ]

  const visibleItems = shown.length > 0 ? shown : fallbackItems
  const mockValue = shown.reduce((sum, item) => sum + item.price, 0)

  return (
    <div className="rounded-3xl border border-border bg-surface/80 p-4 shadow-glass-lg backdrop-blur-glass">
      <div className="rounded-2xl border border-border bg-void p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-data-xs uppercase tracking-wide text-ink-faint">
              Live Market Preview
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold text-ink">
              {mockValue > 0 ? formatCurrency(mockValue, 'EUR') : 'Live Daten'}
            </p>
          </div>

          <div className="rounded-lg bg-gain/10 px-3 py-1.5 font-mono text-data-sm text-gain">
            Live
          </div>
        </div>

        <div className="mb-3 h-20 rounded-xl border border-border bg-surface-raised p-3">
          <div className="flex h-full items-end gap-2">
            {[35, 48, 42, 63, 58, 76, 70, 88, 82, 96, 91, 100].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-signal/70"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          {visibleItems.map((item) => (
            <div
              key={item.symbol}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-signal/10 font-mono text-data-xs font-bold text-signal">
                {item.symbol}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-data-sm font-semibold text-ink">{item.symbol}</p>
                <p className="truncate text-data-xs text-ink-faint">Live Quote</p>
              </div>

              <div className="text-right">
                <p className="font-mono text-data-sm text-ink">
                  {item.price > 0 ? formatCurrency(item.price, item.currency) : '—'}
                </p>
                <p
                  className={cn(
                    'font-mono text-data-xs',
                    item.changePct >= 0 ? 'text-gain' : 'text-loss'
                  )}
                >
                  {formatPercent(item.changePct)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
