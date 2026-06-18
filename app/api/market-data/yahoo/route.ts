/**
 * /app/api/market-data/yahoo/route.ts
 *
 * Server-side proxy for Yahoo Finance's unofficial quote endpoint.
 * Browsers can't call query1.finance.yahoo.com directly (CORS), and
 * routing it through our own server also means the upstream URL never
 * needs to be exposed to client code.
 *
 * GET /api/market-data/yahoo?symbols=XAUUSD=X,XAGUSD=X
 */

import { NextRequest, NextResponse } from 'next/server'

const YAHOO_QUOTE_URL = 'https://query1.finance.yahoo.com/v7/finance/quote'

export async function GET(request: NextRequest) {
  const symbols = request.nextUrl.searchParams.get('symbols')

  if (!symbols) {
    return NextResponse.json({ error: 'Missing required "symbols" query param' }, { status: 400 })
  }

  try {
    const upstreamUrl = `${YAHOO_QUOTE_URL}?symbols=${encodeURIComponent(symbols)}`

    const res = await fetch(upstreamUrl, {
      headers: {
        // Yahoo's unofficial endpoint rejects requests with no UA
        'User-Agent': 'Mozilla/5.0 (compatible; FolioPortfolioApp/1.0)',
        Accept: 'application/json',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Yahoo Finance upstream error: ${res.status}` },
        { status: 502 }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown proxy error' },
      { status: 500 }
    )
  }
}
