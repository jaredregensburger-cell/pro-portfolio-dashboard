'use client'

import { useState } from 'react'
import { GlassCard, EmptyState, SkeletonTable } from '@/components/ui'
import { useModalStore, useSimulationStore, useUIStore } from '@/store'
import { showInfoToast } from '@/store/toast.store'
import { useActivePortfolioData } from '@/features/portfolio/useActivePortfolioData'
import { useLiveMarketDataContext } from '@/features/portfolio/LiveMarketDataProvider'
import { getRankedPositions } from '@/features/portfolio/logic'
import { AssetRow } from './AssetRow'
import { formatCurrency } from '@/lib/utils'
import { ASSET_CLASS_OPTIONS } from '@/lib/constants'
import type { AssetClass } from '@/types'
import { Wallet } from 'lucide-react'

const FILTERS: Array<{ label: string; value: AssetClass | 'all' }> = [
  { label: 'All', value: 'all' },
  ...ASSET_CLASS_OPTIONS,
]

export function AssetsShell() {
  const [filter, setFilter] = useState<AssetClass | 'all'>('all')

  const { assets, transactions, hasHydrated } = useActivePortfolioData()
  const { livePrices } = useLiveMarketDataContext()
  const removeAsset = useSimulationStore((s) => s.removeAsset)
  const openModal = useModalStore((s) => s.openModal)
  const currency = useUIStore((s) => s.currency)

  if (!hasHydrated) {
    return <SkeletonTable rows={6} />
  }

  if (assets.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="Noch keine Assets"
        description="Lege dein erstes Asset an — Aktien, Krypto, ETFs, Edelmetalle oder Cash. Bestand und Durchschnittspreis werden automatisch aus deinen Transaktionen berechnet."
        action={{ label: 'Asset hinzufügen', onClick: () => openModal('add-asset') }}
      />
    )
  }

  const ranked = getRankedPositions(assets, transactions, livePrices).filter(
    (p) => filter === 'all' || p.asset.assetClass === filter
  )

  const totalValue = ranked.reduce((sum, p) => sum + p.position.currentValue, 0)

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 sm:overflow-visible sm:mx-0 sm:px-0">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as AssetClass | 'all')}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-data-sm font-medium border transition-all duration-150 ${
                filter === f.value
                  ? 'bg-signal/10 text-signal border-signal/25'
                  : 'text-ink-muted border-border hover:border-border-strong hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto font-mono text-data-sm text-ink-muted shrink-0">
          {ranked.length} {ranked.length === 1 ? 'asset' : 'assets'} ·{' '}
          <span className="text-ink font-medium">{formatCurrency(totalValue, currency)}</span>
        </div>
      </div>

      {/* Table */}
      <GlassCard padding="none" className="overflow-x-auto">
        {/* Header */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-border min-w-[640px]">
          <div className="w-9 shrink-0" />
          <p className="flex-1 text-data-xs font-medium text-ink-faint uppercase tracking-wide">
            Asset
          </p>
          <p className="hidden sm:block text-data-xs font-medium text-ink-faint uppercase tracking-wide w-20">
            Class
          </p>
          <p className="hidden md:block text-data-xs font-medium text-ink-faint uppercase tracking-wide text-right w-32">
            Position · Ø Cost
          </p>
          <p className="hidden sm:block text-data-xs font-medium text-ink-faint uppercase tracking-wide text-right w-20">
            Price
          </p>
          <p className="text-data-xs font-medium text-ink-faint uppercase tracking-wide text-right w-24">
            Value
          </p>
          <p className="text-data-xs font-medium text-ink-faint uppercase tracking-wide text-right w-[76px]">
            P&L
          </p>
          <div className="w-[68px] shrink-0" />
        </div>

        {/* Rows */}
        <div className="divide-y divide-border min-w-[640px]">
          {ranked.map(({ asset, position }) => (
            <AssetRow
              key={asset.id}
              asset={asset}
              position={position}
              onTrade={() => openModal('add-transaction', { assetId: asset.id })}
              onRemove={() => {
                removeAsset(asset.id)
                showInfoToast(`${asset.ticker} entfernt`, 'Asset und zugehörige Transaktionen wurden gelöscht.')
              }}
            />
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
