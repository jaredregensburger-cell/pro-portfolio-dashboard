'use client'

import { useEffect, useRef } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { getPortfolioAnalytics } from '@/features/portfolio/logic'
import type { SimAsset, SimTransaction } from '@/types/simulation'

type Input = {
  portfolioId: string | null
  assets: SimAsset[]
  transactions: SimTransaction[]
  livePrices: Map<string, number>
  currency: string
  enabled?: boolean
}

export function usePortfolioSnapshotWriter({
  portfolioId,
  assets,
  transactions,
  livePrices,
  currency,
  enabled = true,
}: Input) {
  const lastWrittenKeyRef = useRef<string | null>(null)

  useEffect(() => {
    async function writeSnapshot() {
      if (!enabled) return
      if (!portfolioId) return
      if (assets.length === 0) return
      if (transactions.length === 0) return

      const today = new Date().toISOString().slice(0, 10)
      const analytics = getPortfolioAnalytics(assets, transactions, livePrices)

      if (analytics.totalValue <= 0) return

      const key = `${portfolioId}:${today}:${Math.round(analytics.totalValue * 100)}`

      if (lastWrittenKeyRef.current === key) return
      lastWrittenKeyRef.current = key

      const supabase = createSupabaseBrowserClient()

      const { error } = await supabase
        .from('portfolio_snapshots')
        .upsert(
          {
            portfolio_id: portfolioId,
            total_value: analytics.totalValue,
            total_cost: analytics.totalCost,
            currency,
            interval: 'daily',
            snapshot_date: today,
          },
          {
            onConflict: 'portfolio_id,snapshot_date,interval',
          }
        )

      if (error) {
        console.error('Portfolio snapshot write error:', error)
      } else {
        window.dispatchEvent(new Event('folio:portfolio-changed'))
      }
    }

    writeSnapshot()
  }, [portfolioId, assets, transactions, livePrices, currency, enabled])
}
