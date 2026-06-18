'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchLiveQuotes, type QuoteFetchError } from '@/services/marketData'
import { showWarningToast } from '@/store/toast.store'
import type { AssetClass } from '@/types'

const REFRESH_INTERVAL_MS = 45_000

export type LiveDataStatus = 'idle' | 'loading' | 'success' | 'partial' | 'error'

export interface LivePriceTarget {
  ticker: string
  assetClass: AssetClass
}

export interface UseLiveMarketDataResult {
  livePrices: Map<string, number>
  staleTickers: Set<string>
  status: LiveDataStatus
  lastUpdatedAt: string | null
  errors: QuoteFetchError[]
  refresh: () => void
}

export function useLiveMarketData(
  assets: LivePriceTarget[],
  currency = 'USD'
): UseLiveMarketDataResult {
  const [livePrices, setLivePrices] = useState<Map<string, number>>(new Map())
  const [staleTickers, setStaleTickers] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState<LiveDataStatus>('idle')
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)
  const [errors, setErrors] = useState<QuoteFetchError[]>([])

  const previousStatusRef = useRef<LiveDataStatus>('idle')

  const assetsForFetch = assets.map((a) => ({
    ticker: a.ticker,
    assetClass: a.assetClass,
  }))

  const assetsKey = assetsForFetch
    .map((a) => `${a.ticker}:${a.assetClass}`)
    .sort()
    .join(',')

  const runFetch = useCallback(
    async (current: typeof assetsForFetch) => {
      if (current.length === 0) {
        setStatus('idle')
        setLivePrices(new Map())
        setStaleTickers(new Set())
        setErrors([])
        return
      }

      setStatus((prev) => (prev === 'idle' ? 'loading' : prev))

      try {
        const { quotes, errors: fetchErrors } = await fetchLiveQuotes(current, currency)

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
          fetchErrors.length === 0
            ? 'success'
            : priceMap.size > 0
              ? 'partial'
              : 'error'

        if (nextStatus === 'error' && previousStatusRef.current !== 'error') {
          showWarningToast(
            'Live-Kurse nicht verfügbar',
            'Zeige letzte Transaktionspreise.'
          )
        }

        previousStatusRef.current = nextStatus
        setStatus(nextStatus)
      } catch {
        if (previousStatusRef.current !== 'error') {
          showWarningToast(
            'Live-Kurse nicht verfügbar',
            'Zeige letzte Transaktionspreise.'
          )
        }

        previousStatusRef.current = 'error'
        setStatus('error')
      }
    },
    [currency]
  )

  useEffect(() => {
    if (assetsForFetch.length === 0) {
      setStatus('idle')
      return
    }

    let cancelled = false

    const tick = () => {
      if (cancelled || document.visibilityState !== 'visible') return
      runFetch(assetsForFetch)
    }

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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetsKey, currency, runFetch])

  const refresh = useCallback(() => {
    runFetch(assetsForFetch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetsKey, currency, runFetch])

  return {
    livePrices,
    staleTickers,
    status,
    lastUpdatedAt,
    errors,
    refresh,
  }
}
