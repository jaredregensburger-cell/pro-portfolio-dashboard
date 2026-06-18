/**
 * /services/marketData/symbolMap.ts
 *
 * Maps a portfolio ticker (e.g. "AAPL", "BTC", "XAU") to the identifier each
 * upstream API expects. This is the single place that knows how CoinGecko,
 * Alpha Vantage, and Yahoo Finance each name the same instrument.
 *
 * Adding a new asset only ever requires touching this file — the provider
 * clients and the refresh loop never need ticker-specific logic.
 */

import type { AssetClass } from '@/types'

export type MarketDataProvider = 'coingecko' | 'alphavantage' | 'yahoo'

export interface SymbolMapping {
  /** The ticker as used inside the portfolio (always uppercase) */
  ticker: string
  /** Which provider serves this instrument */
  provider: MarketDataProvider
  /** The identifier to send to that provider's API */
  providerId: string
  /** Asset class this ticker belongs to, for sanity-checking and routing */
  assetClass: AssetClass
}

// ─── Crypto → CoinGecko ────────────────────────────────────────────────────────
// CoinGecko identifies coins by a slug, not the ticker, so this map is required.

const CRYPTO_MAP: Record<string, string> = {
  BTC:  'bitcoin',
  ETH:  'ethereum',
  SOL:  'solana',
  ADA:  'cardano',
  XRP:  'ripple',
  DOGE: 'dogecoin',
  DOT:  'polkadot',
  MATIC: 'matic-network',
  LTC:  'litecoin',
  LINK: 'chainlink',
  AVAX: 'avalanche-2',
  USDT: 'tether',
  USDC: 'usd-coin',
}

// ─── Stocks / ETFs → Alpha Vantage ──────────────────────────────────────────────
// Alpha Vantage mostly uses the plain ticker symbol, but a few need remapping
// (e.g. share classes, exchange suffixes). Anything not listed falls back to
// using the ticker itself as the providerId.

const STOCK_ETF_OVERRIDES: Record<string, string> = {
  // ticker → Alpha Vantage symbol, only needed when they differ
  'BRK.B': 'BRK-B',
}

// ─── Metals → Yahoo Finance ──────────────────────────────────────────────────────
// Yahoo Finance uses futures-style tickers for spot metal proxies.

const METAL_MAP: Record<string, string> = {
  XAU: 'XAUUSD=X', // Gold spot vs USD
  XAG: 'XAGUSD=X', // Silver spot vs USD
  XPT: 'XPTUSD=X', // Platinum spot vs USD
  XPD: 'XPDUSD=X', // Palladium spot vs USD
}

// ─── Resolution ───────────────────────────────────────────────────────────────

/**
 * Resolve a portfolio ticker + asset class into a full provider mapping.
 * Returns null for asset classes that have no live price source (e.g. cash).
 */
export function resolveSymbol(ticker: string, assetClass: AssetClass): SymbolMapping | null {
  const symbol = ticker.trim().toUpperCase()

  switch (assetClass) {
    case 'crypto': {
      const providerId = CRYPTO_MAP[symbol]
      if (!providerId) return null
      return { ticker: symbol, provider: 'coingecko', providerId, assetClass }
    }

    case 'stock':
    case 'etf': {
      const providerId = STOCK_ETF_OVERRIDES[symbol] ?? symbol
      return { ticker: symbol, provider: 'alphavantage', providerId, assetClass }
    }

    case 'metal': {
      const providerId = METAL_MAP[symbol]
      if (!providerId) return null
      return { ticker: symbol, provider: 'yahoo', providerId, assetClass }
    }

    case 'cash':
      // Cash is always worth its face value — no external price needed.
      return null

    default:
      return null
  }
}

/**
 * Group a list of (ticker, assetClass) pairs by provider, so the refresh
 * loop can batch requests per API instead of firing one call per asset.
 */
export function groupByProvider(
  assets: Array<{ ticker: string; assetClass: AssetClass }>
): Record<MarketDataProvider, SymbolMapping[]> {
  const grouped: Record<MarketDataProvider, SymbolMapping[]> = {
    coingecko: [],
    alphavantage: [],
    yahoo: [],
  }

  for (const asset of assets) {
    const mapping = resolveSymbol(asset.ticker, asset.assetClass)
    if (!mapping) continue
    grouped[mapping.provider].push(mapping)
  }

  return grouped
}

/**
 * Whether a ticker has any live price source at all (used to decide
 * if the UI should show a "live" badge vs. relying on last trade price).
 */
export function hasLivePriceSource(ticker: string, assetClass: AssetClass): boolean {
  return resolveSymbol(ticker, assetClass) !== null
}
