/**
 * /features/portfolio/logic.ts
 */

import type {
  SimAsset,
  SimTransaction,
  AssetPosition,
  SimAllocationSlice,
} from '@/types/simulation'
import type { TimeRange } from '@/types'

export function computeAssetPosition(
  asset: SimAsset,
  allTransactions: SimTransaction[],
  livePrices?: Map<string, number>
): AssetPosition {
  const txns = allTransactions
    .filter((t) => t.assetId === asset.id)
    .sort((a, b) => new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime())

  let totalBuyQty = 0
  let totalBuyCost = 0
  let totalSellQty = 0
  let totalSellProceeds = 0
  let totalFees = 0
  let currentPrice = 0
  let lastTradeAt: string | null = null

  for (const t of txns) {
    totalFees += t.fee

    if (t.type === 'buy') {
      totalBuyQty += t.quantity
      totalBuyCost += t.quantity * t.price + t.fee
    } else {
      totalSellQty += t.quantity
      totalSellProceeds += t.quantity * t.price - t.fee
    }

    currentPrice = t.price
    lastTradeAt = t.executedAt
  }

  const quantity = Math.max(totalBuyQty - totalSellQty, 0)

  const isInitialSnapshotOnly =
    txns.length === 1 &&
    txns[0]?.type === 'buy' &&
    (
      txns[0]?.note === 'START_SNAPSHOT' ||
      txns[0]?.note === 'Startbestand' ||
      txns[0]?.note === 'Startbestand beim Asset-Anlegen'
    )

  const livePrice = livePrices?.get(asset.ticker)

  const isLivePrice =
    livePrice !== undefined &&
    totalBuyQty > 0 &&
    quantity > 0 &&
    !isInitialSnapshotOnly

  if (isLivePrice) {
    currentPrice = livePrice
  }

  const avgCostBasis = totalBuyQty > 0 ? totalBuyCost / totalBuyQty : 0
  const currentValue = quantity * currentPrice
  const costBasis = quantity * avgCostBasis

  const unrealizedGain = currentValue - costBasis
  const unrealizedGainPct = costBasis > 0 ? (unrealizedGain / costBasis) * 100 : 0

  const realizedGain = totalSellProceeds - totalSellQty * avgCostBasis

  return {
    quantity,
    avgCostBasis,
    currentPrice,
    currentValue,
    costBasis,
    unrealizedGain,
    unrealizedGainPct,
    realizedGain,
    totalFees,
    transactionCount: txns.length,
    lastTradeAt,
    hasPosition: quantity > 0,
    isLivePrice,
  }
}

export function getPositionSize(
  asset: SimAsset,
  transactions: SimTransaction[],
  livePrices?: Map<string, number>
): number {
  return computeAssetPosition(asset, transactions, livePrices).quantity
}

export function getWeightedAverageBuyPrice(
  asset: SimAsset,
  transactions: SimTransaction[],
  livePrices?: Map<string, number>
): number {
  return computeAssetPosition(asset, transactions, livePrices).avgCostBasis
}

export function getTotalPortfolioValue(
  assets: SimAsset[],
  transactions: SimTransaction[],
  livePrices?: Map<string, number>
): number {
  return assets.reduce(
    (sum, asset) => sum + computeAssetPosition(asset, transactions, livePrices).currentValue,
    0
  )
}

export interface PnL {
  amount: number
  pct: number
}

export function getUnrealizedPnL(
  assets: SimAsset[],
  transactions: SimTransaction[],
  livePrices?: Map<string, number>
): PnL {
  let totalValue = 0
  let totalCost = 0

  for (const asset of assets) {
    const position = computeAssetPosition(asset, transactions, livePrices)
    totalValue += position.currentValue
    totalCost += position.costBasis
  }

  const amount = totalValue - totalCost
  const pct = totalCost > 0 ? (amount / totalCost) * 100 : 0

  return { amount, pct }
}

export function getRealizedPnL(
  assets: SimAsset[],
  transactions: SimTransaction[],
  livePrices?: Map<string, number>
): number {
  return assets.reduce(
    (sum, asset) => sum + computeAssetPosition(asset, transactions, livePrices).realizedGain,
    0
  )
}

export function getTotalProfit(
  assets: SimAsset[],
  transactions: SimTransaction[],
  livePrices?: Map<string, number>
): number {
  return (
    getUnrealizedPnL(assets, transactions, livePrices).amount +
    getRealizedPnL(assets, transactions, livePrices)
  )
}

export interface RankedPosition {
  asset: SimAsset
  position: AssetPosition
}

