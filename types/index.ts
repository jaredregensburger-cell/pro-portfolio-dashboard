// ─── Asset Types ────────────────────────────────────────────────────────────

export type AssetClass = 'crypto' | 'stock' | 'etf' | 'metal' | 'cash'

export type AssetStatus = 'active' | 'closed' | 'pending'

export interface Asset {
  id: string
  ticker: string
  name: string
  assetClass: AssetClass
  quantity: number
  avgCostBasis: number
  currentPrice: number
  currency: string
  logoUrl?: string
  status: AssetStatus
  addedAt: string
  updatedAt: string
}

// ─── Portfolio Types ─────────────────────────────────────────────────────────

export interface PortfolioSummary {
  totalValue: number
  totalCost: number
  totalGain: number
  totalGainPct: number
  dayChange: number
  dayChangePct: number
  currency: string
}

export interface PortfolioSnapshot {
  date: string
  value: number
}

export interface Portfolio {
  id: string
  name: string
  description?: string
  currency: string
  assets: Asset[]
  summary: PortfolioSummary
  snapshots: PortfolioSnapshot[]
  createdAt: string
  updatedAt: string
}

export interface AllocationSlice {
  label: string
  value: number
  pct: number
  color: string
  assetClass: AssetClass
}

// ─── Transaction Types ───────────────────────────────────────────────────────

export type TransactionType = 'buy' | 'sell' | 'dividend' | 'transfer_in' | 'transfer_out' | 'fee'

export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'cancelled'

export interface Transaction {
  id: string
  portfolioId: string
  assetId?: string
  ticker?: string
  assetName?: string
  type: TransactionType
  status: TransactionStatus
  quantity?: number
  price?: number
  amount: number
  fee?: number
  currency: string
  note?: string
  executedAt: string
  createdAt: string
}

// ─── User / Auth Types ───────────────────────────────────────────────────────

export type UserRole = 'admin' | 'viewer' | 'editor'

export interface UserProfile {
  id: string
  email: string
  displayName: string
  avatarUrl?: string
  role: UserRole
  currency: string
  timezone: string
  createdAt: string
}

// ─── UI / Utility Types ──────────────────────────────────────────────────────

export type TimeRange = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'ALL'

export type SortDirection = 'asc' | 'desc'

export type Status = 'idle' | 'loading' | 'success' | 'error'

export interface ApiError {
  code: string
  message: string
  details?: unknown
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface SelectOption<T = string> {
  label: string
  value: T
  disabled?: boolean
}
