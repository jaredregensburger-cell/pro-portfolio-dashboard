/**
 * /services/marketData/index.ts
 *
 * Live market data via your own Next.js API route:
 * /api/market-price
 *
 * The API key stays server-side in Vercel:
 * TWELVE_DATA_API_KEY=...
 */

import type { AssetClass } from '@/types'
import { getCachedQuote, setCachedQuote } from './cache'
import type { Quote, QuoteFetchError, QuoteBatchResult } from './types'

export type { Quote, QuoteFetchError, QuoteBatchResult } from './types'
export { getAllCachedQuotes, clearQuoteCache } from './cache'

export function hasLivePriceSource() {
  return true
}

export function resolveSymbol(ticker: string) {
  return ticker
}

export async function fetchLiveQuotes(
  assets: Array<{ ticker: string; assetClass: AssetClass }>,
  currency = 'USD'
): Promise<QuoteBatchResult> {
  const uniqueAssets = Array.from(
    new Map(
      assets.map((a) => [`${a.ticker}:${a.assetClass}`, a])
    ).values()
  )

  const quotes: Quote[] = []
  const errors: QuoteFetchError[] = []

  await Promise.all(
    uniqueAssets.map(async (asset) => {
      try {
        const params = new URLSearchParams({
          ticker: asset.ticker,
          assetClass: asset.assetClass,
          currency,
        })

        const response = await fetch(`/api/market-price?${params.toString()}`, {
          cache: 'no-store',
        })

        const json = await response.json()

        if (!response.ok) {
          throw new Error(json.error ?? 'Price fetch failed')
        }

        const price = Number(json.price)

        if (!Number.isFinite(price) || price <= 0) {
          throw new Error('Invalid price returned')
        }

        const quote: Quote = {
          ticker: asset.ticker,
          price,
          currency,
          provider: 'twelve-data' as any,
          fetchedAt: new Date().toISOString(),
          isStale: false,
        }

        quotes.push(quote)

        setCachedQuote(asset.ticker, {
          price: quote.price,
          currency: quote.currency,
          provider: quote.provider,
        })
      } catch (err) {
        const cached = getCachedQuote(asset.ticker)

        if (cached) {
          quotes.push({
            ...cached,
            provider: cached.provider,
            isStale: true,
          })
        }

        errors.push({
          ticker: asset.ticker,
          provider: 'twelve-data' as any,
          message: err instanceof Error ? err.message : 'Unknown price error',
        })
      }
    })
  )

  return { quotes, errors }
}

export async function fetchLivePriceMap(
  assets: Array<{ ticker: string; assetClass: AssetClass }>,
  currency = 'USD'
): Promise<Map<string, number>> {
  const { quotes } = await fetchLiveQuotes(assets, currency)
  return new Map(quotes.map((q) => [q.ticker, q.price]))
}
