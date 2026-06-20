'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useActivePortfolioData } from './useActivePortfolioData'
import { useLiveMarketData, type UseLiveMarketDataResult } from './useLiveMarketData'
import { usePortfolioSnapshotWriter } from './usePortfolioSnapshotWriter'
import { useUIStore } from '@/store'

const LiveMarketDataContext = createContext<UseLiveMarketDataResult | null>(null)

export function LiveMarketDataProvider({ children }: { children: ReactNode }) {
  const { portfolioId, assets, transactions, hasHydrated } = useActivePortfolioData()
  const currency = useUIStore((s) => s.currency)

  const liveData = useLiveMarketData(assets, currency)

  usePortfolioSnapshotWriter({
    portfolioId,
    assets,
    transactions,
    livePrices: liveData.livePrices,
    currency,
    enabled: hasHydrated && liveData.status !== 'loading',
  })

  return (
    <LiveMarketDataContext.Provider value={liveData}>
      {children}
    </LiveMarketDataContext.Provider>
  )
}

export function useLiveMarketDataContext(): UseLiveMarketDataResult {
  const ctx = useContext(LiveMarketDataContext)

  if (!ctx) {
    throw new Error('useLiveMarketDataContext must be used within a LiveMarketDataProvider')
  }

  return ctx
}
