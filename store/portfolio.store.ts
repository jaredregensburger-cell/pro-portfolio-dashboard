/**
 * /store/portfolio.store.ts
 *
 * UI-only state for portfolio views — currently just the selected chart
 * time range. Actual portfolio DATA (portfolios, assets, transactions)
 * lives in simulation.store.ts, which is the single source of truth for
 * everything derived from the transaction ledger. This store stays
 * deliberately thin so there's no duplicated ownership of portfolio state.
 */

import { create } from 'zustand'
import type { TimeRange } from '@/types'

interface PortfolioUIState {
  selectedTimeRange: TimeRange
  setTimeRange: (range: TimeRange) => void
}

export const usePortfolioStore = create<PortfolioUIState>((set) => ({
  selectedTimeRange: '1M',
  setTimeRange: (range) => set({ selectedTimeRange: range }),
}))
