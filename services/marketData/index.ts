/**
 * /services/marketData/index.ts
 *
 * Public entry point for live market data. This is the only file the rest
 * of the app should import from — it hides the provider clients, the
 * symbol map, and the cache behind one function:
 *
 *   const quotes = await fetchLiveQuotes(assets)
 *
 * FALLBACK RULE: if a provider call fails for any reason (network error,
 * rate limit, invalid symbol), the last cached price for that ticker is
 * returned instead, flagged with `isStale: true`. A ticker with no live
 * source and no cache simply isn't included in the result — callers fall
 * back to the transaction-derived mark-to-market price in that case.
 */

import type { AssetClass } from '@/types'
import { groupByProvider, type MarketDataProvider } from './symbolMap'
import { getCachedQuote, setCachedQuote } from './cache'
import type { Quote, QuoteFetchError, QuoteBatchResult } from './types'
import { coingeckoProvider } from './providers/coingecko'
import { alphaVantageProvider } from './providers/alphavantage'
import { yahooProvider } from './providers/yahoo'

export type { Quote, QuoteFetchError, QuoteBatchResult } from './types'
export { hasLivePriceSource, resolveSymbol } from './symbolMap'
export { getAllCachedQuotes, clearQuoteCache } from './cache'

const PROVIDERS = {
  coingecko: coingeckoProvider,
  alphavantage: alphaVantageProvider,
  yahoo: yahooProvider,
} as const

// ─── Core Fetch + Fallback Logic ─────────────────────────────────────────────

/**
 * Fetch live quotes for a list of portfolio assets, grouped and batched
 * per provider. Every ticker gets a result if either the live call or
 * the cache can supply one; tickers with neither are simply omitted.
 */
export async function fetchLiveQuotes(
  assets: Array<{ ticker: string; assetClass: AssetClass }>
): Promise<QuoteBatchResult> {
  const grouped = groupByProvider(assets)
  const quotes: Quote[] = []
  const errors: QuoteFetchError[] = []

  await Promise.all(
    (Object.keys(grouped) as MarketDataProvider[]).map(async (providerName) => {
      const mappings = grouped[providerName]
      if (mappings.length === 0) return

      const client = PROVIDERS[providerName]
      const providerIds = mappings.map((m) => m.providerId)

      try {
        const priceMap = await client.fetchQuotes(providerIds)

        for (const mapping of mappings) {
          const live = priceMap.get(mapping.providerId)

          if (live) {
            const quote: Quote = {
              ticker: mapping.ticker,
              price: live.price,
              currency: live.currency,
              provider: providerName,
              fetchedAt: new Date().toISOString(),
              isStale: false,
            }
            quotes.push(quote)
            setCachedQuote(mapping.ticker, {
              price: quote.price,
              currency: quote.currency,
              provider: quote.provider,
            })
          } else {
            pushFallbackOrError(mapping.ticker, providerName, 'No price returned for symbol', quotes, errors)
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown provider error'
        for (const mapping of mappings) {
          pushFallbackOrError(mapping.ticker, providerName, message, quotes, errors)
        }
      }
    })
  )

  return { quotes, errors }
}

/**
 * Try the cache for a ticker that failed a live fetch. If a cached value
 * exists, push it (marked stale) so the UI still has a number to show.
 * Otherwise, record the failure so the caller/UI can surface it.
 */
function pushFallbackOrError(
  ticker: string,
  provider: MarketDataProvider,
  message: string,
  quotes: Quote[],
  errors: QuoteFetchError[]
) {
  const cached = getCachedQuote(ticker)
  if (cached) {
    quotes.push({ ...cached, provider })
  }
  errors.push({ ticker, provider, message })
}

/**
 * Convenience: fetch quotes and return them as a simple ticker → price map,
 * for callers that don't need staleness/provider metadata.
 */
export async function fetchLivePriceMap(
  assets: Array<{ ticker: string; assetClass: AssetClass }>
): Promise<Map<string, number>> {
  const { quotes } = await fetchLiveQuotes(assets)
  return new Map(quotes.map((q) => [q.ticker, q.price]))
}
