import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AssetClass } from '@/types'
import type { WatchlistItem } from '@/types/simulation'
import { generateId } from '@/lib/utils'

export interface AddWatchlistItemInput {
  ticker:     string
  name:       string
  assetClass: AssetClass
}

export type AddWatchlistItemResult =
  | { success: true; item: WatchlistItem }
  | { success: false; error: string }

interface WatchlistState {
  items: WatchlistItem[]

  addItem:    (input: AddWatchlistItemInput) => AddWatchlistItemResult
  removeItem: (itemId: string) => void
  isWatched:  (ticker: string) => boolean
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (input) => {
        const ticker = input.ticker.trim().toUpperCase()
        const name = input.name.trim()

        if (!ticker) return { success: false, error: 'Symbol ist erforderlich' }
        if (!name) return { success: false, error: 'Name ist erforderlich' }

        if (get().items.some((i) => i.ticker === ticker)) {
          return { success: false, error: `${ticker} ist bereits auf deiner Watchlist` }
        }

        const item: WatchlistItem = {
          id: generateId('watch'),
          ticker,
          name,
          assetClass: input.assetClass,
          addedAt: new Date().toISOString(),
        }

        set((state) => ({ items: [...state.items, item] }))
        return { success: true, item }
      },

      removeItem: (itemId) => {
        set((state) => ({ items: state.items.filter((i) => i.id !== itemId) }))
      },

      isWatched: (ticker) => {
        const t = ticker.trim().toUpperCase()
        return get().items.some((i) => i.ticker === t)
      },
    }),
    { name: 'folio-watchlist', version: 1 }
  )
)
