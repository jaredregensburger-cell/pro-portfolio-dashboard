import type { AssetClass } from './index'

// ─── Core Simulation Types ───────────────────────────────────────────────────
//
// LOGIC RULE: Assets are ONLY containers. They hold identity (ticker, name,
// class, currency) — never quantity, cost basis, or value. ALL of that is
// derived from the transaction ledger via computeAssetPosition().

export type SimTransactionType = 'buy' | 'sell'

export interface SimPortfolio {
  id:          string
  name:        string
  /** Emoji or short label shown in the switcher */
  icon:        string
  currency:    string
  createdAt:   string
}

export interface SimAsset {
  id:          string
  /** Which portfolio this asset belongs to */
  portfolioId: string
  ticker:      string
  name:        string
  assetClass:  AssetClass
  currency:    string
  addedAt:     string
}

export interface SimTransaction {
  id:          string
  assetId:     string
  type:        SimTransactionType
  quantity:    number
  price:       number
  fee:         number
  executedAt:  string
  note?:       string
  createdAt:   string
}

// ─── Watchlist ────────────────────────────────────────────────────────────────
// Watchlist items track a ticker the user is monitoring but does not (yet)
// hold. They carry no position data — only identity + live price, mirroring
// the "assets are containers" rule but without any transaction backing.

export interface WatchlistItem {
  id:          string
  ticker:      string
  name:        string
  assetClass:  AssetClass
  addedAt:     string
}

// ─── Onboarding / Investor Profile ───────────────────────────────────────────

export type InvestorType = 'conservative' | 'balanced' | 'growth' | 'aggressive'

export interface InvestorProfile {
  investorType:    InvestorType
  primaryGoal:     string
  experienceLevel: 'beginner' | 'intermediate' | 'experienced'
  completedAt:     string
}

// ─── Computed Position ────────────────────────────────────────────────────────
// Never stored — always derived fresh from (asset, transactions[])

export interface AssetPosition {
  /** Current units held: SUM(buy qty) - SUM(sell qty), clamped to >= 0 */
  quantity:           number
  /** Weighted average cost per unit across all buys (constant regardless of sells) */
  avgCostBasis:       number
  /** Last traded price (mark-to-market) */
  currentPrice:       number
  /** quantity * currentPrice */
  currentValue:       number
  /** quantity * avgCostBasis */
  costBasis:          number
  /** currentValue - costBasis */
  unrealizedGain:     number
  /** unrealizedGain / costBasis * 100 */
  unrealizedGainPct:  number
  /** Realized P&L from all sell transactions vs. avg cost at time of sale */
  realizedGain:       number
  /** Total fees paid across all transactions for this asset */
  totalFees:          number
  /** Number of transactions recorded for this asset */
  transactionCount:   number
  /** Timestamp of the most recent transaction, or null if none */
  lastTradeAt:        string | null
  /** True if quantity > 0 */
  hasPosition:        boolean
  /** True if currentPrice came from a live market quote rather than the last trade */
  isLivePrice:        boolean
}

// ─── Aggregates ────────────────────────────────────────────────────────────────

export interface SimPortfolioSummary {
  totalValue:         number
  totalCost:          number
  unrealizedGain:     number
  unrealizedGainPct:  number
  realizedGain:       number
  totalFees:          number
  positionsCount:     number
  assetsCount:        number
}

export interface SimAllocationSlice {
  assetClass: AssetClass
  value:      number
  pct:        number
}
