'use client'

import { GlassCard } from './GlassCard'
import { cn, formatCurrency, formatPercent, gainColor } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  formatted?: boolean
  currency?: string
  change?: number
  changePct?: number
  changeLabel?: string
  sublabel?: string
  accent?: 'signal' | 'gain' | 'loss' | 'violet' | 'amber' | 'none'
  /** Adds a soft outer glow matching the accent color */
  glow?: boolean
  className?: string
}

export function StatCard({
  label,
  value,
  formatted = false,
  currency = 'USD',
  change,
  changePct,
  changeLabel,
  sublabel,
  accent = 'none',
  glow = false,
  className,
}: StatCardProps) {
  const hasChange = change !== undefined || changePct !== undefined
  const isPositive = (change ?? changePct ?? 0) >= 0
  const isZero = (change ?? changePct ?? 0) === 0

  const TrendIcon = isZero ? Minus : isPositive ? TrendingUp : TrendingDown
  const trendColor = isZero ? 'text-ink-faint' : isPositive ? 'text-gain' : 'text-loss'

  const displayValue = formatted
    ? typeof value === 'number'
      ? formatCurrency(value, currency)
      : value
    : value

  return (
    <GlassCard accent={accent} glow={glow} className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <p className="text-data-sm text-ink-muted font-medium tracking-wide uppercase">
          {label}
        </p>
        {hasChange && (
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-md text-data-xs font-mono font-medium',
              isZero
                ? 'bg-surface-elevated text-ink-faint'
                : isPositive
                ? 'bg-gain/10 text-gain'
                : 'bg-loss/10 text-loss'
            )}
          >
            <TrendIcon size={11} strokeWidth={2.5} />
            {changePct !== undefined && formatPercent(changePct)}
          </div>
        )}
      </div>

      <div>
        <p className="font-mono text-data-3xl font-semibold text-ink tracking-tight">
          {displayValue}
        </p>
        {sublabel && (
          <p className="text-data-sm text-ink-muted mt-1">{sublabel}</p>
        )}
      </div>

      {hasChange && change !== undefined && (
        <div className={cn('flex items-center gap-1 text-data-sm font-mono', trendColor)}>
          <TrendIcon size={13} strokeWidth={2} />
          <span>
            {change >= 0 ? '+' : ''}
            {formatted ? formatCurrency(change, currency) : change}
          </span>
          {changeLabel && (
            <span className="text-ink-faint ml-1">{changeLabel}</span>
          )}
        </div>
      )}
    </GlassCard>
  )
}
