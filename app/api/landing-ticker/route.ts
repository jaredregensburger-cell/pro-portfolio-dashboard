import { NextResponse } from 'next/server'

const TWELVE_BASE_URL = 'https://api.twelvedata.com'

const LANDING_ASSETS = [
  { symbol: 'BTC/EUR', label: 'BTC' },
  { symbol: 'AAPL', label: 'AAPL' },
  { symbol: 'GOOGL', label: 'GOOGL' },
  { symbol: 'MSFT', label: 'MSFT' },
  { symbol: 'NVDA', label: 'NVDA' },
  { symbol: 'TSLA', label: 'TSLA' },
]

async function fetchQuote(symbol: string, apiKey: string) {
  const url = new URL('/quote', TWELVE_BASE_URL)
  url.searchParams.set('symbol', symbol)
  url.searchParams.set('apikey', apiKey)

  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) return null

  const data = await res.json()
  if (data.status === 'error') return null

  const price = Number(data.close ?? data.price ?? data.previous_close)
  const changePct = Number(data.percent_change ?? 0)

  if (!Number.isFinite(price)) return null

  return {
    price,
    changePct,
    currency: String(data.currency ?? (symbol.includes('/EUR') ? 'EUR' : 'USD')),
  }
}

export async function GET() {
  const apiKey = process.env.TWELVE_DATA_API_KEY

  if (!apiKey) {
    return NextResponse.json({ items: [] })
  }

  const items = await Promise.all(
    LANDING_ASSETS.map(async (asset) => {
      const quote = await fetchQuote(asset.symbol, apiKey)
      if (!quote) return null

      return {
        symbol: asset.label,
        price: quote.price,
        changePct: quote.changePct,
        currency: quote.currency,
      }
    })
  )

  return NextResponse.json({
    items: items.filter(Boolean),
    updatedAt: new Date().toISOString(),
  })
}
