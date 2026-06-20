'use client'

import { useCallback, useEffect, useState } from 'react'
import { GlassCard, EmptyState, Button } from '@/components/ui'
import { useModalStore, useUIStore } from '@/store'
import { showInfoToast } from '@/store/toast.store'
import { useLiveMarketData } from '@/features/portfolio/useLiveMarketData'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { WatchlistRow } from './WatchlistRow'
import { Star, Plus } from 'lucide-react'
import type { AssetClass } from '@/types'

type DbWatchlistItem = {
  id: string
  user_id: string
  ticker: string
  name: string
  asset_class: string
  currency: string
  created_at: string
}

function mapAssetClass(value: string): AssetClass {
  if (value === 'equity') return 'stock'
  if (value === 'commodity') return 'metal'
  if (value === 'crypto') return 'crypto'
  if (value === 'etf') return 'etf'
  if (value === 'cash') return 'cash'
  return value as AssetClass
}

export function WatchlistShell() {
  const [items, setItems] = useState<DbWatchlistItem[]>([])
  const [loading, setLoading] = useState(true)

  const openModal = useModalStore((s) => s.openModal)
  const currency = useUIStore((s) => s.currency)

  const liveTargets = items.map((item) => ({
    ticker: item.ticker,
    assetClass: mapAssetClass(item.asset_class),
  }))

  const { livePrices, staleTickers } = useLiveMarketData(liveTargets, currency)

  const loadWatchlist = useCallback(async () => {
    setLoading(true)

    try {
      const supabase = createSupabaseBrowserClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setItems([])
        return
      }

      const { data, error } = await supabase
        .from('watchlist_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setItems((data ?? []) as DbWatchlistItem[])
    } catch (err) {
      console.error('Watchlist load error:', err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadWatchlist()

    const handleRefresh = () => {
      loadWatchlist()
    }

    window.addEventListener('folio:watchlist-changed', handleRefresh)

    return () => {
      window.removeEventListener('folio:watchlist-changed', handleRefresh)
    }
  }, [loadWatchlist])

  async function removeItem(id: string, ticker: string) {
    try {
      const supabase = createSupabaseBrowserClient()

      const { error } = await supabase
        .from('watchlist_items')
        .delete()
        .eq('id', id)

      if (error) throw error

      showInfoToast(`${ticker} entfernt`, 'Von der Watchlist genommen.')
      window.dispatchEvent(new Event('folio:watchlist-changed'))
      await loadWatchlist()
    } catch (err) {
      console.error('Watchlist delete error:', err)
      showInfoToast(
        'Entfernen fehlgeschlagen',
        err instanceof Error ? err.message : 'Watchlist-Eintrag konnte nicht gelöscht werden.'
      )
    }
  }

  function handleBuy(item: DbWatchlistItem) {
    openModal('add-asset', {
      ticker: item.ticker,
      name: item.name,
    })
  }

  if (loading) {
    return (
      <GlassCard>
        <p className="text-data-sm text-ink-muted">Watchlist lädt…</p>
      </GlassCard>
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Star}
        title="Watchlist ist leer"
        description="Beobachte Assets, bevor du investierst."
        action={{ label: 'Asset beobachten', onClick: () => openModal('add-watchlist-item') }}
      />
    )
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
          {items.map((item) => {
            const assetClass = mapAssetClass(item.asset_class)

            return (
              <WatchlistRow
                key={item.id}
                item={{
                  id: item.id,
                  ticker: item.ticker,
                  name: item.name,
                  assetClass,
                  addedAt: item.created_at,
                }}
                livePrice={livePrices.get(item.ticker)}
                isStale={staleTickers.has(item.ticker)}
                onBuy={() => handleBuy(item)}
                onRemove={() => removeItem(item.id, item.ticker)}
              />
            )
          })}
        </div>
      </GlassCard>
    </div>
  )
}
