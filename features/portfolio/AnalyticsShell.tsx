'use client'

import { GlassCard, EmptyState, TimeRangeSelector } from '@/components/ui'
import { PortfolioValueChart, EquityCurveChart, ProfitPerAssetChart } from '@/components/charts'
import { useActivePortfolioData } from '@/features/portfolio/useActivePortfolioData'
import { useLiveMarketDataContext } from '@/features/portfolio/LiveMarketDataProvider'
import { usePortfolioStore, useSimulationStore, useModalStore } from '@/store'
import {
  getPortfolioValueHistory,
  filterValueHistoryByRange,
  getEquityCurve,
  getProfitPerAsset,
} from '@/features/portfolio/logic'
import { cn, formatCurrency, gainColor } from '@/lib/utils'
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react'

export function AnalyticsShell() {
  const { assets, transactions } = useActivePortfolioData()
  const { livePrices } = useLiveMarketDataContext()
  const { selectedTimeRange, setTimeRange } = usePortfolioStore()
  const openModal = useModalStore((s) => s.openModal)
  const loadDemoData = useSimulationStore((s) => s.loadDemoData)

  if (assets.length === 0 || transactions.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Noch keine Analyse-Daten"
        description="Sobald du Transaktionen erfasst hast, zeigt diese Seite Equity Curve, Profit-Vergleich pro Asset und deinen vollständigen Wertverlauf."
        action={{ label: 'Asset hinzufügen', onClick: () => openModal('add-asset') }}
        secondaryAction={{ label: 'Demo-Daten laden', onClick: loadDemoData }}
      />
    )
  }

  const valueHistory = getPortfolioValueHistory(assets, transactions)
  const filteredHistory = filterValueHistoryByRange(valueHistory, selectedTimeRange)
  const equityCurve = getEquityCurve(assets, transactions)
  const profitPerAsset = getProfitPerAsset(assets, transactions, livePrices)

  const latestEquity = equityCurve[equityCurve.length - 1]
  const tradingEdgePositive = latestEquity ? latestEquity.tradingEdge >= 0 : true

  const topGainer = profitPerAsset[0]
  const topLoser = profitPerAsset[profitPerAsset.length - 1]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Equity Curve ── */}
      <GlassCard padding="none" className="overflow-hidden">
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-border">
          <div>
            <p className="text-data-sm font-semibold text-ink">Equity Curve</p>
            <p className="text-data-xs text-ink-muted mt-0.5">
              Portfolio-Wert vs. eingesetztes Kapital
            </p>
          </div>
          {latestEquity && (
            <div className="text-right">
              <p className="text-data-xs text-ink-faint uppercase tracking-wide">Trading Edge</p>
              <p className={cn('font-mono text-data-lg font-semibold', gainColor(latestEquity.tradingEdge))}>
                {tradingEdgePositive ? '+' : ''}
                {formatCurrency(latestEquity.tradingEdge)}
              </p>
            </div>
          )}
        </div>
        <div className="px-2 pb-3 pt-2">
          <EquityCurveChart data={equityCurve} />
        </div>
      </GlassCard>

      {/* ── Value History with range selector ── */}
      <GlassCard padding="none" className="overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <div>
            <p className="text-data-sm font-semibold text-ink">Portfolio Value Over Time</p>
            <p className="text-data-xs text-ink-muted mt-0.5">
              Rekonstruiert aus deiner Transaktionshistorie
            </p>
          </div>
          <TimeRangeSelector selected={selectedTimeRange} onChange={setTimeRange} />
        </div>
        <div className="px-2 pb-2 pt-2">
          <PortfolioValueChart data={filteredHistory} />
        </div>
      </GlassCard>

      {/* ── Profit per Asset ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <GlassCard padding="none" className="overflow-hidden h-full">
            <div className="px-5 py-4 border-b border-border">
              <p className="text-data-sm font-semibold text-ink">Profit per Asset</p>
              <p className="text-data-xs text-ink-muted mt-0.5">
                Unrealisiert + realisiert, je Position
              </p>
            </div>
            <div className="px-4 py-3">
              <ProfitPerAssetChart data={profitPerAsset} />
            </div>
          </GlassCard>
        </div>

        {/* Top Gainer / Loser callouts */}
        <div className="space-y-4">
          {topGainer && (
            <GlassCard accent="gain" className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-data-xs text-ink-muted font-medium tracking-wide uppercase">
                  Top Gainer
                </p>
                <TrendingUp size={14} className="text-gain" />
              </div>
              <p className="text-data-base font-semibold text-ink">{topGainer.ticker}</p>
              <p className="font-mono text-data-xl font-semibold text-gain">
                +{formatCurrency(topGainer.totalProfit)}
              </p>
            </GlassCard>
          )}

          {topLoser && topLoser.ticker !== topGainer?.ticker && (
            <GlassCard accent="loss" className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-data-xs text-ink-muted font-medium tracking-wide uppercase">
                  Top Loser
                </p>
                <TrendingDown size={14} className="text-loss" />
              </div>
              <p className="text-data-base font-semibold text-ink">{topLoser.ticker}</p>
              <p className="font-mono text-data-xl font-semibold text-loss">
                {formatCurrency(topLoser.totalProfit)}
              </p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  )
}
