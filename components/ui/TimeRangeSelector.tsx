'use client'

import { cn } from '@/lib/utils'
import { TIME_RANGES } from '@/lib/constants'
import type { TimeRange } from '@/types'

interface TimeRangeSelectorProps {
  selected: TimeRange
  onChange: (range: TimeRange) => void
  className?: string
}

export function TimeRangeSelector({ selected, onChange, className }: TimeRangeSelectorProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg bg-surface p-1 border border-border',
        'overflow-x-auto max-w-full scrollbar-none',
        className
      )}
    >
      {TIME_RANGES.map((range) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={cn(
            'px-2.5 py-1 rounded-md text-data-xs font-mono font-medium transition-all duration-150 shrink-0',
            selected === range
              ? 'bg-surface-elevated text-ink shadow-sm border border-border-strong'
              : 'text-ink-faint hover:text-ink-muted hover:bg-surface-raised'
          )}
        >
          {range}
        </button>
      ))}
    </div>
  )
}
