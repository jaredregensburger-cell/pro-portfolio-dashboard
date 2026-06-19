'use client'

import Link from 'next/link'
import { ArrowLeft, Activity, Clock, TrendingUp, Wallet } from 'lucide-react'
import { GlassCard, EmptyState } from '@/components/ui'
import { useActivePortfolioData } from '@/features/portfolio/useActivePortfolioData'
import { useLiveMarketDataContext } from '@/features/portfolio/LiveMarketDataProvider'
import { computeAssetPosition } from '@/features/portfolio/logic'
import { formatCurrency, formatNumber, formatPercent, gainColor } from '@/lib/utils'
import { ASSET_CLASS_META } from '@/lib/constants'
import { useUIStore } from '@/store'

export function AssetDetailShell({ ticker }: { ticker: string }) {
  const currency = useUIStore((s) => s.currency)
  const { assets, transactions, hasHydrated } = useActivePortfolioData()
  const { livePrices } = useLiveMarketDataContext()

  const asset = assets.find(
    (a) => a.ticker.toLowerCase() === ticker.toLowerCase()
  )

  if (!hasHydrated) {
    return <div className="text-ink-muted">Lädt…</div>
  }

  if (!asset) {
    return (
      <EmptyState
        icon={Wallet}
        title="Asset nicht gefunden"
        description="Dieses Asset existiert nicht in deinem Portfolio."
        action={{
          label: 'Zurück zu Assets',
          onClick: () => window.location.href = '/assets',
        }}
      />
    )
  }

  const position = computeAssetPosition(asset, transactions, livePrices)
  const meta = ASSET_CLASS_META[asset.assetClass]

  const assetTransactions = transactions
    .filter((tx) => tx.assetId === asset.id)
    .sort(
      (a, b) =>
        new Date(b.executedAt).getTime() -
        new Date(a.executedAt).getTime()
    )

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        href="/assets"
        className="inline-flex items-center gap-2 text-data-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={16} />
        Zurück zu Assets
      </Link>

      <GlassCard>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl font-mono font-bold"
              style={{
                backgroundColor: meta.bgColor,
                color: meta.color,
                border: `1px solid ${meta.borderColor}`,
              }}
            >
              {asset.ticker.slice(0, 4)}
            </div>

            <div>
              <p className="text-data-sm text-ink-muted">{meta.label}</p>
              <h1 className="text-3xl font-semibold text-ink">
                {asset.name}
              </h1>
              <p className="font-mono text-data-sm text-ink-faint">
                {asset.ticker}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-data-sm text-ink-muted">Aktueller Wert</p>
            <p className="font-mono text-3xl font-semibold text-ink">
              {formatCurrency(position.currentValue, currency)}
            </p>
            <p className={gainColor(position.unrealizedGain)}>
              {position.unrealizedGain >= 0 ? '+' : ''}
              {formatCurrency(position.unrealizedGain, currency)} ·{' '}
              {formatPercent(position.unrealizedGainPct)}
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <GlassCard>
          <p className="text-data-sm text-ink-muted">Bestand</p>
          <p className="mt-2 font-mono text-xl font-semibold text-ink">
            {formatNumber(
              position.quantity,
              asset.assetClass === 'crypto' ? 8 : 4
            )}
          </p>
        </GlassCard>

        <GlassCard>
          <p className="text-data-sm text-ink-muted">Ø Kaufpreis</p>
          <p className="mt-2 font-mono text-xl font-semibold text-ink">
            {formatCurrency(position.avgCostBasis, currency)}
          </p>
        </GlassCard>

        <GlassCard>
          <p className="text-data-sm text-ink-muted">Aktueller Kurs</p>
          <p className="mt-2 font-mono text-xl font-semibold text-ink">
            {formatCurrency(position.currentPrice, currency)}
          </p>
        </GlassCard>

        <GlassCard>
          <p className="text-data-sm text-ink-muted">Transaktionen</p>
          <p className="mt-2 font-mono text-xl font-semibold text-ink">
            {assetTransactions.length}
          </p>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-data-sm font-semibold text-ink">
              Performance
            </p>
            <p className="text-data-xs text-ink-faint">
              Chart-Platzhalter — echte Historie kommt später.
            </p>
          </div>
          <TrendingUp size={18} className="text-signal" />
        </div>

        <div className="flex h-56 items-end gap-2 rounded-2xl border border-border bg-surface-raised p-4">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-signal/70"
              style={{ height: `${30 + ((i * 17) % 60)}%` }}
            />
          ))}
        </div>
      </GlassCard>

      <GlassCard padding="none">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="text-data-sm font-semibold text-ink">
            Transaktionshistorie
          </p>
          <Activity size={16} className="text-ink-faint" />
        </div>

        {assetTransactions.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="Keine Transaktionen"
            description="Für dieses Asset gibt es noch keine Käufe oder Verkäufe."
            className="border-0 py-10"
          />
        ) : (
          <div className="divide-y divide-border">
            {assetTransactions.map((tx) => {
              const value = tx.quantity * tx.price

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div>
                    <p className="text-data-sm font-semibold text-ink">
                      {tx.type === 'buy' ? 'Kauf' : 'Verkauf'}
                    </p>
                    <p className="text-data-xs text-ink-faint">
                      {new Date(tx.executedAt).toLocaleDateString('de-DE')}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-mono text-data-sm text-ink">
                      {formatNumber(
                        tx.quantity,
                        asset.assetClass === 'crypto' ? 8 : 4
                      )}{' '}
                      {asset.ticker}
                    </p>
                    <p className="font-mono text-data-xs text-ink-faint">
                      {formatCurrency(value, currency)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
