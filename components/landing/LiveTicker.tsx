'use client'

import { useEffect, useState } from 'react'

type TickerItem = {
  symbol: string
  price: number
}

export function LiveTicker() {
  const [items, setItems] = useState<TickerItem[]>([])

  async function load() {
    try {
      const res = await fetch('/api/landing-ticker')
      const data = await res.json()
      setItems(data)
    } catch {}
  }

  useEffect(() => {
    load()

    const interval = setInterval(load, 45000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border bg-surface/70 backdrop-blur-glass">
      <div className="flex gap-8 overflow-x-auto px-4 py-3 text-sm scrollbar-none">
        {items.map((item) => (
          <div
            key={item.symbol}
            className="flex shrink-0 items-center gap-2"
          >
            <span className="font-semibold text-ink">
              {item.symbol}
            </span>

            <span className="font-mono text-ink-muted">
              {item.price.toLocaleString('de-DE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              €
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
