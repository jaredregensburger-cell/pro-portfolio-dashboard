'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Search, Zap, ChevronRight } from 'lucide-react'
import { Modal, Input, Select, Button } from '@/components/ui'
import { useModalStore, useSimulationStore } from '@/store'
import { ASSET_CLASS_OPTIONS, CURRENCIES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { TOP_STOCKS } from './topStocks'
import { TOP_CRYPTO } from './topCrypto'
import type { AssetClass } from '@/types'
import type { GlobalAsset } from './assetTypes'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'stocks' | 'crypto' | 'manual'

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'stocks', label: 'Stocks',  emoji: '📊' },
  { id: 'crypto', label: 'Crypto',  emoji: '🪙' },
  { id: 'manual', label: 'Manual',  emoji: '✏️'  },
]

const initialManualState = {
  ticker:     '',
  name:       '',
  assetClass: 'stock' as AssetClass,
  currency:   'USD',
}

// ─── Asset Quick-Pick Row ─────────────────────────────────────────────────────

function AssetPickRow({
  asset,
  onAdd,
}: {
  asset: GlobalAsset
  onAdd: (asset: GlobalAsset) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onAdd(asset)}
      className={cn(
        'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg',
        'bg-surface-raised hover:bg-surface-overlay border border-transparent',
        'hover:border-border transition-all duration-150 group text-left'
      )}
    >
      {/* Symbol badge */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-surface-elevated border border-border text-data-xs font-bold text-signal font-mono">
          {asset.symbol.length > 4 ? asset.symbol.slice(0, 3) : asset.symbol}
        </span>
        <div className="min-w-0">
          <p className="text-data-sm font-medium text-ink truncate">{asset.name}</p>
          <p className="text-data-xs text-ink-faint font-mono">{asset.symbol} · {asset.currency}</p>
        </div>
      </div>

      {/* Quick-add indicator */}
      <ChevronRight
        size={14}
        strokeWidth={2}
        className="shrink-0 text-ink-faint group-hover:text-signal transition-colors duration-150"
      />
    </button>
  )
}

