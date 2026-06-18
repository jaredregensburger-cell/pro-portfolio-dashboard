'use client'

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { ChartTooltip } from './ChartTooltip'
import { CHART_COLORS } from '@/lib/constants'
import { formatCompact, formatDate } from '@/lib/utils'
import type { EquityCurvePoint } from '@/features/portfolio/logic'
import { EmptyState } from '@/components/ui'
import { Activity } from 'lucide-react'

interface EquityCurveChartProps {
  data: EquityCurvePoint[]
}

export function EquityCurveChart({ data }: EquityCurveChartProps) {
  if (data.length < 2) {
    return (
      <EmptyState
        icon={Activity}
        title="Equity Curve noch nicht verfügbar"
        description="Erfasse Transaktionen an mehreren Tagen, um zu sehen wie sich dein Portfolio im Vergleich zum eingesetzten Kapital entwickelt."
        className="border-0 h-60 justify-center"
      />
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.2} />
            <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />

        <XAxis
          dataKey="date"
          tickFormatter={(d) => formatDate(d, 'short')}
          tick={{ fill: CHART_COLORS.axis, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
          axisLine={false}
          tickLine={false}
          minTickGap={48}
        />
        <YAxis
          tickFormatter={(v) => formatCompact(v)}
          tick={{ fill: CHART_COLORS.axis, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
          axisLine={false}
          tickLine={false}
          width={48}
          domain={['auto', 'auto']}
        />

        <Tooltip
          content={<ChartTooltip labelFormatter={(label) => formatDate(String(label), 'medium')} />}
          cursor={{ stroke: CHART_COLORS.axis, strokeWidth: 1, strokeDasharray: '3 3' }}
        />

        <Legend
          wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', paddingTop: 8 }}
          iconType="circle"
          iconSize={8}
        />

        <Area
          type="monotone"
          dataKey="equity"
          name="Portfolio Equity"
          stroke={CHART_COLORS.primary}
          strokeWidth={2}
          fill="url(#equityGradient)"
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
        <Line
          type="monotone"
          dataKey="investedCapital"
          name="Invested Capital"
          stroke={CHART_COLORS.axis}
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
