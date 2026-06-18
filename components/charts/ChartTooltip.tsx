'use client'

import { formatCurrency, formatDate } from '@/lib/utils'

interface ChartTooltipProps {
  active?: boolean
  label?: string | number
  payload?: Array<{
    value: number
    name?: string
    dataKey?: string
    color?: string
  }>
  /** Format the header label (defaults to a short date) */
  labelFormatter?: (label: string | number) => string
  /** Format each row's value (defaults to currency) */
  valueFormatter?: (value: number) => string
}

export function ChartTooltip({
  active,
  label,
  payload,
  labelFormatter,
  valueFormatter,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const formattedLabel = labelFormatter
    ? labelFormatter(label ?? '')
    : typeof label === 'string'
      ? formatDate(label, 'medium')
      : String(label ?? '')

  return (
    <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2 shadow-glass-lg">
      <p className="text-data-xs text-ink-faint font-mono mb-1">{formattedLabel}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          {entry.color && (
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
          )}
          <span className="font-mono text-data-sm font-medium text-ink">
            {valueFormatter ? valueFormatter(entry.value) : formatCurrency(entry.value)}
          </span>
          {entry.name && <span className="text-data-xs text-ink-muted">{entry.name}</span>}
        </div>
      ))}
    </div>
  )
}
