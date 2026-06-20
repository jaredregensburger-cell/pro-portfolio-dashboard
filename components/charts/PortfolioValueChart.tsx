'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { ChartTooltip } from './ChartTooltip'
import { CHART_COLORS } from '@/lib/constants'
import { formatCompact, formatDate } from '@/lib/utils'
import type { PortfolioValuePoint } from '@/features/portfolio/logic'
import { EmptyState } from '@/components/ui'
import { LineChart } from 'lucide-react'

interface PortfolioValueChartProps {
  data: PortfolioValuePoint[]
}

export function PortfolioValueChart({ data }: PortfolioValueChartProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={LineChart}
        title="Noch nicht genug Daten"
        description="Sobald du Transaktionen erfasst hast, erscheint hier dein Wertverlauf."
        className="border-0 h-52 justify-center"
      />
    )
  }

  const chartData =
    data.length === 1
      ? [
          {
            ...data[0],
            date: `${data[0].date}-start`,
          },
          data[0],
        ]
      : data

  const first = chartData[0]
  const last = chartData[chartData.length - 1]
  const trendUp = last.totalValue >= first.totalValue
  const lineColor = trendUp ? CHART_COLORS.gain : CHART_COLORS.loss
  const gradientId = trendUp ? 'valueGradientGain' : 'valueGradientLoss'

  return (
    <ResponsiveContainer width="100%" height={208}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="valueGradientGain" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.gain} stopOpacity={0.25} />
            <stop offset="95%" stopColor={CHART_COLORS.gain} stopOpacity={0} />
          </linearGradient>

          <linearGradient id="valueGradientLoss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.loss} stopOpacity={0.25} />
            <stop offset="95%" stopColor={CHART_COLORS.loss} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />

        <XAxis
          dataKey="date"
          tickFormatter={(d) => {
            const value = String(d).replace('-start', '')
            return formatDate(value, 'short')
          }}
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
          content={
            <ChartTooltip
              labelFormatter={(label) => {
                const value = String(label).replace('-start', '')
                return formatDate(value, 'medium')
              }}
            />
          }
          cursor={{ stroke: CHART_COLORS.axis, strokeWidth: 1, strokeDasharray: '3 3' }}
        />

        <Area
          type="monotone"
          dataKey="totalValue"
          name="Value"
          stroke={lineColor}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
