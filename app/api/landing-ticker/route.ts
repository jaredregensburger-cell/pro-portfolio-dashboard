import { NextResponse } from 'next/server'

const TWELVE_BASE_URL = 'https://api.twelvedata.com'

const LANDING_ASSETS = [
  { symbol: 'BTC/EUR', label: 'BTC', currency: 'EUR' },
  { symbol: 'ETH/EUR', label: 'ETH', currency: 'EUR' },
  { symbol: 'AAPL', label: 'AAPL', currency: 'USD' },
  { symbol: 'GOOGL', label: 'GOOGL', currency: 'USD' },
  { symbol: 'MSFT', label: 'MSFT', currency: 'USD' },
  { symbol: 'NVDA', label: 'NVDA', currency: 'USD' },
  { symbol: 'TSLA', label: 'TSLA', currency: 'USD' },
  { symbol: 'AMZN', label: 'AMZN', currency: 'USD' },
  { symbol: 'META', label: 'META', currency: 'USD' },
  { symbol: 'AVGO', label: 'AVGO', currency: 'USD' },
]

async function fetchOne(symbol: string, apiKey: string) {
  const url = new URL('/quote', TWELVE_BASE_URL)
  url.searchParams.set('symbol', symbol)
  url.searchParams.set('apikey', apiKey)

  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) return null

  const data = await res.json()
  if (data.status === 'error') return null

  const price = Number(data.close ?? data.price ?? data.previous_close)
  const changePct = Number(data.percent_change ?? 0)

  if (!Number.isFinite(price) || price <= 0) return null

  return {
    price,
    changePct: Number.isFinite(changePct) ? changePct : 0,
    currency: String(data.currency ?? '').toUpperCase(),
  }
}

export async function GET() {
  const apiKey = process.env.TWELVE_DATA_API_KEY

  if (!apiKey) {
    return NextResponse.json({
      items: [],
      error: 'TWELVE_DATA_API_KEY fehlt',
    })
  }

  const results = await Promise.all(
    LANDING_ASSETS.map(async (asset) => {
      const quote = await fetchOne(asset.symbol, apiKey)
      if (!quote) return null

      return {
        symbol: asset.label,
        price: quote.price,
        changePct: quote.changePct,
        currency: quote.currency || asset.currency,
      }
    })
  )

  return NextResponse.json({
    items: results.filter(Boolean),
    updatedAt: new Date().toISOString(),
  })
}