export function getRankedPositions(
  assets: SimAsset[],
  transactions: SimTransaction[],
  livePrices?: Map<string, number>
): RankedPosition[] {
  return assets
    .map((asset) => ({
      asset,
      position: computeAssetPosition(asset, transactions, livePrices),
    }))
    .sort((a, b) => b.position.currentValue - a.position.currentValue)
}

export function getBestAsset(
  assets: SimAsset[],
  transactions: SimTransaction[],
  livePrices?: Map<string, number>
): RankedPosition | null {
  const open = getRankedPositions(assets, transactions, livePrices).filter(
    (p) => p.position.hasPosition
  )

  if (open.length === 0) return null
  if (open.length === 1) return open[0]

  return open.reduce((best, current) =>
    current.position.unrealizedGainPct > best.position.unrealizedGainPct
      ? current
      : best
  )
}

export function getWorstAsset(
  assets: SimAsset[],
  transactions: SimTransaction[],
  livePrices?: Map<string, number>
): RankedPosition | null {
  const open = getRankedPositions(assets, transactions, livePrices).filter(
    (p) => p.position.hasPosition
  )

  if (open.length < 2) return null

  return open.reduce((worst, current) =>
    current.position.unrealizedGainPct < worst.position.unrealizedGainPct
      ? current
      : worst
  )
}