// ─── Search Input ─────────────────────────────────────────────────────────────

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative">
      <Search
        size={14}
        strokeWidth={2}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Suchen…'}
        className={cn(
          'w-full pl-8 pr-3 py-2 rounded-lg border border-border',
          'bg-surface-raised text-data-sm text-ink placeholder:text-ink-faint',
          'focus:outline-none focus:ring-1 focus:ring-signal focus:border-signal',
          'transition-colors duration-150'
        )}
      />
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function AddAssetModal() {
  const activeModal = useModalStore((s) => s.activeModal)
  const closeModal  = useModalStore((s) => s.closeModal)
  const openModal   = useModalStore((s) => s.openModal)
  const addAsset    = useSimulationStore((s) => s.addAsset)

  const isOpen = activeModal === 'add-asset'

  const [tab,        setTab]        = useState<Tab>('stocks')
  const [search,     setSearch]     = useState('')
  const [manualForm, setManualForm] = useState(initialManualState)
  const [error,      setError]      = useState<string | null>(null)

  // Reset state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setTab('stocks')
      setSearch('')
      setManualForm(initialManualState)
      setError(null)
    }
  }, [isOpen])

  // ── Filter logic ────────────────────────────────────────────────────────────

  const query = search.trim().toLowerCase()

  const filteredStocks = TOP_STOCKS.filter(
    (a) =>
      !query ||
      a.symbol.toLowerCase().includes(query) ||
      a.name.toLowerCase().includes(query)
  )

  const filteredCrypto = TOP_CRYPTO.filter(
    (a) =>
      !query ||
      a.symbol.toLowerCase().includes(query) ||
      a.name.toLowerCase().includes(query)
  )

  // ── Quick-add from catalog ───────────────────────────────────────────────────

  function handleQuickAdd(asset: GlobalAsset) {
    setError(null)
    const result = addAsset({
      ticker:     asset.symbol,
      name:       asset.name,
      assetClass: asset.type as AssetClass,
      currency:   asset.currency,
    })

    if (!result.success) {
      setError(result.error)
      return
    }

    openModal('add-transaction', { assetId: result.asset.id, type: 'buy' })
  }

  // ── Manual submit ────────────────────────────────────────────────────────────

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const result = addAsset({
      ticker:     manualForm.ticker,
      name:       manualForm.name,
      assetClass: manualForm.assetClass,
      currency:   manualForm.currency,
    })

    if (!result.success) {
      setError(result.error)
      return
    }

    openModal('add-transaction', { assetId: result.asset.id, type: 'buy' })
  }

  const currentList = tab === 'stocks' ? filteredStocks : filteredCrypto

  return (
    <Modal
      open={isOpen}
      onClose={closeModal}
      title="Asset hinzufügen"
      maxWidth="md"
    >
      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 rounded-lg bg-surface-raised border border-border mb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setTab(t.id); setSearch(''); setError(null) }}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md',
              'text-data-sm font-medium transition-all duration-150',
              tab === t.id
                ? 'bg-surface-elevated text-ink shadow-sm border border-border'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            <span>{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Stocks / Crypto tabs ── */}
      {(tab === 'stocks' || tab === 'crypto') && (
        <div className="space-y-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={tab === 'stocks' ? 'AAPL, Apple…' : 'BTC, Bitcoin…'}
          />

          {/* List */}
          <div className="space-y-1 max-h-80 overflow-y-auto pr-0.5">
            {currentList.length === 0 ? (
              <div className="py-8 text-center text-data-sm text-ink-faint">
                Keine Ergebnisse für „{search}"
              </div>
            ) : (
              currentList.map((asset) => (
                <AssetPickRow key={asset.id} asset={asset} onAdd={handleQuickAdd} />
              ))
            )}
          </div>

          {/* Quick-add hint */}
          {!search && (
            <p className="flex items-center gap-1.5 text-data-xs text-ink-faint pt-1">
              <Zap size={11} strokeWidth={2.5} className="text-amber-400" />
              Klick = sofort hinzufügen &amp; direkt Transaktion erfassen
            </p>
          )}

          {error && (
            <div className="rounded-lg bg-loss/10 border border-loss/20 px-3 py-2.5 text-data-sm text-loss">
              {error}
            </div>
          )}
        </div>
      )}

      {/* ── Manual tab ── */}
      {tab === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <p className="text-data-sm text-ink-muted">
            Gib das Asset manuell ein — z.&nbsp;B. für exotische Aktien, ETFs oder physische Metalle.
          </p>

          <Input
            label="Symbol"
            placeholder="z. B. AAPL, BTC, XAU"
            value={manualForm.ticker}
            onChange={(e) =>
              setManualForm((f) => ({ ...f, ticker: e.target.value.toUpperCase() }))
            }
            maxLength={12}
            autoFocus
            required
          />

          <Input
            label="Name"
            placeholder="z. B. Apple Inc."
            value={manualForm.name}
            onChange={(e) => setManualForm((f) => ({ ...f, name: e.target.value }))}
            maxLength={80}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Typ"
              value={manualForm.assetClass}
              onChange={(e) =>
                setManualForm((f) => ({ ...f, assetClass: e.target.value as AssetClass }))
              }
              options={ASSET_CLASS_OPTIONS}
            />

            <Select
              label="Währung"
              value={manualForm.currency}
              onChange={(e) => setManualForm((f) => ({ ...f, currency: e.target.value }))}
              options={CURRENCIES.map((c) => ({ label: `${c.symbol} ${c.value}`, value: c.value }))}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-loss/10 border border-loss/20 px-3 py-2.5 text-data-sm text-loss">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Abbrechen
            </Button>
            <Button type="submit" variant="primary">
              Asset anlegen
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
