'use client'

import { GlassCard, EmptyState, StatCard, SkeletonCard } from '@/components/ui'
import { AllocationDonut } from '@/components/charts'
import { PieChart, Wallet } from 'lucide-react'
import { useModalStore, useSimulationStore, useUIStore } from '@/store'
import { useActivePortfolioData } from '@/features/portfolio/useActivePortfolioData'
import { useLiveMarketDataContext } from '@/features/portfolio/LiveMarketDataProvider'
import { getPortfolioAnalytics } from '@/features/portfolio/logic'
import { ASSET_CLASS_META } from '@/lib/constants'
import { formatCurrency, cn, gainColor } from '@/lib/utils'

export function PortfolioShell() {
  const { assets, transactions, hasHydrated } = useActivePortfolioData()
  const { livePrices } = useLiveMarketDataContext()
  const currency = useUIStore((s) => s.currency)
  const openModal = useModalStore((s) => s.openModal)
  const loadDemoData = useSimulationStore((s) => s.loadDemoData)

  if (!hasHydrated) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard className="h-64" />
      </div>
    )
  }

  if (assets.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="Noch keine Allokation"
        description="Sobald du Assets und Transaktionen erfasst hast, zeigt diese Seite die Aufteilung deines Portfolios nach Anlageklasse."
        action={{ label: 'Asset hinzufügen', onClick: () => openModal('add-asset') }}
        secondaryAction={{ label: 'Demo-Daten laden', onClick: loadDemoData }}
      />
    )
  }

  const analytics = getPortfolioAnalytics(assets, transactions, livePrices)
  const { allocation, totalValue, totalCost, unrealizedPnL } = analytics

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Total Value"
          value={totalValue}
          formatted
          currency={currency}
          changePct={unrealizedPnL.pct}
          changeLabel="unrealized"
          accent="signal"
        />

        <GlassCard accent="gain" className="space-y-3">
          <p className="text-data-sm text-ink-muted font-medium tracking-wide uppercase">
            Unrealized Gain
          </p>
          <p
            className={cn(
              'font-mono text-data-3xl font-semibold tracking-tight',
              gainColor(unrealizedPnL.amount)
            )}
          >
            {unrealizedPnL.amount >= 0 ? '+' : ''}
            {formatCurrency(unrealizedPnL.amount, currency)}
          </p>
          <p className="text-data-sm text-ink-muted">
            vs. cost basis of {formatCurrency(totalCost, currency)}
          </p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard
          className="lg:col-span-1 flex flex-col items-center justify-center min-h-[280px]"
          padding="sm"
        >
          <p className="text-data-sm font-semibold text-ink self-start mb-2">
            Allocation
          </p>
          <AllocationDonut allocation={allocation} totalValue={totalValue} />
        </GlassCard>

        <GlassCard className="lg:col-span-2" padding="none">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-data-sm font-semibold text-ink">
              Allocation Breakdown
            </p>
          </div>

          <div className="divide-y divide-border">
            {allocation.length === 0 ? (
              <EmptyState
                icon={PieChart}
                title="Keine offenen Positionen"
                description="Alle Positionen wurden vollständig verkauft."
                className="border-0 py-10"
              />
            ) : (
              allocation.map((slice) => {
                const meta = ASSET_CLASS_META[slice.assetClass]

                return (
                  <div
                    key={slice.assetClass}
                    className="flex items-center gap-4 px-5 py-3.5"
                  >
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: meta.color }}
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-data-sm font-medium text-ink">
                        {meta.label}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-mono text-data-sm font-medium text-ink">
                        {formatCurrency(slice.value, currency)}
                      </p>
                      <p className="font-mono text-data-xs text-ink-muted">
                        {slice.pct.toFixed(1)}%
                      </p>
                    </div>

                    <div className="w-20 h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${slice.pct}%`,
                          backgroundColor: meta.color,
                        }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
