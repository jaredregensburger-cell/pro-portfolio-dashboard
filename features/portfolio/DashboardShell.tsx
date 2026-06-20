'use client'

import { PortfolioInsights } from '@/features/portfolio/PortfolioInsights'
import { calculatePortfolioScore } from '@/features/portfolio/portfolioScore'
import { GlassCard, StatCard, TimeRangeSelector, EmptyState, SkeletonCard, SkeletonTable } from '@/components/ui'
import { PortfolioValueChart } from '@/components/charts'
import { useActivePortfolioData } from '@/features/portfolio/useActivePortfolioData'
import { useLiveMarketDataContext } from '@/features/portfolio/LiveMarketDataProvider'
import { usePortfolioSnapshots } from '@/features/portfolio/usePortfolioSnapshots'
import { usePortfolioStore, useModalStore, useUIStore } from '@/store'
import {
  getPortfolioAnalytics,
  getPortfolioValueHistory,
  filterValueHistoryByRange,
} from '@/features/portfolio/logic'
import { AssetRow } from '@/features/assets/AssetRow'
import { cn, formatCurrency, formatPercent, formatRelativeTime, gainColor } from '@/lib/utils'
import { ASSET_CLASS_META } from '@/lib/constants'
import type { RankedPosition } from '@/features/portfolio/logic'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Trophy,
  TrendingDown,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react'

export function DashboardShell() {
  const { portfolioId, assets, transactions, hasHydrated } = useActivePortfolioData()
  const { livePrices } = useLiveMarketDataContext()
  const { points: snapshotPoints, loading: snapshotsLoading } = usePortfolioSnapshots(portfolioId)

  const { selectedTimeRange, setTimeRange } = usePortfolioStore()
  const currency = useUIStore((s) => s.currency)
  const openModal = useModalStore((s) => s.openModal)

  if (!hasHydrated || snapshotsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonCard className="h-64" />
        <SkeletonTable rows={4} />
      </div>
    )
  }

  if (assets.length === 0) {
  return (
    <GlassCard className="max-w-3xl mx-auto text-center py-16">
      <div className="space-y-6">
        <div>
          <p className="text-signal font-semibold mb-2">
            Willkommen bei Folio AI
          </p>

          <h1 className="text-3xl font-bold text-ink">
            In 60 Sekunden zu deinem fertigen Portfolio
          </h1>

          <p className="mt-4 text-ink-muted max-w-xl mx-auto">
            Verbinde deinen Broker oder importiere dein Portfolio.
            Folio analysiert automatisch deine Positionen,
            Risiken und Chancen.
          </p>
        </div>

        <div className="grid gap-3 max-w-lg mx-auto text-left">
          <div className="rounded-xl border border-border p-4">
            1. Broker auswählen
          </div>

          <div className="rounded-xl border border-border p-4">
            2. CSV hochladen
          </div>

          <div className="rounded-xl border border-border p-4">
            3. Portfolio Analyse erhalten
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={() => window.location.href = '/import'}
            className="px-5 py-3 rounded-xl bg-signal text-white font-medium"
          >
            Portfolio importieren
          </button>
        </div>
      </div>
    </GlassCard>
  )
}

  const analytics = getPortfolioAnalytics(assets, transactions, livePrices)
  const portfolioScore = calculatePortfolioScore(
  analytics.positions,
  analytics.totalValue
)

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime())
    .slice(0, 5)

  const fallbackHistory = getPortfolioValueHistory(assets, transactions)

  const today = new Date().toISOString().slice(0, 10)

  const currentPoint = {
    date: today,
    totalValue: analytics.totalValue,
    totalCost: analytics.totalCost,
    gain: analytics.totalValue - analytics.totalCost,
    gainPct:
      analytics.totalCost > 0
        ? ((analytics.totalValue - analytics.totalCost) / analytics.totalCost) * 100
        : 0,
  }

  const baseHistory = snapshotPoints.length > 0 ? snapshotPoints : fallbackHistory

  const valueHistory =
    baseHistory.length > 0 && baseHistory[baseHistory.length - 1]?.date === today
      ? [...baseHistory.slice(0, -1), currentPoint]
      : [...baseHistory, currentPoint]

  const filteredHistory = filterValueHistoryByRange(valueHistory, selectedTimeRange)

  const rangeChange =
    filteredHistory.length >= 2
      ? filteredHistory[filteredHistory.length - 1].totalValue - filteredHistory[0].totalValue
      : 0

  const rangeChangePct =
    filteredHistory.length >= 2 && filteredHistory[0].totalValue > 0
      ? (rangeChange / filteredHistory[0].totalValue) * 100
      : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Value"
          value={analytics.totalValue}
          formatted
          currency={currency}
          changePct={analytics.unrealizedPnL.pct}
          changeLabel="unrealized"
          accent="signal"
          glow
        />

        <GlassCard accent="violet" className="space-y-3">
          <p className="text-data-sm text-ink-muted font-medium tracking-wide uppercase">
            Total Profit
          </p>
          <p className={cn('font-mono text-data-3xl font-semibold tracking-tight', gainColor(analytics.totalProfit))}>
            {analytics.totalProfit >= 0 ? '+' : ''}
            {formatCurrency(analytics.totalProfit, currency)}
          </p>
          <div className="flex items-center gap-3 text-data-xs font-mono">
            <span className={gainColor(analytics.unrealizedPnL.amount)}>
              Unrealized {formatCurrency(analytics.unrealizedPnL.amount, currency)}
            </span>
            <span className="text-ink-faint">·</span>
            <span className={gainColor(analytics.realizedPnL)}>
              Realized {formatCurrency(analytics.realizedPnL, currency)}
            </span>
          </div>
        </GlassCard>

        <GlassCard accent="signal" className="space-y-3">
  <p className="text-data-sm text-ink-muted font-medium tracking-wide uppercase">
    Folio AI Score
  </p>

  <div className="flex items-end gap-2">
    <p className="font-mono text-data-3xl font-semibold text-ink">
      {portfolioScore.score}
    </p>
    <p className="pb-1 text-data-sm text-ink-muted">/100</p>
  </div>

  <p className="text-data-sm text-ink-muted">
    {portfolioScore.label}
  </p>
