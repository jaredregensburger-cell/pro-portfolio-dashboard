/**
 * /features/portfolio/logic.ts
 *
 * ════════════════════════════════════════════════════════════════════════════
 *  THE FINANCIAL CALCULATION ENGINE
 * ════════════════════════════════════════════════════════════════════════════
 *
 * STRICT RULES:
 *   1. NOTHING is ever stored. Every value here is computed on demand from
 *      (assets, transactions) — the same two inputs every time.
 *   2. Every function is PURE: no side effects, no mutation, deterministic.
 *   3. Re-running these functions after any transaction is added, edited,
 *      or removed always produces a correct, consistent result.
 *
 * CORE FORMULAS (mirrors the Supabase trigger logic in supabase/schema.sql):
 *
 *   Position Size       = SUM(buy qty) − SUM(sell qty)         clamped ≥ 0
 *
 *   Weighted Avg Buy    = SUM(buy qty × buy price + buy fee)
 *   Price                 ─────────────────────────────────────
 *                          SUM(buy qty)
 *
 *                        (constant once set — selling does NOT change it,
 *                         exactly like the DB trigger's avg_cost_basis)
 *
 *   Current Value       = Position Size × Current Price
 *                         (Current Price = price of the most recent trade
 *                          — mark-to-market)
 *
 *   Cost Basis          = Position Size × Weighted Avg Buy Price
 *
 *   Unrealized P/L      = Current Value − Cost Basis
 *
 *   Realized P/L        = Σ over sells of
 *                          [(sell price − avg buy price) × sell qty − sell fee]
 *
 *   Total Profit        = Unrealized P/L + Realized P/L
 *
 * ════════════════════════════════════════════════════════════════════════════
 */

import type {
  SimAsset,
  SimTransaction,
  AssetPosition,
  SimAllocationSlice,
} from '@/types/simulation'
import type { TimeRange } from '@/types'

// ════════════════════════════════════════════════════════════════════════════
// 1. PER-ASSET POSITION — the atomic computation everything else builds on
// ════════════════════════════════════════════════════════════════════════════

/**
 * Compute the full position state for one asset from its transaction history.
 * O(n) over that asset's transactions — cheap enough to call on every render.
 *
 * @param livePrices Optional ticker → live market price map. When a price
 *   exists for this asset's ticker, it overrides the mark-to-market price
 *   (which is otherwise the most recent transaction's price). This is the
 *   ONLY way live market data enters the calculation engine — transactions
 *   themselves are never rewritten, so the ledger stays the single source
 *   of truth for everything except the live mark price.
 */
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

    // Mark-to-market: most recent trade price becomes the current price
    currentPrice = t.price
    lastTradeAt = t.executedAt
  }

  // ── Live override: a fresh market quote replaces the last-trade price ──
  // Only applies if the asset actually has a position — a live price for
  // a closed/never-opened position has nothing to mark to market.
  const isInitialSnapshotOnly =
  txns.length === 1 &&
  txns[0]?.type === 'buy' &&
  (
    txns[0]?.note === 'Startbestand' ||
    txns[0]?.note === 'Startbestand beim Asset-Anlegen'
  )

const livePrice = livePrices?.get(asset.ticker)

const isLivePrice =
  livePrice !== undefined &&
  totalBuyQty > 0 &&
  !isInitialSnapshotOnly

if (isLivePrice) {
  currentPrice = livePrice as number
}

  // ── Position Size: SUM(buys) − SUM(sells), never negative ──
  const quantity = Math.max(totalBuyQty - totalSellQty, 0)

  // ── Weighted Average Buy Price: total buy cost / total buy qty ──
  // Stays constant regardless of sells — matches the DB trigger exactly.
  const avgCostBasis = totalBuyQty > 0 ? totalBuyCost / totalBuyQty : 0

  const currentValue = quantity * currentPrice
  const costBasis = quantity * avgCostBasis

  // ── Unrealized P/L: paper gain/loss on the open position ──
  const unrealizedGain = currentValue - costBasis
  const unrealizedGainPct = costBasis > 0 ? (unrealizedGain / costBasis) * 100 : 0

  // ── Realized P/L: locked-in gain/loss from everything sold so far ──
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

