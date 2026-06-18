'use client'

/**
 * /features/portfolio/useActivePortfolioData.ts
 *
 * Every dashboard/assets/transactions view needs the SAME thing: the
 * assets and transactions belonging to whichever portfolio is currently
 * active. Rather than repeating that filter in every component, this hook
 * is the single place that does it — keeping selection logic out of the UI
 * layer and out of the store's raw state shape.
 */

import { useMemo } from 'react'
import { useSimulationStore } from '@/store'
import type { SimAsset, SimTransaction } from '@/types/simulation'

export interface ActivePortfolioData {
  portfolioId:  string | null
  assets:       SimAsset[]
  transactions: SimTransaction[]
  /** False during the brief window before persisted state has loaded from localStorage */
  hasHydrated:  boolean
}

export function useActivePortfolioData(): ActivePortfolioData {
  const activePortfolioId = useSimulationStore((s) => s.activePortfolioId)
  const allAssets = useSimulationStore((s) => s.assets)
  const allTransactions = useSimulationStore((s) => s.transactions)
  const hasHydrated = useSimulationStore((s) => s.hasHydrated)

  const assets = useMemo(
    () => allAssets.filter((a) => a.portfolioId === activePortfolioId),
    [allAssets, activePortfolioId]
  )

  const transactions = useMemo(() => {
    const assetIds = new Set(assets.map((a) => a.id))
    return allTransactions.filter((t) => assetIds.has(t.assetId))
  }, [allTransactions, assets])

  return { portfolioId: activePortfolioId, assets, transactions, hasHydrated }
}
