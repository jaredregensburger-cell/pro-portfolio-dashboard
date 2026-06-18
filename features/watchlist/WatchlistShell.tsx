'use client'

import { GlassCard, EmptyState, Button } from '@/components/ui'
import { useWatchlistStore, useModalStore, useSimulationStore } from '@/store'
import { showInfoToast } from '@/store/toast.store'
import { useLiveMarketData } from '@/features/portfolio/useLiveMarketData'
import { WatchlistRow } from './WatchlistRow'
import { Star, Plus } from 'lucide-react'

export function WatchlistShell() {
  const items = useWatchlistStore((s) => s.items)
  const removeItem = useWatchlistStore((s) => s.removeItem)
  const openModal = useModalStore((s) => s.openModal)
  const addAsset = useSimulationStore((s) => s.addAsset)

  // Watchlist items have no transaction history, so they need their own
  // live price feed — separate from the portfolio's LiveMarketDataProvider,
  // which only polls assets that are actually held.
  const { livePrices, staleTickers } = useLiveMarketData(
    items.map((i) => ({ ticker: i.ticker, assetClass: i.assetClass }))
  )

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Star}
        title="Watchlist ist leer"
        description="Beobachte Assets, bevor du investierst. Sobald du eine Transaktion erfasst, wird automatisch eine echte Position daraus."
        action={{ label: 'Asset beobachten', onClick: () => openModal('add-watchlist-item') }}
      />
    )
  }

  function handleBuy(item: (typeof items)[number]) {
    // Promote the watchlist item into a real tracked asset, then open the
    // Add Transaction modal pre-filled with it — exactly the same flow as
    // creating a brand-new asset from the Assets page.
    const result = addAsset({
      ticker: item.ticker,
      name: item.name,
      assetClass: item.assetClass,
    })

    if (result.success) {
      removeItem(item.id)
      openModal('add-transaction', { assetId: result.asset.id, type: 'buy' })
    } else {
      // Asset already exists in the active portfolio — just jump to recording a buy
      openModal('add-transaction', { type: 'buy' })
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="font-mono text-data-sm text-ink-muted">
          {items.length} {items.length === 1 ? 'Asset' : 'Assets'} beobachtet
        </p>
        <Button variant="secondary" size="sm" onClick={() => openModal('add-watchlist-item')}>
          <Plus size={14} strokeWidth={2.5} />
          Hinzufügen
        </Button>
      </div>

      <GlassCard padding="none">
        <div className="divide-y divide-border">
          {items.map((item) => (
            <WatchlistRow
              key={item.id}
              item={item}
              livePrice={livePrices.get(item.ticker)}
              isStale={staleTickers.has(item.ticker)}
              onBuy={() => handleBuy(item)}
              onRemove={() => {
                removeItem(item.id)
                showInfoToast(`${item.ticker} entfernt`, 'Von der Watchlist genommen.')
              }}
            />
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
