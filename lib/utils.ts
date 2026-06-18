import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Currency Conversion ──────────────────────────────────────────────────────
// Base currency in the app is USD.
// These are fixed approximate rates.
// Example: 72 USD * 0.86 = 61.92 EUR

const USD_TO_CURRENCY_RATE: Record<string, number> = {
  USD: 1,
  EUR: 0.86,
  GBP: 0.74,
  CHF: 0.80,
}

export function convertCurrencyValue(value: number, currency = 'USD'): number {
  const rate = USD_TO_CURRENCY_RATE[currency] ?? 1
  return value * rate
}

export function formatCurrency(
  value: number,
  currency = 'USD',
  compact = false
): string {
  const convertedValue = convertCurrencyValue(value, currency)

  const locale =
    currency === 'EUR'
      ? 'de-DE'
      : currency === 'GBP'
        ? 'en-GB'
        : currency === 'CHF'
          ? 'de-CH'
          : 'en-US'

  if (compact && Math.abs(convertedValue) >= 1_000_000) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(convertedValue)
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(convertedValue)
}

export function formatPercent(value: number, decimals = 2): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDate(
  date: string | Date,
  style: 'short' | 'medium' | 'long' = 'medium'
): string {
  const d = typeof date === 'string' ? new Date(date) : date

  const formats: Record<typeof style, Intl.DateTimeFormatOptions> = {
    short: { month: 'numeric', day: 'numeric', year: '2-digit' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
  }

  return new Intl.DateTimeFormat('en-US', formats[style]).format(d)
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date

  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return formatDate(d, 'short')
}

export function calcGain(currentValue: number, costBasis: number) {
  const gain = currentValue - costBasis
  const pct = costBasis !== 0 ? (gain / costBasis) * 100 : 0
  return { gain, pct }
}

export function isPositive(value: number) {
  return value >= 0
}

export function gainColor(value: number): string {
  if (value > 0) return 'text-gain'
  if (value < 0) return 'text-loss'
  return 'text-ink-muted'
}

export function gainBgColor(value: number): string {
  if (value > 0) return 'bg-gain/10 text-gain'
  if (value < 0) return 'bg-loss/10 text-loss'
  return 'bg-surface-elevated text-ink-muted'
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength - 3)}...`
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function generateId(prefix?: string): string {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

  return prefix ? `${prefix}_${id}` : id
}

export function toDateInputValue(date: string | Date = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

export function fromDateInputValue(value: string): string {
  const now = new Date()
  const [year, month, day] = value.split('-').map(Number)

  const d = new Date(
    year,
    (month ?? 1) - 1,
    day ?? 1,
    now.getHours(),
    now.getMinutes(),
    now.getSeconds()
  )

  return d.toISOString()
}