</GlassCard>

<PerformerCard label="Best Asset" icon={Trophy} ranked={analytics.bestAsset} accent="gain" />
      </div>

      <GlassCard padding="none" className="overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 pt-5 pb-4 border-b border-border">
          <div>
            <p className="text-data-sm text-ink-muted font-medium">Portfolio Performance</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="font-mono text-data-2xl font-semibold text-ink">
                {formatCurrency(analytics.totalValue, currency)}
              </p>

              {filteredHistory.length >= 2 && (
                <span className={cn('font-mono text-data-sm font-medium', gainColor(rangeChange))}>
                  {rangeChange >= 0 ? '+' : ''}
                  {formatCurrency(rangeChange, currency)} ({formatPercent(rangeChangePct)})
                </span>
              )}
            </div>
          </div>

          <TimeRangeSelector
            selected={selectedTimeRange}
            onChange={setTimeRange}
            className="self-start sm:self-auto"
          />
        </div>

        <div className="px-2 pb-2 pt-2">
          <PortfolioValueChart data={filteredHistory} />
        </div>
      </GlassCard>

      <PortfolioInsights score={portfolioScore} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <GlassCard padding="none">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <p className="text-data-sm font-semibold text-ink">Top Positions</p>
              <a href="/assets" className="text-data-xs text-signal hover:text-signal-dim transition-colors">
                View all →
              </a>
            </div>

            <div className="divide-y divide-border">
              {analytics.positions.slice(0, 5).map(({ asset, position }) => (
                <AssetRow key={asset.id} asset={asset} position={position} compact />
              ))}
            </div>
          </GlassCard>
        </div>

        <div>
          <GlassCard padding="none" className="h-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <p className="text-data-sm font-semibold text-ink">Recent Activity</p>
              <Activity size={15} className="text-ink-faint" />
            </div>

            {recentTransactions.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No recent activity"
                description="Your transaction history will appear here."
                className="border-0 py-10"
              />
            ) : (
              <div className="divide-y divide-border">
                {recentTransactions.map((tx) => {
                  const asset = assets.find((a) => a.id === tx.assetId)
                  const isBuy = tx.type === 'buy'
                  const total = tx.quantity * tx.price

                  return (
                    <div key={tx.id} className="flex items-center gap-3 px-5 py-3">
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          isBuy ? 'bg-signal/10 text-signal' : 'bg-gain/10 text-gain'
                        )}
                      >
                        {isBuy ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-data-sm font-medium text-ink truncate">
                          {isBuy ? 'Buy' : 'Sell'} {asset?.ticker ?? '—'}
                        </p>
                        <p className="text-data-xs text-ink-faint">
                          {formatRelativeTime(tx.executedAt)}
                        </p>
                      </div>

                      <p className={cn('font-mono text-data-sm font-medium', isBuy ? 'text-ink' : 'text-gain')}>
                        {isBuy ? '-' : '+'}
                        {formatCurrency(total, currency)}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

interface PerformerCardProps {
  label: string
  icon: LucideIcon
  ranked: RankedPosition | null
  accent: 'gain' | 'loss'
}

function PerformerCard({ label, icon: Icon, ranked, accent }: PerformerCardProps) {
  if (!ranked) {
    return (
      <GlassCard className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-data-sm text-ink-muted font-medium tracking-wide uppercase">{label}</p>
          <Icon size={14} className="text-ink-faint" />
        </div>
        <p className="text-data-sm text-ink-faint pt-1">Need ≥2 open positions</p>
      </GlassCard>
    )
  }

  const { asset, position } = ranked
  const meta = ASSET_CLASS_META[asset.assetClass]

  return (
    <GlassCard accent={accent} className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-data-sm text-ink-muted font-medium tracking-wide uppercase">{label}</p>
        <Icon size={14} className={accent === 'gain' ? 'text-gain' : 'text-loss'} />
      </div>

      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-data-xs font-mono font-semibold"
          style={{
            backgroundColor: meta.bgColor,
            color: meta.color,
            border: `1px solid ${meta.borderColor}`,
          }}
        >
          {asset.ticker.slice(0, 4)}
        </div>

        <div className="min-w-0">
          <p className="text-data-base font-semibold text-ink truncate">{asset.ticker}</p>
          <p className="text-data-xs text-ink-muted truncate">{asset.name}</p>
        </div>
      </div>

      <p className={cn('font-mono text-data-xl font-semibold', gainColor(position.unrealizedGain))}>
        {formatPercent(position.unrealizedGainPct)}
      </p>
    </GlassCard>
  )
}
