'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useActivePortfolioData } from './useActivePortfolioData'
import { useLiveMarketData, type UseLiveMarketDataResult } from './useLiveMarketData'

const LiveMarketDataContext = createContext<UseLiveMarketDataResult | null>(null)

export function LiveMarketDataProvider({ children }: { children: ReactNode }) {
  const { assets } = useActivePortfolioData()
  const liveData = useLiveMarketData(assets)

  return (
    <LiveMarketDataContext.Provider value={liveData}>{children}</LiveMarketDataContext.Provider>
  )
}

/**
 * Access the shared live market data feed. Must be used within
 * <LiveMarketDataProvider> (mounted once in AppShell).
 */
export function useLiveMarketDataContext(): UseLiveMarketDataResult {
  const ctx = useContext(LiveMarketDataContext)
  if (!ctx) {
    throw new Error('useLiveMarketDataContext must be used within a LiveMarketDataProvider')
  }
  return ctx
}