// ════════════════════════════════════════════════════════════════════════════
// 2. POSITION SIZE PER ASSET
// ════════════════════════════════════════════════════════════════════════════

/**
 * Current units held for one asset: SUM(buy qty) − SUM(sell qty), clamped ≥ 0.
 */
export function getPositionSize(
  asset: SimAsset,
  transactions: SimTransaction[],
  livePrices?: Map<string, number>
): number {
  return computeAssetPosition(asset, transactions, livePrices).quantity
}

// ════════════════════════════════════════════════════════════════════════════
// 3. WEIGHTED AVERAGE BUY PRICE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Weighted average price paid per unit, across all buy transactions.
 * Unaffected by sells — represents the cost basis of the position.
 */
export function getWeightedAverageBuyPrice(
  asset: SimAsset,
  transactions: SimTransaction[],
  livePrices?: Map<string, number>
): number {
  return computeAssetPosition(asset, transactions, livePrices).avgCostBasis
}

// ════════════════════════════════════════════════════════════════════════════
// 4. TOTAL PORTFOLIO VALUE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Current market value of the entire portfolio:
 * SUM over all assets of (position size × current price).
 */
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

// ════════════════════════════════════════════════════════════════════════════
// 5. UNREALIZED PROFIT / LOSS (portfolio-wide)
// ════════════════════════════════════════════════════════════════════════════

export interface PnL {
  /** Absolute amount in the portfolio's base currency */
  amount: number
  /** Percentage relative to cost basis */
  pct: number
}

/**
 * Portfolio-wide unrealized P/L: total market value vs. total cost basis
 * of everything currently held.
 */
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

// ════════════════════════════════════════════════════════════════════════════
// 6. REALIZED PROFIT / LOSS (portfolio-wide)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Portfolio-wide realized P/L: the sum of locked-in gains/losses from
 * every sell transaction ever made, across all assets.
 *
 * Note: realized P&L is fixed by past sell transactions and is unaffected
 * by live prices, but livePrices is still accepted for a consistent call
 * signature across the engine.
 */
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

// ════════════════════════════════════════════════════════════════════════════
// 7. TOTAL PROFIT (realized + unrealized)
// ════════════════════════════════════════════════════════════════════════════

/**
 * The headline "Total Profit" figure: everything you've made or lost so far,
 * whether it's still on paper (unrealized) or locked in (realized).
 */
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

// ════════════════════════════════════════════════════════════════════════════
// 8. RANKED POSITIONS + BEST / WORST ASSET
// ════════════════════════════════════════════════════════════════════════════

export interface RankedPosition {
  asset: SimAsset
  position: AssetPosition
}

/**
 * All assets paired with their computed position, sorted by current
 * market value (descending). Includes assets with zero position.
 */
export function getRankedPositions(
  assets: SimAsset[],
  transactions: SimTransaction[],
  livePrices?: Map<string, number>
): RankedPosition[] {
  return assets
    .map((asset) => ({ asset, position: computeAssetPosition(asset, transactions, livePrices) }))
    .sort((a, b) => b.position.currentValue - a.position.currentValue)
}

/**
 * The best-performing open position by unrealized gain %.
 * Returns null if no asset currently has an open position. If exactly
 * one open position exists, that one is returned as "best" by default.
 */
export function getBestAsset(
  assets: SimAsset[],
  transactions: SimTransaction[],
  livePrices?: Map<string, number>
): RankedPosition | null {
  const open = getRankedPositions(assets, transactions, livePrices).filter((p) => p.position.hasPosition)
  if (open.length === 0) return null
  if (open.length === 1) return open[0]

  return open.reduce((best, current) =>
    current.position.unrealizedGainPct > best.position.unrealizedGainPct ? current : best
  )
}

/**
 * The worst-performing open position by unrealized gain %.
 * Returns null if fewer than two open positions exist — with only one
 * position there is nothing to contrast it against.
 */
export function getWorstAsset(
  assets: SimAsset[],
  transactions: SimTransaction[],
  livePrices?: Map<string, number>
): RankedPosition | null {
  const open = getRankedPositions(assets, transactions, livePrices).filter((p) => p.position.hasPosition)
  if (open.length < 2) return null

  return open.reduce((worst, current) =>
    current.position.unrealizedGainPct < worst.position.unrealizedGainPct ? current : worst
  )
}

