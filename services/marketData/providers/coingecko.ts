/**
 * /services/marketData/providers/coingecko.ts
 *
 * CoinGecko free public API — no key required, generous rate limit
 * (10-30 req/min). Supports batched lookups via the `ids` query param,
 * so an entire crypto portfolio is fetched in a single request.
 *
 * Docs: https://www.coingecko.com/en/api/documentation
 */

import type { MarketDataProviderClient } from '../types'

const BASE_URL = 'https://api.coingecko.com/api/v3'

/**
 * Fetch live USD prices for a batch of CoinGecko coin IDs in one call.
 * Returns a map keyed by the *CoinGecko id* (e.g. "bitcoin") — the caller
 * is responsible for mapping back to the portfolio ticker.
 */
async function fetchQuotes(
  providerIds: string[]
): Promise<Map<string, { price: number; currency: string }>> {
  const result = new Map<string, { price: number; currency: string }>()
  if (providerIds.length === 0) return result

  const ids = providerIds.join(',')
  const url = `${BASE_URL}/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd`

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    // CoinGecko's free tier doesn't need auth; cache briefly client-side
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`CoinGecko request failed: ${res.status} ${res.statusText}`)
  }

  const data = (await res.json()) as Record<string, { usd?: number }>

  for (const id of providerIds) {
    const price = data[id]?.usd
    if (typeof price === 'number') {
      result.set(id, { price, currency: 'USD' })
    }
  }

  return result
}

export const coingeckoProvider: MarketDataProviderClient = {
  name: 'coingecko',
  fetchQuotes,
}
