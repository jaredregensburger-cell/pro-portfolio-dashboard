import { NextRequest, NextResponse } from 'next/server'
import type { AssetClass } from '@/types'

const TWELVE_BASE_URL = 'https://api.twelvedata.com'

const METALS = [
  { symbol: 'XAU', name: 'Gold', type: 'metal' as AssetClass, currency: 'USD' },
  { symbol: 'XAG', name: 'Silver', type: 'metal' as AssetClass, currency: 'USD' },
  { symbol: 'XPT', name: 'Platinum', type: 'metal' as AssetClass, currency: 'USD' },
  { symbol: 'XPD', name: 'Palladium', type: 'metal' as AssetClass, currency: 'USD' },
]

function normalizeSymbol(symbol: string, assetClass: AssetClass) {
  if (assetClass === 'crypto' || assetClass === 'metal') {
    return symbol.split('/')[0]
  }

  return symbol
}

function mapInstrumentType(type?: string): AssetClass {
  const value = String(type ?? '').toLowerCase()

  if (value.includes('etf')) return 'etf'
  if (value.includes('crypto') || value.includes('digital')) return 'crypto'
  if (value.includes('commodity') || value.includes('metal')) return 'metal'

  return 'stock'
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.TWELVE_DATA_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'TWELVE_DATA_API_KEY is missing' },
      { status: 500 }
    )
  }

  const query = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  const type = request.nextUrl.searchParams.get('type') as AssetClass | null

  if (query.length < 2) {
    return NextResponse.json({ assets: [] })
  }

  if (type === 'metal') {
    const q = query.toLowerCase()

    const assets = METALS.filter(
      (m) =>
        m.symbol.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q)
    ).map((m) => ({
      id: `metal-${m.symbol.toLowerCase()}`,
      symbol: m.symbol,
      name: m.name,
      type: m.type,
      currency: m.currency,
    }))

    return NextResponse.json({ assets })
  }

  const url = new URL('/symbol_search', TWELVE_BASE_URL)
  url.searchParams.set('symbol', query)
  url.searchParams.set('apikey', apiKey)

  const response = await fetch(url.toString(), {
    cache: 'no-store',
  })

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Twelve Data search failed' },
      { status: 502 }
    )
  }

  const json = await response.json()

  const rawItems = Array.isArray(json.data) ? json.data : []

  const assets = rawItems
    .map((item: any) => {
      const assetClass = mapInstrumentType(item.instrument_type)

      return {
        id: `${assetClass}-${String(item.symbol).toLowerCase()}`,
        symbol: normalizeSymbol(String(item.symbol ?? ''), assetClass),
        name: String(item.instrument_name ?? item.name ?? item.symbol ?? ''),
        type: assetClass,
        currency: String(item.currency ?? 'USD'),
      }
    })
    .filter((asset: any) => asset.symbol && asset.name)
    .filter((asset: any) => (type ? asset.type === type : true))
    .slice(0, 30)

  return NextResponse.json({ assets })
}