// ════════════════════════════════════════════════════════════════════════════
// 9. ALLOCATION BY ASSET CLASS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Current market value grouped by asset class, as percentages of the
 * total portfolio value. Only includes open positions.
 */
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
    byClass.set(asset.assetClass, (byClass.get(asset.assetClass) ?? 0) + position.currentValue)
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

// ════════════════════════════════════════════════════════════════════════════
// 10. VALIDATION
// ════════════════════════════════════════════════════════════════════════════

/**
 * Check whether a sell of `quantity` units is valid given the current
 * position. Enforces "position size = sum(buys − sells)" — you can never
 * sell more than you hold. Live prices don't affect quantity, but are
 * accepted for a consistent signature.
 */
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

// ════════════════════════════════════════════════════════════════════════════
// 11. PORTFOLIO ANALYTICS — the single aggregate for dashboard cards
// ════════════════════════════════════════════════════════════════════════════

export interface PortfolioAnalytics {
  /** Current market value of everything held */
  totalValue: number
  /** Cost basis of everything currently held */
  totalCost: number
  /** Paper gain/loss on open positions */
  unrealizedPnL: PnL
  /** Locked-in gain/loss from all historical sells */
  realizedPnL: number
  /** unrealizedPnL.amount + realizedPnL */
  totalProfit: number
  /** Sum of all fees paid across every transaction */
  totalFees: number
  /** Best-performing open position by unrealized %, or null */
  bestAsset: RankedPosition | null
  /** Worst-performing open position by unrealized %, or null (needs ≥2) */
  worstAsset: RankedPosition | null
  /** All assets with computed positions, sorted by value desc */
  positions: RankedPosition[]
  /** Only positions with quantity > 0 */
  openPositions: RankedPosition[]
  /** Market value grouped by asset class */
  allocation: SimAllocationSlice[]
  /** Number of assets with an open position */
  positionsCount: number
  /** Total number of asset containers (open or closed) */
  assetsCount: number
}

/**
 * Compute every figure needed to render the dashboard in a single pass.
 * This is the function dashboard components should call — it composes
 * all the smaller pure functions above so the UI never has to.
 *
 * @param livePrices Optional ticker → live price map (see computeAssetPosition).
 *   When omitted, every asset's currentPrice falls back to its last trade price.
 */
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
            current.position.unrealizedGainPct > best.position.unrealizedGainPct ? current : best
          )

  const worstAsset =
    openPositions.length < 2
      ? null
      : openPositions.reduce((worst, current) =>
          current.position.unrealizedGainPct < worst.position.unrealizedGainPct ? current : worst
        )

  return {
    totalValue,
    totalCost,
    unrealizedPnL: { amount: unrealizedAmount, pct: unrealizedPct },
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

// ════════════════════════════════════════════════════════════════════════════
// 12. PORTFOLIO VALUE HISTORY — reconstructed time series
// ════════════════════════════════════════════════════════════════════════════
//
// There is no separate "snapshots" store in the simulation. Instead, the
// value of the portfolio at any past date is reconstructed by re-running
// computeAssetPosition with only the transactions that existed up to that
// date — i.e. mark-to-market using whatever price was known at the time.
// This keeps the "never store computed values" rule intact even for charts.

export interface PortfolioValuePoint {
  /** YYYY-MM-DD */
  date: string
  totalValue: number
  totalCost: number
  gain: number
  gainPct: number
}

/**
 * Reconstruct portfolio value at each date a transaction occurred.
 * Each point reflects mark-to-market value using only transactions
 * executed on or before that date.
 */
export function getPortfolioValueHistory(
  assets: SimAsset[],
  transactions: SimTransaction[]
): PortfolioValuePoint[] {
  if (transactions.length === 0 || assets.length === 0) return []

  const dates = Array.from(new Set(transactions.map((t) => t.executedAt.slice(0, 10)))).sort()

  return dates.map((date) => {
    const cutoff = new Date(`${date}T23:59:59.999Z`).getTime()
    const txnsUpToDate = transactions.filter((t) => new Date(t.executedAt).getTime() <= cutoff)

    let totalValue = 0
    let totalCost = 0
    for (const asset of assets) {
      const position = computeAssetPosition(asset, txnsUpToDate)
      totalValue += position.currentValue
      totalCost += position.costBasis
    }

    const gain = totalValue - totalCost
    const gainPct = totalCost > 0 ? (gain / totalCost) * 100 : 0

    return { date, totalValue, totalCost, gain, gainPct }
  })
}

/**
 * Restrict a value history series to a given time range, anchored to today.
 * 'ALL' returns the series unchanged. If the range would exclude every
 * point, the most recent point is kept so the chart never goes empty.
 */
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
  const filtered = points.filter((p) => new Date(p.date).getTime() >= cutoffTime)

  if (filtered.length === 0) return points.slice(-1)
  if (filtered.length === 1 && points.length > 1) {
    // Include the point just before the cutoff for a meaningful line segment
    const idx = points.indexOf(filtered[0])
    return idx > 0 ? points.slice(idx - 1) : filtered
  }
  return filtered
}

