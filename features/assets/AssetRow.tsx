'use client'

import { Badge, Button } from '@/components/ui'
import { cn, formatCurrency, formatPercent, formatNumber, gainBgColor } from '@/lib/utils'
import { ASSET_CLASS_META } from '@/lib/constants'
import { useUIStore } from '@/store'
import type { SimAsset, AssetPosition } from '@/types/simulation'
import { Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AssetRowProps {
  asset: SimAsset
  position: AssetPosition
  compact?: boolean
  onTrade?: () => void
  onRemove?: () => void
}

export function AssetRow({ asset, position, compact = false, onTrade, onRemove }: AssetRowProps) {
  const router = useRouter()
  const currency = useUIStore((s) => s.currency)

  const meta = ASSET_CLASS_META[asset.assetClass]
  const hasPosition = position.hasPosition

  function openAssetPage() {
    router.push(`/assets/${asset.ticker.toLowerCase()}`)
  }

  return (
    <div
      onClick={openAssetPage}
      className={cn(
        'flex items-center gap-4 px-5 transition-colors duration-150 group cursor-pointer hover:bg-surface-raised/60',
        compact ? 'py-3' : 'py-4'
      )}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-data-xs font-mono font-semibold"
        style={{ backgroundColor: meta.bgColor, color: meta.color, border: `1px solid ${meta.borderColor}` }}
      >
        {asset.ticker.slice(0, 4)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-data-sm font-semibold text-ink truncate">{asset.ticker}</p>
        {!compact && <p className="text-data-xs text-ink-muted truncate">{asset.name}</p>}
      </div>

      {!compact && (
        <Badge
          variant="default"
          size="sm"
          className="hidden sm:flex"
          style={{ backgroundColor: meta.bgColor, color: meta.color, borderColor: meta.borderColor }}
        >
          {meta.label}
        </Badge>
      )}

      {!compact && (
        <div className="hidden md:block text-right w-32">
          {hasPosition ? (
            <>
              <p className="font-mono text-data-sm text-ink">
                {formatNumber(position.quantity, asset.assetClass === 'crypto' ? 8 : 4)}
              </p>
              <p className="font-mono text-data-xs text-ink-faint">
                Ø {formatCurrency(position.avgCostBasis, currency)}
              </p>
            </>
          ) : (
            <p className="text-data-xs text-ink-faint">Keine Position</p>
          )}
        </div>
      )}

      <div className="text-right hidden sm:block w-20">
        {hasPosition ? (
          <p className="font-mono text-data-sm text-ink">
            {formatCurrency(position.currentPrice, currency)}
          </p>
        ) : (
          <p className="font-mono text-data-sm text-ink-faint">—</p>
        )}
      </div>

      <div className="text-right w-24">
        <p className="font-mono text-data-sm font-medium text-ink">
          {hasPosition ? formatCurrency(position.currentValue, currency) : '—'}
        </p>
      </div>

      <div
        className={cn(
          'flex items-center justify-end min-w-[76px] px-2 py-0.5 rounded-md font-mono text-data-xs font-medium',
          hasPosition ? gainBgColor(position.unrealizedGain) : 'bg-surface-elevated text-ink-faint'
        )}
      >
        {hasPosition ? formatPercent(position.unrealizedGainPct) : '–'}
      </div>

      {(onTrade || onRemove) && (
        <div className="flex items-center gap-1 shrink-0">
          {onTrade && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onTrade()
              }}
              title="Transaktion erfassen"
            >
              <Plus size={14} strokeWidth={2.5} />
            </Button>
          )}

          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              title="Asset entfernen"
              className="opacity-0 group-hover:opacity-100 hover:text-loss"
            >
              <Trash2 size={14} strokeWidth={2} />
            </Button>
          )}
        </div>
      )}
    </div> 
  )
}
