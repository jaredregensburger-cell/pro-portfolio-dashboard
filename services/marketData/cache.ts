/**
 * /services/marketData/cache.ts
 *
 * Last-known-good price cache. Every successful quote is written here.
 * When a live fetch fails, the refresh loop falls back to whatever is
 * cached rather than showing nothing — the portfolio always has a number
 * to display, it just gets flagged as `isStale`.
 *
 * Persisted to localStorage so a page reload doesn't lose the last prices
 * even before the first refresh cycle completes.
 */

import type { Quote } from './types'

const STORAGE_KEY = 'folio-market-data-cache'
const STALE_AFTER_MS = 10 * 60 * 1000 // consider a cached quote stale after 10 minutes

interface CacheEntry {
  price:      number
  currency:   string
  provider:   Quote['provider']
  fetchedAt:  string
}

type CacheStore = Record<string, CacheEntry>

// ─── In-memory mirror (avoids re-parsing localStorage on every read) ─────────

let memoryCache: CacheStore | null = null

function readStorage(): CacheStore {
  if (memoryCache) return memoryCache

  if (typeof window === 'undefined') {
    memoryCache = {}
    return memoryCache
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    memoryCache = raw ? (JSON.parse(raw) as CacheStore) : {}
  } catch {
    memoryCache = {}
  }
  return memoryCache
}

function writeStorage(store: CacheStore) {
  memoryCache = store
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // localStorage full or unavailable — cache still works in-memory for this session
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Store a freshly fetched quote as the new last-known-good value for its ticker.
 */
export function setCachedQuote(ticker: string, entry: Omit<CacheEntry, 'fetchedAt'>): void {
  const store = readStorage()
  store[ticker.toUpperCase()] = { ...entry, fetchedAt: new Date().toISOString() }
  writeStorage(store)
}

/**
 * Retrieve the last cached quote for a ticker, if any exists.
 * Always returns isStale: true since by definition this is a fallback path.
 */
export function getCachedQuote(ticker: string): Quote | null {
  const store = readStorage()
  const entry = store[ticker.toUpperCase()]
  if (!entry) return null

  return {
    ticker: ticker.toUpperCase(),
    price: entry.price,
    currency: entry.currency,
    provider: entry.provider,
    fetchedAt: entry.fetchedAt,
    isStale: true,
  }
}

/**
 * Whether a cached entry exists and is recent enough to be considered
 * a "warm" fallback rather than ancient data (purely informational —
 * the cache is still served regardless, just labeled accordingly).
 */
export function isCacheFresh(ticker: string): boolean {
  const store = readStorage()
  const entry = store[ticker.toUpperCase()]
  if (!entry) return false
  return Date.now() - new Date(entry.fetchedAt).getTime() < STALE_AFTER_MS
}

/**
 * Clear the entire cache. Mostly useful for tests or a manual "reset" action.
 */
export function clearQuoteCache(): void {
  writeStorage({})
}

/**
 * Snapshot of every cached ticker, used for debugging / settings display.
 */
export function getAllCachedQuotes(): Quote[] {
  const store = readStorage()
  return Object.entries(store).map(([ticker, entry]) => ({
    ticker,
    price: entry.price,
    currency: entry.currency,
    provider: entry.provider,
    fetchedAt: entry.fetchedAt,
    isStale: true,
  }))
}