// ════════════════════════════════════════════════════════════════════════════
// 13. PROFIT PER ASSET — for the bar chart
// ════════════════════════════════════════════════════════════════════════════

export interface AssetProfitBreakdown {
  ticker:          string
  name:            string
  assetClass:      SimAsset['assetClass']
  /** Unrealized + realized profit for this single asset */
  totalProfit:     number
  unrealizedGain:  number
  realizedGain:    number
  hasPosition:     boolean
}

/**
 * Profit broken down per asset — unrealized gain on whatever is still held
 * plus realized gain from everything sold, combined into one comparable
 * number per ticker. Sorted by totalProfit descending so the bar chart
 * reads like a leaderboard.
 */
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
    // Only assets with actual trading history are worth charting
    .filter((a) => a.unrealizedGain !== 0 || a.realizedGain !== 0)
    .sort((a, b) => b.totalProfit - a.totalProfit)
}

// ════════════════════════════════════════════════════════════════════════════
// 14. EQUITY CURVE SIMULATION
// ════════════════════════════════════════════════════════════════════════════
//
// The equity curve overlays two series on the same timeline as the value
// history: the actual portfolio value, and a hypothetical "invested capital"
// line — what the account balance would look like if every dollar contributed
// just sat in cash, never invested. The gap between the two lines is the
// running visualization of how much the trading itself has added or removed.
//
// "Invested capital" at a point in time = cumulative net cash put in:
// SUM(buy cost) − SUM(sell proceeds) up to that date. This is intentionally
// simple (no benchmark index, no risk-free rate) — it's a relative baseline
// derived purely from the same transaction ledger, not an external data set.

export interface EquityCurvePoint {
  date:             string
  /** Actual mark-to-market portfolio value */
  equity:           number
  /** Net cash contributed so far (buys minus sells, cumulative) */
  investedCapital:  number
  /** equity − investedCapital: the running value added by trading decisions */
  tradingEdge:      number
}

/**
 * Build the equity curve: portfolio value vs. cumulative net contributions,
 * reconstructed entirely from transaction history at each date a trade
 * occurred. Like getPortfolioValueHistory, nothing here is stored — it's
 * recomputed fresh from (assets, transactions) every time it's called.
 */
export function getEquityCurve(
  assets: SimAsset[],
  transactions: SimTransaction[]
): EquityCurvePoint[] {
  if (transactions.length === 0 || assets.length === 0) return []

  const sortedTxns = [...transactions].sort(
    (a, b) => new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime()
  )
  const dates = Array.from(new Set(sortedTxns.map((t) => t.executedAt.slice(0, 10))))

  let cumulativeInvested = 0

  return dates.map((date) => {
    const cutoff = new Date(`${date}T23:59:59.999Z`).getTime()
    const txnsUpToDate = transactions.filter((t) => new Date(t.executedAt).getTime() <= cutoff)
    const txnsOnThisDate = sortedTxns.filter((t) => t.executedAt.slice(0, 10) === date)

    // Net cash flow for trades executed exactly on this date
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

