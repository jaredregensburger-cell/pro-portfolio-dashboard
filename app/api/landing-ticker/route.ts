import { NextResponse } from 'next/server'

const ASSETS = [
  { ticker: 'BTC', assetClass: 'crypto' },
  { ticker: 'AAPL', assetClass: 'stock' },
  { ticker: 'GOOGL', assetClass: 'stock' },
  { ticker: 'MSFT', assetClass: 'stock' },
  { ticker: 'NVDA', assetClass: 'stock' },
  { ticker: 'TSLA', assetClass: 'stock' },
]

export async function GET() {
  try {
    const results = await Promise.all(
      ASSETS.map(async (asset) => {
        const base =
          process.env.NODE_ENV === 'development'
            ? 'http://localhost:3000'
            : process.env.NEXT_PUBLIC_APP_URL

        const response = await fetch(
          `${base}/api/market-price?ticker=${asset.ticker}&assetClass=${asset.assetClass}&currency=EUR`,
          { cache: 'no-store' }
        )

        if (!response.ok) return null

        const data = await response.json()

        return {
          symbol: asset.ticker,
          price: data.price,
        }
      })
    )

    return NextResponse.json(results.filter(Boolean))
  } catch {
    return NextResponse.json([])
  }
}
