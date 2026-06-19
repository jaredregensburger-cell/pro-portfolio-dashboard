import { NextResponse } from 'next/server'

const TWELVE_BASE_URL = 'https://api.twelvedata.com'

const LANDING_ASSETS = [
  { symbol: 'BTC/EUR', label: 'BTC' },
  { symbol: 'ETH/EUR', label: 'ETH' },
  { symbol: 'AAPL', label: 'AAPL' },
  { symbol: 'GOOGL', label: 'GOOGL' },
  { symbol: 'MSFT', label: 'MSFT' },
  { symbol: 'NVDA', label: 'NVDA' },
  { symbol: 'TSLA', label: 'TSLA' },
  { symbol: 'AMZN', label: 'AMZN' },
  { symbol: 'META', label: 'META' },
  { symbol: 'AVGO', label: 'AVGO' },
]

function parseQuote(data: any, fallbackCurrency: string) {
  const price = Number(data.close ?? data.price ?? data.previous_close)
  const changePct = Number(data.percent_change ?? 0)

  if (!Number.isFinite(price) || price <= 0) return null

  return {
    price,
    changePct: Number.isFinite(changePct) ? changePct : 0,
    currency: String(data.currency ?? fallbackCurrency).toUpperCase(),
  }
}

export async function GET() {
  const apiKey = process.env.TWELVE_DATA_API_KEY

  if (!apiKey) {
    return NextResponse.json({ items: [] })
  }

  const url = new URL('/quote', TWELVE_BASE_URL)
  url.searchParams.set('symbol', LANDING_ASSETS.map((a) => a.symbol).join(','))
  url.searchParams.set('apikey', apiKey)

  try {
    const res = await fetch(url.toString(), { cache: 'no-store' })

    if (!res.ok) {
      return NextResponse.json({ items: [] })
    }

    const data = await res.json()

    const items = LANDING_ASSETS.map((asset) => {
      const raw = data[asset.symbol] ?? data[asset.label] ?? null
      if (!raw || raw.status === 'error') return null

      const fallbackCurrency = asset.symbol.includes('/EUR') ? 'EUR' : 'USD'
      const quote = parseQuote(raw, fallbackCurrency)

      if (!quote) return null

      return {
        symbol: asset.label,
        price: quote.price,
        changePct: quote.changePct,
        currency: quote.currency,
      }
    }).filter(Boolean)

    return NextResponse.json({
      items,
      updatedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ items: [] })
  }
}
