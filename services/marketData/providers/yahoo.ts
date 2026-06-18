/**
 * /services/marketData/providers/yahoo.ts
 *
 * Yahoo Finance has no official public API, but its quote endpoint is
 * widely used unofficially and supports comma-separated batch lookups,
 * which is exactly what XAU/XAG spot pricing needs.
 *
 * Because this is unofficial and CORS-restricted from the browser, calls
 * are routed through our own /api/market-data/yahoo proxy route rather
 * than fetching api.finance.yahoo.com directly from client code.
 */

import type { MarketDataProviderClient } from '../types'

const PROXY_URL = '/api/market-data/yahoo'

interface YahooQuoteResult {
  symbol?: string
  regularMarketPrice?: number
  currency?: string
}

interface YahooQuoteResponse {
  quoteResponse?: {
    result?: YahooQuoteResult[]
  }
}

/**
 * Fetch quotes for a batch of Yahoo Finance symbols (e.g. "XAUUSD=X").
 * Single batched request via our server-side proxy.
 */
async function fetchQuotes(
  providerIds: string[]
): Promise<Map<string, { price: number; currency: string }>> {
  const result = new Map<string, { price: number; currency: string }>()
  if (providerIds.length === 0) return result

  const symbols = providerIds.join(',')
  const url = `${PROXY_URL}?symbols=${encodeURIComponent(symbols)}`

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Yahoo Finance proxy request failed: ${res.status} ${res.statusText}`)
  }

  const data = (await res.json()) as YahooQuoteResponse
  const quotes = data.quoteResponse?.result ?? []

  for (const q of quotes) {
    if (q.symbol && typeof q.regularMarketPrice === 'number') {
      result.set(q.symbol, { price: q.regularMarketPrice, currency: q.currency ?? 'USD' })
    }
  }

  return result
}

export const yahooProvider: MarketDataProviderClient = {
  name: 'yahoo',
  fetchQuotes,
}
