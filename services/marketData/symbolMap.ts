import type { AssetClass } from '@/types'

export type MarketDataProvider = 'twelve-data'

export interface SymbolMapping {
  ticker: string
  provider: MarketDataProvider
  providerId: string
  assetClass: AssetClass
}

export function resolveSymbol(
  ticker: string,
  assetClass: AssetClass
): SymbolMapping | null {
  const symbol = ticker.trim().toUpperCase()

  if (!symbol) return null
  if (assetClass === 'cash') return null

  return {
    ticker: symbol,
    provider: 'twelve-data',
    providerId: symbol,
    assetClass,
  }
}

export function groupByProvider(
  assets: Array<{ ticker: string; assetClass: AssetClass }>
): Record<MarketDataProvider, SymbolMapping[]> {
  const grouped: Record<MarketDataProvider, SymbolMapping[]> = {
    'twelve-data': [],
  }

  for (const asset of assets) {
    const mapping = resolveSymbol(asset.ticker, asset.assetClass)
    if (!mapping) continue
    grouped['twelve-data'].push(mapping)
  }

  return grouped
}

export function hasLivePriceSource(
  ticker: string,
  assetClass: AssetClass
): boolean {
  return resolveSymbol(ticker, assetClass) !== null
}
