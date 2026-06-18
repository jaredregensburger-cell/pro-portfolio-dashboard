/**
 * /services/marketData/types.ts
 * Shared shapes used across providers, the cache, and the refresh loop.
 */

import type { MarketDataProvider } from './symbolMap'

export interface Quote {
  ticker:       string
  price:        number
  currency:     string
  provider:     MarketDataProvider
  /** When this price was fetched */
  fetchedAt:    string
  /** True if this quote came from cache because the live fetch failed */
  isStale:      boolean
}

export interface QuoteFetchError {
  ticker:   string
  provider: MarketDataProvider
  message:  string
}

export interface QuoteBatchResult {
  quotes: Quote[]
  errors: QuoteFetchError[]
}

export interface MarketDataProviderClient {
  name: MarketDataProvider
  /** Fetch live quotes for a batch of provider-specific IDs in one call where possible */
  fetchQuotes(providerIds: string[]): Promise<Map<string, { price: number; currency: string }>>
}
