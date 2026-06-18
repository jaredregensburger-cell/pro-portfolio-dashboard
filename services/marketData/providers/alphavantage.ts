/**
 * /services/marketData/providers/alphavantage.ts
 *
 * Alpha Vantage GLOBAL_QUOTE endpoint — requires an API key, free tier is
 * limited to ~5 requests/minute and 25/day. There is no native batch
 * endpoint on the free tier, so requests are issued sequentially with a
 * small delay between them to stay under the rate limit.
 *
 * Docs: https://www.alphavantage.co/documentation/#latestprice
 */

import type { MarketDataProviderClient } from '../types'

const BASE_URL = 'https://www.alphavantage.co/query'
const REQUEST_DELAY_MS = 250 // stay well under the 5/min free-tier limit when batching a few symbols

function getApiKey(): string {
  const key = process.env.NEXT_PUBLIC_ALPHAVANTAGE_API_KEY
  if (!key) {
    throw new Error(
      'NEXT_PUBLIC_ALPHAVANTAGE_API_KEY is not set. Get a free key at alphavantage.co/support/#api-key'
    )
  }
  return key
}

interface GlobalQuoteResponse {
  'Global Quote'?: {
    '01. symbol'?: string
    '05. price'?: string
  }
  Note?: string // present when the rate limit is hit
  Information?: string // present on invalid key / other API-level errors
}

async function fetchSingleQuote(symbol: string, apiKey: string): Promise<number | null> {
  const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Alpha Vantage request failed: ${res.status} ${res.statusText}`)
  }

  const data = (await res.json()) as GlobalQuoteResponse

  if (data.Note || data.Information) {
    throw new Error(data.Note ?? data.Information ?? 'Alpha Vantage API limit reached')
  }

  const priceStr = data['Global Quote']?.['05. price']
  const price = priceStr ? parseFloat(priceStr) : null
  return price !== null && !Number.isNaN(price) ? price : null
}

/**
 * Fetch quotes for a batch of stock/ETF symbols.
 * Sequential with a short delay between calls — the free tier has no
 * batch endpoint, so this trades latency for staying under rate limits.
 * A failure on one symbol does not abort the rest of the batch.
 */
async function fetchQuotes(
  providerIds: string[]
): Promise<Map<string, { price: number; currency: string }>> {
  const result = new Map<string, { price: number; currency: string }>()
  if (providerIds.length === 0) return result

  const apiKey = getApiKey()

  for (let i = 0; i < providerIds.length; i++) {
    const symbol = providerIds[i]
    try {
      const price = await fetchSingleQuote(symbol, apiKey)
      if (price !== null) {
        result.set(symbol, { price, currency: 'USD' })
      }
    } catch (err) {
      // Swallow per-symbol errors so one bad/rate-limited ticker doesn't
      // block the others — the refresh loop will fall back to cache for it.
      console.warn(`[alphavantage] failed to fetch ${symbol}:`, err)
    }

    if (i < providerIds.length - 1) {
      await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS))
    }
  }

  return result
}

export const alphaVantageProvider: MarketDataProviderClient = {
  name: 'alphavantage',
  fetchQuotes,
}
