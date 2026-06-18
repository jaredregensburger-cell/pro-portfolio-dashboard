'use client'

import { GlassCard, StatCard, TimeRangeSelector, EmptyState, SkeletonCard, SkeletonTable } from '@/components/ui'
import { PortfolioValueChart } from '@/components/charts'
import { useActivePortfolioData } from '@/features/portfolio/useActivePortfolioData'
import { useLiveMarketDataContext } from '@/features/portfolio/LiveMarketDataProvider'
import { usePortfolioStore, useModalStore, useSimulationStore } from '@/store'
import {
  getPortfolioAnalytics,
  getPortfolioValueHistory,
  filterValueHistoryByRange,
} from '@/features/portfolio/logic'
import { AssetRow } from '@/features/assets/AssetRow'
import { cn, formatCurrency, formatPercent, formatRelativeTime, gainColor } from '@/lib/utils'
import { ASSET_CLASS_META } from '@/lib/constants'
import type { RankedPosition } from '@/features/portfolio/logic'
import {
  Activity,
  Trophy,
  TrendingDown,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react'

export function DashboardShell() {
  const { assets, transactions, hasHydrated } = useActivePortfolioData()
  const { livePrices } = useLiveMarketDataContext()
  const { selectedTimeRange, setTimeRange } = usePortfolioStore()
  const openModal = useModalStore((s) => s.openModal)
  const loadDemoData = useSimulationStore((s) => s.loadDemoData)

  // ── Loading state: persisted data hasn't hydrated from localStorage yet ──
  if (!hasHydrated) {
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

  // ── Empty state: brand-new portfolio, no assets yet ──
  if (assets.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="Dein Portfolio ist leer"
        description="Lege dein erstes Asset an und erfasse Käufe oder Verkäufe — Bestand, Durchschnittspreis und P&L werden vollständig aus deinen Transaktionen berechnet."
        action={{ label: 'Asset hinzufügen', onClick: () => openModal('add-asset') }}
        secondaryAction={{ label: 'Demo-Daten laden', onClick: loadDemoData }}
        className="min-h-[420px]"
      />
    )
  }

  const analytics = getPortfolioAnalytics(assets, transactions, livePrices)

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime())
    .slice(0, 5)

  const valueHistory = getPortfolioValueHistory(assets, transactions)
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
      {/* ── Summary KPIs: Total Value · Total Profit · Best Asset · Worst Asset ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Value"
          value={analytics.totalValue}
          formatted
          currency="USD"
          changePct={analytics.unrealizedPnL.pct}
          changeLabel="unrealized"
          accent="signal"
          glow
        />

        <GlassCard accent="violet" className="space-y-3">
          <p className="text-data-sm text-ink-muted font-medium tracking-wide uppercase">
            Total Profit
          </p>
          <p
            className={cn(
              'font-mono text-data-3xl font-semibold tracking-tight',
              gainColor(analytics.totalProfit)
            )}
          >
            {analytics.totalProfit >= 0 ? '+' : ''}
            {formatCurrency(analytics.totalProfit)}
          </p>
          <div className="flex items-center gap-3 text-data-xs font-mono">
            <span className={gainColor(analytics.unrealizedPnL.amount)}>
              Unrealized {formatCurrency(analytics.unrealizedPnL.amount)}
            </span>
            <span className="text-ink-faint">·</span>
            <span className={gainColor(analytics.realizedPnL)}>
              Realized {formatCurrency(analytics.realizedPnL)}
            </span>
          </div>
        </GlassCard>

        <PerformerCard
          label="Best Asset"
          icon={Trophy}
          ranked={analytics.bestAsset}
          accent="gain"
        />

        <PerformerCard
          label="Worst Asset"
          icon={TrendingDown}
          ranked={analytics.worstAsset}
          accent="loss"
        />
      </div>

      {/* ── Chart Area ── */}
      <GlassCard padding="none" className="overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 pt-5 pb-4 border-b border-border">
          <div>
            <p className="text-data-sm text-ink-muted font-medium">Portfolio Performance</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="font-mono text-data-2xl font-semibold text-ink">
                {formatCurrency(analytics.totalValue)}
              </p>
              {filteredHistory.length >= 2 && (
                <span className={cn('font-mono text-data-sm font-medium', gainColor(rangeChange))}>
                  {rangeChange >= 0 ? '+' : ''}
                  {formatCurrency(rangeChange)} ({formatPercent(rangeChangePct)})
                </span>
              )}
            </div>
          </div>
          <TimeRangeSelector selected={selectedTimeRange} onChange={setTimeRange} className="self-start sm:self-auto" />
        </div>

        <div className="px-2 pb-2 pt-2">
          <PortfolioValueChart data={filteredHistory} />
        </div>
      </GlassCard>

      {/* ── Bottom grid: Top Positions + Recent Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Positions */}
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

        {/* Activity feed */}
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
                      <p
                        className={cn(
                          'font-mono text-data-sm font-medium',
                          isBuy ? 'text-ink' : 'text-gain'
                        )}
                      >
                        {isBuy ? '-' : '+'}
                        {formatCurrency(total)}
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

// ─── Best / Worst Asset Card ──────────────────────────────────────────────────

interface PerformerCardProps {
  label: string
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
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
          style={{ backgroundColor: meta.bgColor, color: meta.color, border: `1px solid ${meta.borderColor}` }}
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
