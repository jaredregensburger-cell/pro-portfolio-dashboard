import type { AssetClass, TimeRange } from '@/types'

// Note: navigation items live in components/layout/Sidebar.tsx, where they're
// paired with actual lucide-react icon components rather than icon name strings.

// ─── Time Ranges ─────────────────────────────────────────────────────────────

export const TIME_RANGES: TimeRange[] = ['1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'ALL']

// ─── Asset Class Metadata ────────────────────────────────────────────────────

export const ASSET_CLASS_META: Record<
  AssetClass,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  stock: {
    label: 'Stocks',
    color: '#3B82F6',
    bgColor: 'rgba(59,130,246,0.12)',
    borderColor: 'rgba(59,130,246,0.3)',
  },
  crypto: {
    label: 'Crypto',
    color: '#F59E0B',
    bgColor: 'rgba(245,158,11,0.12)',
    borderColor: 'rgba(245,158,11,0.3)',
  },
  etf: {
    label: 'ETFs',
    color: '#10B981',
    bgColor: 'rgba(16,185,129,0.12)',
    borderColor: 'rgba(16,185,129,0.3)',
  },
  metal: {
    label: 'Metals',
    color: '#EAB308',
    bgColor: 'rgba(234,179,8,0.12)',
    borderColor: 'rgba(234,179,8,0.3)',
  },
  cash: {
    label: 'Cash',
    color: '#94A3B8',
    bgColor: 'rgba(148,163,184,0.12)',
    borderColor: 'rgba(148,163,184,0.3)',
  },
}

// ─── Asset Class Select Options ──────────────────────────────────────────────

export const ASSET_CLASS_OPTIONS: Array<{ label: string; value: AssetClass }> = [
  { label: 'Stock',   value: 'stock' },
  { label: 'Crypto',  value: 'crypto' },
  { label: 'ETF',     value: 'etf' },
  { label: 'Metal',   value: 'metal' },
  { label: 'Cash',    value: 'cash' },
]

// ─── Chart Colors ─────────────────────────────────────────────────────────────

export const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  gain: '#10B981',
  loss: '#EF4444',
  amber: '#F59E0B',
  grid: '#1E2535',
  axis: '#475569',
  tooltip: '#1C2333',
}

// ─── Currency Options ─────────────────────────────────────────────────────────

export const CURRENCIES = [
  { label: 'US Dollar', value: 'USD', symbol: '$' },
  { label: 'Euro', value: 'EUR', symbol: '€' },
  { label: 'British Pound', value: 'GBP', symbol: '£' },
  { label: 'Swiss Franc', value: 'CHF', symbol: 'Fr' },
  { label: 'Japanese Yen', value: 'JPY', symbol: '¥' },
] as const

// ─── Transaction Type Labels ──────────────────────────────────────────────────

export const TRANSACTION_TYPE_LABELS = {
  buy: 'Buy',
  sell: 'Sell',
  dividend: 'Dividend',
  transfer_in: 'Transfer In',
  transfer_out: 'Transfer Out',
  fee: 'Fee',
} as const

// ─── Pagination ───────────────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20
