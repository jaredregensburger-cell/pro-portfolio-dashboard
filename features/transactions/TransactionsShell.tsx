'use client'

import { GlassCard, Badge, EmptyState, Button, SkeletonTable } from '@/components/ui'
import { useModalStore, useSimulationStore, useUIStore } from '@/store'
import { showInfoToast } from '@/store/toast.store'
import { useActivePortfolioData } from '@/features/portfolio/useActivePortfolioData'
import { formatCurrency, formatNumber, formatDate, cn } from '@/lib/utils'
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Trash2,
  PackagePlus,
} from 'lucide-react'

export function TransactionsShell() {
  const { assets, transactions, hasHydrated } = useActivePortfolioData()
  const currency = useUIStore((s) => s.currency)
  const removeTransaction = useSimulationStore((s) => s.removeTransaction)
  const openModal = useModalStore((s) => s.openModal)

  if (!hasHydrated) {
    return <SkeletonTable rows={6} />
  }

  if (assets.length === 0) {
    return (
      <EmptyState
        icon={PackagePlus}
        title="Noch keine Assets"
        description="Lege zuerst ein Asset an — danach kannst du Käufe und Verkäufe als Transaktionen erfassen."
        action={{ label: 'Asset hinzufügen', onClick: () => openModal('add-asset') }}
      />
    )
  }

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
  )

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={ArrowLeftRight}
        title="Noch keine Transaktionen"
        description="Erfasse deinen ersten Kauf oder Verkauf — Bestand und Durchschnittspreis werden automatisch berechnet."
        action={{ label: 'Transaktion erfassen', onClick: () => openModal('add-transaction') }}
      />
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <GlassCard padding="none" className="overflow-x-auto">
        <div className="flex items-center gap-4 px-5 py-3 border-b border-border min-w-[600px]">
          <div className="w-9 shrink-0" />
          <p className="flex-1 text-data-xs font-medium text-ink-faint uppercase tracking-wide">
            Asset
          </p>
          <p className="text-data-xs font-medium text-ink-faint uppercase tracking-wide hidden sm:block w-16">
            Type
          </p>
          <p className="text-data-xs font-medium text-ink-faint uppercase tracking-wide hidden md:block text-right w-24">
            Quantity
          </p>
          <p className="text-data-xs font-medium text-ink-faint uppercase tracking-wide hidden md:block text-right w-24">
            Price
          </p>
          <p className="text-data-xs font-medium text-ink-faint uppercase tracking-wide text-right w-28">
            Amount
          </p>
          <p className="text-data-xs font-medium text-ink-faint uppercase tracking-wide text-right hidden sm:block w-24">
            Date
          </p>
          <div className="w-9 shrink-0" />
        </div>

        <div className="divide-y divide-border min-w-[600px]">
          {sorted.map((tx) => {
            const asset = assets.find((a) => a.id === tx.assetId)
            const isBuy = tx.type === 'buy'
            const total = tx.quantity * tx.price

            return (
              <div
                key={tx.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-raised transition-colors duration-150 group"
              >
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    isBuy ? 'bg-signal/10 text-signal' : 'bg-gain/10 text-gain'
                  )}
                >
                  {isBuy ? (
                    <ArrowDownLeft size={15} strokeWidth={2} />
                  ) : (
                    <ArrowUpRight size={15} strokeWidth={2} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-data-sm font-semibold text-ink truncate">
                    {asset?.ticker ?? '—'}
                  </p>
                  <p className="text-data-xs text-ink-muted truncate">
                    {asset?.name ?? 'Unknown asset'}
                    {tx.note && <span className="text-ink-faint"> · {tx.note}</span>}
                  </p>
                </div>

                <div className="hidden sm:block w-16">
                  <Badge variant={isBuy ? 'signal' : 'gain'} size="sm">
                    {isBuy ? 'Buy' : 'Sell'}
                  </Badge>
                </div>

                <div className="hidden md:block text-right w-24">
                  <p className="font-mono text-data-sm text-ink-muted">
                    {formatNumber(tx.quantity, 4)}
                  </p>
                </div>

                <div className="hidden md:block text-right w-24">
                  <p className="font-mono text-data-sm text-ink-muted">
                    {formatCurrency(tx.price, currency)}
                  </p>
                </div>

                <div className="text-right w-28">
                  <p
                    className={cn(
                      'font-mono text-data-sm font-medium',
                      isBuy ? 'text-ink' : 'text-gain'
                    )}
                  >
                    {isBuy ? '-' : '+'}
                    {formatCurrency(total, currency)}
                  </p>

                  {tx.fee > 0 && (
                    <p className="font-mono text-data-xs text-ink-faint">
                      Fee {formatCurrency(tx.fee, currency)}
                    </p>
                  )}
                </div>

                <div className="hidden sm:block text-right w-24">
                  <p className="font-mono text-data-xs text-ink-muted">
                    {formatDate(tx.executedAt, 'short')}
                  </p>
                </div>

                <div className="w-9 shrink-0 flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      removeTransaction(tx.id)
                      showInfoToast(
                        'Transaktion gelöscht',
                        `${isBuy ? 'Kauf' : 'Verkauf'} von ${asset?.ticker ?? 'Asset'} entfernt.`
                      )
                    }}
                    title="Transaktion löschen"
                    className="opacity-0 group-hover:opacity-100 hover:text-loss"
                  >
                    <Trash2 size={14} strokeWidth={2} />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </GlassCard>
    </div>
  )
}
