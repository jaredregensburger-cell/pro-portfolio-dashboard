import { NextRequest, NextResponse } from 'next/server'
import type { AssetClass } from '@/types'

const TWELVE_BASE_URL = 'https://api.twelvedata.com'

function toProviderSymbol(ticker: string, assetClass: AssetClass, targetCurrency: string) {
  const clean = ticker.trim().toUpperCase()

  if (assetClass === 'crypto') {
    return clean.includes('/') ? clean : `${clean}/${targetCurrency}`
  }

  if (assetClass === 'metal') {
    if (clean.includes('/')) return clean
    return `${clean}/${targetCurrency}`
  }

  return clean
}

async function fetchQuote(symbol: string, apiKey: string) {
  const url = new URL('/quote', TWELVE_BASE_URL)
  url.searchParams.set('symbol', symbol)
  url.searchParams.set('apikey', apiKey)

  const response = await fetch(url.toString(), {
    cache: 'no-store',
  })

  if (!response.ok) return null

  const json = await response.json()

  if (json.status === 'error' || json.code || json.message?.includes('not found')) {
    return null
  }

  const price = Number(json.close ?? json.price ?? json.previous_close)
  const currency = String(json.currency ?? '').toUpperCase()

  if (!Number.isFinite(price) || price <= 0) return null

  return {
    price,
    currency,
  }
}

async function fetchFxRate(from: string, to: string, apiKey: string) {
  if (!from || !to || from === to) return 1

  const url = new URL('/exchange_rate', TWELVE_BASE_URL)
  url.searchParams.set('symbol', `${from}/${to}`)
  url.searchParams.set('apikey', apiKey)

  const response = await fetch(url.toString(), {
    cache: 'no-store',
  })

  if (!response.ok) return 1

  const json = await response.json()
  const rate = Number(json.rate)

  return Number.isFinite(rate) && rate > 0 ? rate : 1
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.TWELVE_DATA_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'TWELVE_DATA_API_KEY is missing' },
      { status: 500 }
    )
  }

  const ticker = request.nextUrl.searchParams.get('ticker')?.trim()
  const assetClass = request.nextUrl.searchParams.get('assetClass') as AssetClass | null
  const targetCurrency = request.nextUrl.searchParams.get('currency')?.trim().toUpperCase() || 'USD'

  if (!ticker || !assetClass) {
    return NextResponse.json(
      { error: 'Missing ticker or assetClass' },
      { status: 400 }
    )
  }

  let providerSymbol = toProviderSymbol(ticker, assetClass, targetCurrency)
  let quote = await fetchQuote(providerSymbol, apiKey)

  if (!quote && (assetClass === 'crypto' || assetClass === 'metal')) {
    providerSymbol = toProviderSymbol(ticker, assetClass, 'USD')
    quote = await fetchQuote(providerSymbol, apiKey)
  }

  if (!quote) {
    return NextResponse.json(
      { error: `No quote found for ${ticker}` },
      { status: 404 }
    )
  }

  const sourceCurrency = quote.currency || (
    providerSymbol.includes('/')
      ? providerSymbol.split('/')[1]
      : targetCurrency
  )

  const fxRate = await fetchFxRate(sourceCurrency, targetCurrency, apiKey)

  return NextResponse.json({
    ticker: ticker.toUpperCase(),
    providerSymbol,
    assetClass,
    price: quote.price * fxRate,
    sourceCurrency,
    targetCurrency,
    fxRate,
    source: 'twelve-data',
  })
}
