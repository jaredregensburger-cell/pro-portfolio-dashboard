'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartTooltip } from './ChartTooltip'
import { ASSET_CLASS_META } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import type { SimAllocationSlice } from '@/types/simulation'
import { EmptyState } from '@/components/ui'
import { PieChart as PieChartIcon } from 'lucide-react'

interface AllocationDonutProps {
  allocation: SimAllocationSlice[]
  totalValue: number
}

export function AllocationDonut({ allocation, totalValue }: AllocationDonutProps) {
  if (allocation.length === 0) {
    return (
      <EmptyState
        icon={PieChartIcon}
        title="Keine offenen Positionen"
        description="Sobald du Assets hältst, zeigt diese Übersicht die Aufteilung nach Anlageklasse."
        className="border-0 h-full justify-center"
      />
    )
  }

  const data = allocation.map((slice) => ({
    name: ASSET_CLASS_META[slice.assetClass].label,
    value: slice.value,
    color: ASSET_CLASS_META[slice.assetClass].color,
  }))

  return (
    <div className="relative w-full">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={56}
            outerRadius={82}
            paddingAngle={3}
            stroke="none"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip labelFormatter={(label) => String(label)} />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="font-mono text-data-lg font-semibold text-ink">
          {formatCurrency(totalValue, 'USD', true)}
        </p>
        <p className="text-data-xs text-ink-faint">
          {allocation.length} {allocation.length === 1 ? 'class' : 'classes'}
        </p>
      </div>
    </div>
  )
}