export function getAllocation(
  assets: SimAsset[],
  transactions: SimTransaction[],
  livePrices?: Map<string, number>
): SimAllocationSlice[] {
  const byClass = new Map<string, number>()
  let totalValue = 0

  for (const asset of assets) {
    const position = computeAssetPosition(asset, transactions, livePrices)
    if (!position.hasPosition) continue

    byClass.set(
      asset.assetClass,
      (byClass.get(asset.assetClass) ?? 0) + position.currentValue
    )

    totalValue += position.currentValue
  }

  return Array.from(byClass.entries())
    .map(([assetClass, value]) => ({
      assetClass: assetClass as SimAllocationSlice['assetClass'],
      value,
      pct: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)
}

export function validateSell(
  asset: SimAsset,
  transactions: SimTransaction[],
  quantity: number,
  livePrices?: Map<string, number>
): { valid: boolean; available: number } {
  const position = computeAssetPosition(asset, transactions, livePrices)

  return {
    valid: quantity > 0 && quantity <= position.quantity,
    available: position.quantity,
  }
}

export interface PortfolioAnalytics {
  totalValue: number
  totalCost: number
  unrealizedPnL: PnL
  realizedPnL: number
  totalProfit: number
  totalFees: number
  bestAsset: RankedPosition | null
  worstAsset: RankedPosition | null
  positions: RankedPosition[]
  openPositions: RankedPosition[]
  allocation: SimAllocationSlice[]
  positionsCount: number
  assetsCount: number
}

export function getPortfolioAnalytics(
  assets: SimAsset[],
  transactions: SimTransaction[],
  livePrices?: Map<string, number>
): PortfolioAnalytics {
  const positions = getRankedPositions(assets, transactions, livePrices)
  const openPositions = positions.filter((p) => p.position.hasPosition)

  let totalValue = 0
  let totalCost = 0
  let realizedPnL = 0
  let totalFees = 0

  for (const { position } of positions) {
    totalValue += position.currentValue
    totalCost += position.costBasis
    realizedPnL += position.realizedGain
    totalFees += position.totalFees
  }

  const unrealizedAmount = totalValue - totalCost
  const unrealizedPct = totalCost > 0 ? (unrealizedAmount / totalCost) * 100 : 0

  const bestAsset =
    openPositions.length === 0
      ? null
      : openPositions.length === 1
        ? openPositions[0]
        : openPositions.reduce((best, current) =>
            current.position.unrealizedGainPct > best.position.unrealizedGainPct
              ? current
              : best
          )

  const worstAsset =
    openPositions.length < 2
      ? null
      : openPositions.reduce((worst, current) =>
          current.position.unrealizedGainPct < worst.position.unrealizedGainPct
            ? current
            : worst
        )

  return {
    totalValue,
    totalCost,
    unrealizedPnL: {
      amount: unrealizedAmount,
      pct: unrealizedPct,
    },
    realizedPnL,
    totalProfit: unrealizedAmount + realizedPnL,
    totalFees,
    bestAsset,
    worstAsset,
    positions,
    openPositions,
    allocation: getAllocation(assets, transactions, livePrices),
    positionsCount: openPositions.length,
    assetsCount: assets.length,
  }
}

export interface PortfolioValuePoint {
  date: string
  totalValue: number
  totalCost: number
  gain: number
  gainPct: number
}

export function getPortfolioValueHistory(
  assets: SimAsset[],
  transactions: SimTransaction[]
): PortfolioValuePoint[] {
  if (transactions.length === 0 || assets.length === 0) return []

  const dates = Array.from(
    new Set(transactions.map((t) => t.executedAt.slice(0, 10)))
  ).sort()

  return dates.map((date) => {
    const cutoff = new Date(`${date}T23:59:59.999Z`).getTime()
    const txnsUpToDate = transactions.filter(
      (t) => new Date(t.executedAt).getTime() <= cutoff
    )

    let totalValue = 0
    let totalCost = 0

    for (const asset of assets) {
      const position = computeAssetPosition(asset, txnsUpToDate)
      totalValue += position.currentValue
      totalCost += position.costBasis
    }

    const gain = totalValue - totalCost
    const gainPct = totalCost > 0 ? (gain / totalCost) * 100 : 0

    return {
      date,
      totalValue,
      totalCost,
      gain,
      gainPct,
    }
  })
}

export function filterValueHistoryByRange(
  points: PortfolioValuePoint[],
  range: TimeRange
): PortfolioValuePoint[] {
  if (range === 'ALL' || points.length === 0) return points

  const now = new Date()
  const cutoff = new Date(now)

  switch (range) {
    case '1D':
      cutoff.setDate(cutoff.getDate() - 1)
      break
    case '1W':
      cutoff.setDate(cutoff.getDate() - 7)
      break
    case '1M':
      cutoff.setMonth(cutoff.getMonth() - 1)
      break
    case '3M':
      cutoff.setMonth(cutoff.getMonth() - 3)
      break
    case '6M':
      cutoff.setMonth(cutoff.getMonth() - 6)
      break
    case '1Y':
      cutoff.setFullYear(cutoff.getFullYear() - 1)
      break
    case 'YTD':
      cutoff.setMonth(0, 1)
      break
  }

  const cutoffTime = cutoff.getTime()
  const filtered = points.filter(
    (p) => new Date(p.date).getTime() >= cutoffTime
  )

  if (filtered.length === 0) return points.slice(-1)

  if (filtered.length === 1 && points.length > 1) {
    const idx = points.indexOf(filtered[0])
    return idx > 0 ? points.slice(idx - 1) : filtered
  }

  return filtered
}

export interface AssetProfitBreakdown {
  ticker: string
  name: string
  assetClass: SimAsset['assetClass']
  totalProfit: number
  unrealizedGain: number
  realizedGain: number
  hasPosition: boolean
}

export function getProfitPerAsset(
  assets: SimAsset[],
  transactions: SimTransaction[],
  livePrices?: Map<string, number>
): AssetProfitBreakdown[] {
  return assets
    .map((asset) => {
      const position = computeAssetPosition(asset, transactions, livePrices)

      return {
        ticker: asset.ticker,
        name: asset.name,
        assetClass: asset.assetClass,
        totalProfit: position.unrealizedGain + position.realizedGain,
        unrealizedGain: position.unrealizedGain,
        realizedGain: position.realizedGain,
        hasPosition: position.hasPosition,
      }
    })
    .filter((a) => a.unrealizedGain !== 0 || a.realizedGain !== 0)
    .sort((a, b) => b.totalProfit - a.totalProfit)
}

export interface EquityCurvePoint {
  date: string
  equity: number
  investedCapital: number
  tradingEdge: number
}

export function getEquityCurve(
  assets: SimAsset[],
  transactions: SimTransaction[]
): EquityCurvePoint[] {
  if (transactions.length === 0 || assets.length === 0) return []

  const sortedTxns = [...transactions].sort(
    (a, b) => new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime()
  )

  const dates = Array.from(
    new Set(sortedTxns.map((t) => t.executedAt.slice(0, 10)))
  )

  let cumulativeInvested = 0

  return dates.map((date) => {
    const cutoff = new Date(`${date}T23:59:59.999Z`).getTime()

    const txnsUpToDate = transactions.filter(
      (t) => new Date(t.executedAt).getTime() <= cutoff
    )

    const txnsOnThisDate = sortedTxns.filter(
      (t) => t.executedAt.slice(0, 10) === date
    )

    for (const t of txnsOnThisDate) {
      if (t.type === 'buy') {
        cumulativeInvested += t.quantity * t.price + t.fee
      } else {
        cumulativeInvested -= t.quantity * t.price - t.fee
      }
    }

    let equity = 0

    for (const asset of assets) {
      equity += computeAssetPosition(asset, txnsUpToDate).currentValue
    }

    return {
      date,
      equity,
      investedCapital: Math.max(cumulativeInvested, 0),
      tradingEdge: equity - Math.max(cumulativeInvested, 0),
    }
  })
}
