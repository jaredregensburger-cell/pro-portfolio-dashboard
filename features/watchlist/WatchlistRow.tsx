'use client'

import { Button } from '@/components/ui'
import { cn, formatCurrency } from '@/lib/utils'
import { ASSET_CLASS_META } from '@/lib/constants'
import type { WatchlistItem } from '@/types/simulation'
import { ShoppingCart, Trash2 } from 'lucide-react'

interface WatchlistRowProps {
  item: WatchlistItem
  livePrice?: number
  isStale?: boolean
  onBuy: () => void
  onRemove: () => void
}

export function WatchlistRow({ item, livePrice, isStale, onBuy, onRemove }: WatchlistRowProps) {
  const meta = ASSET_CLASS_META[item.assetClass]

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 transition-colors duration-150 group hover:bg-surface-raised">
      {/* Ticker Badge */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-data-xs font-mono font-semibold"
        style={{ backgroundColor: meta.bgColor, color: meta.color, border: `1px solid ${meta.borderColor}` }}
      >
        {item.ticker.slice(0, 4)}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-data-sm font-semibold text-ink truncate">{item.ticker}</p>
        <p className="text-data-xs text-ink-muted truncate">{item.name}</p>
      </div>

      {/* Class — hidden on mobile */}
      <div
        className="hidden sm:flex items-center px-2 py-0.5 rounded-md text-data-xs font-medium w-20"
        style={{ backgroundColor: meta.bgColor, color: meta.color }}
      >
        {meta.label}
      </div>

      {/* Live price */}
      <div className="text-right w-24">
        {livePrice !== undefined ? (
          <>
            <p className="font-mono text-data-sm text-ink">{formatCurrency(livePrice)}</p>
            {isStale && <p className="text-data-xs text-amber">cached</p>}
          </>
        ) : (
          <p className="font-mono text-data-sm text-ink-faint">—</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" onClick={onBuy} title="Position eröffnen">
          <ShoppingCart size={14} strokeWidth={2} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          title="Von Watchlist entfernen"
          className="opacity-0 group-hover:opacity-100 hover:text-loss"
        >
          <Trash2 size={14} strokeWidth={2} />
        </Button>
      </div>
    </div>
  )
}
