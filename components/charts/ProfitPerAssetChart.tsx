'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { ChartTooltip } from './ChartTooltip'
import { CHART_COLORS } from '@/lib/constants'
import { formatCompact } from '@/lib/utils'
import type { AssetProfitBreakdown } from '@/features/portfolio/logic'
import { EmptyState } from '@/components/ui'
import { BarChart3 } from 'lucide-react'

interface ProfitPerAssetChartProps {
  data: AssetProfitBreakdown[]
}

export function ProfitPerAssetChart({ data }: ProfitPerAssetChartProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Noch kein P&L vorhanden"
        description="Sobald deine Positionen Gewinn oder Verlust zeigen, erscheint hier der Vergleich pro Asset."
        className="border-0 h-52 justify-center"
      />
    )
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 44)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 24, left: 0, bottom: 4 }}
        barCategoryGap={10}
      >
        <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" horizontal={false} />

        <XAxis
          type="number"
          tickFormatter={(v) => formatCompact(v)}
          tick={{ fill: CHART_COLORS.axis, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="ticker"
          tick={{ fill: '#E2E8F0', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
          width={56}
        />

        <Tooltip
          content={
            <ChartTooltip
              labelFormatter={(label) => {
                const row = data.find((d) => d.ticker === label)
                return row ? `${row.ticker} — ${row.name}` : String(label)
              }}
            />
          }
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
        />

        <Bar dataKey="totalProfit" name="Profit" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.totalProfit >= 0 ? CHART_COLORS.gain : CHART_COLORS.loss} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
