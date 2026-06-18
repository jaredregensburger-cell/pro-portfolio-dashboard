'use client'

/**
 * /features/portfolio/useLiveMarketData.ts
 *
 * Polls live prices for every distinct (ticker, assetClass) in the current
 * simulation on a fixed interval, and exposes the result as a ticker → price
 * Map ready to hand straight to computeAssetPosition / getPortfolioAnalytics.
 *
 * Refresh cadence: every 45 seconds (inside the requested 30–60s window).
 * Pauses while the tab is hidden to avoid burning API quota in the background,
 * and immediately resumes (with a fetch) when the tab becomes visible again.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchLiveQuotes, type QuoteFetchError } from '@/services/marketData'
import { showWarningToast } from '@/store/toast.store'
import type { AssetClass } from '@/types'

const REFRESH_INTERVAL_MS = 45_000

export type LiveDataStatus = 'idle' | 'loading' | 'success' | 'partial' | 'error'

/** Minimal shape needed to resolve a live price — satisfied by SimAsset and WatchlistItem alike */
export interface LivePriceTarget {
  ticker: string
  assetClass: AssetClass
}

export interface UseLiveMarketDataResult {
  /** ticker → live price, ready to pass into the calculation engine */
  livePrices: Map<string, number>
  /** Tickers currently served from cache because their live fetch failed */
  staleTickers: Set<string>
  status: LiveDataStatus
  lastUpdatedAt: string | null
  errors: QuoteFetchError[]
  /** Trigger an immediate refresh outside the normal interval */
  refresh: () => void
}

export function useLiveMarketData(assets: LivePriceTarget[]): UseLiveMarketDataResult {
  const [livePrices, setLivePrices] = useState<Map<string, number>>(new Map())
  const [staleTickers, setStaleTickers] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState<LiveDataStatus>('idle')
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)
  const [errors, setErrors] = useState<QuoteFetchError[]>([])

  // Keep a stable list of (ticker, assetClass) — re-created only when the
  // asset set actually changes, so the interval effect doesn't restart
  // every render.
  const assetKeysRef = useRef<string>('')
  const previousStatusRef = useRef<LiveDataStatus>('idle')
  const assetsForFetch = assets.map((a) => ({ ticker: a.ticker, assetClass: a.assetClass }))
  const assetsKey = assetsForFetch.map((a) => `${a.ticker}:${a.assetClass}`).sort().join(',')

  const runFetch = useCallback(async (current: typeof assetsForFetch) => {
    if (current.length === 0) {
      setStatus('idle')
      return
    }

    setStatus((prev) => (prev === 'idle' ? 'loading' : prev))

    try {
      const { quotes, errors: fetchErrors } = await fetchLiveQuotes(current)

      const priceMap = new Map<string, number>()
      const stale = new Set<string>()

      for (const quote of quotes) {
        priceMap.set(quote.ticker, quote.price)
        if (quote.isStale) stale.add(quote.ticker)
      }

      setLivePrices(priceMap)
      setStaleTickers(stale)
      setErrors(fetchErrors)
      setLastUpdatedAt(new Date().toISOString())

      const nextStatus: LiveDataStatus =
        fetchErrors.length === 0 ? 'success' : priceMap.size > 0 ? 'partial' : 'error'

      // Only notify on the transition INTO a full outage, not on every
      // 45s poll while it stays down — otherwise a sustained API outage
      // would spam a toast every refresh cycle.
      if (nextStatus === 'error' && previousStatusRef.current !== 'error') {
        showWarningToast(
          'Live-Kurse nicht verfügbar',
          'Zeige zwischengespeicherte oder letzte Transaktionspreise.'
        )
      }
      previousStatusRef.current = nextStatus
      setStatus(nextStatus)
    } catch {
      // fetchLiveQuotes itself shouldn't throw (errors are caught per-provider),
      // but guard anyway so a refresh cycle never crashes the app.
      if (previousStatusRef.current !== 'error') {
        showWarningToast('Live-Kurse nicht verfügbar', 'Zeige zwischengespeicherte Preise.')
      }
      previousStatusRef.current = 'error'
      setStatus('error')
    }
  }, [])

  // ── Interval + visibility handling ──
  useEffect(() => {
    assetKeysRef.current = assetsKey
    if (assetsForFetch.length === 0) return

    let cancelled = false
    const tick = () => {
      if (cancelled || document.visibilityState !== 'visible') return
      runFetch(assetsForFetch)
    }

    // Fetch immediately, then on a fixed interval
    tick()
    const intervalId = window.setInterval(tick, REFRESH_INTERVAL_MS)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
    // assetsKey captures the actual dependency; assetsForFetch is derived from it each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetsKey, runFetch])

  const refresh = useCallback(() => {
    runFetch(assetsForFetch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetsKey, runFetch])

  return { livePrices, staleTickers, status, lastUpdatedAt, errors, refresh }
}
