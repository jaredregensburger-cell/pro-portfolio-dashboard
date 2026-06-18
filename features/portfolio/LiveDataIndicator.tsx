'use client'

import { cn, formatRelativeTime } from '@/lib/utils'
import { RefreshCw, Wifi, WifiOff, AlertTriangle } from 'lucide-react'
import type { LiveDataStatus } from './useLiveMarketData'

interface LiveDataIndicatorProps {
  status: LiveDataStatus
  lastUpdatedAt: string | null
  staleCount: number
  onRefresh: () => void
  className?: string
}

const STATUS_META: Record<LiveDataStatus, { icon: typeof Wifi; color: string; label: string }> = {
  idle: { icon: WifiOff, color: 'text-ink-faint', label: 'No live assets' },
  loading: { icon: RefreshCw, color: 'text-signal', label: 'Updating…' },
  success: { icon: Wifi, color: 'text-gain', label: 'Live' },
  partial: { icon: AlertTriangle, color: 'text-amber', label: 'Partially live' },
  error: { icon: WifiOff, color: 'text-loss', label: 'Offline' },
}

export function LiveDataIndicator({
  status,
  lastUpdatedAt,
  staleCount,
  onRefresh,
  className,
}: LiveDataIndicatorProps) {
  const meta = STATUS_META[status]
  const Icon = meta.icon

  return (
    <button
      onClick={onRefresh}
      title="Click to refresh now"
      className={cn(
        'flex items-center gap-1.5 rounded-lg border border-border bg-surface-raised px-2.5 py-1.5',
        'text-data-xs hover:border-border-strong transition-colors duration-150',
        className
      )}
    >
      <Icon
        size={12}
        strokeWidth={2}
        className={cn(meta.color, status === 'loading' && 'animate-spin')}
      />
      <span className={meta.color}>{meta.label}</span>
      {staleCount > 0 && status !== 'loading' && (
        <span className="text-ink-faint">· {staleCount} cached</span>
      )}
      {lastUpdatedAt && status !== 'loading' && (
        <span className="text-ink-faint font-mono hidden sm:inline">
          {formatRelativeTime(lastUpdatedAt)}
        </span>
      )}
    </button>
  )
}
