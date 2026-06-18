'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useActivePortfolioData } from './useActivePortfolioData'
import { useLiveMarketData, type UseLiveMarketDataResult } from './useLiveMarketData'
import { useUIStore } from '@/store'

const LiveMarketDataContext = createContext<UseLiveMarketDataResult | null>(null)

export function LiveMarketDataProvider({ children }: { children: ReactNode }) {
  const { assets } = useActivePortfolioData()
  const currency = useUIStore((s) => s.currency)
  const liveData = useLiveMarketData(assets, currency)

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
