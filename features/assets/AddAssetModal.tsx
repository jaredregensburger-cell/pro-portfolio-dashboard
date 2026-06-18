'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Search, Zap, ChevronRight } from 'lucide-react'
import { Modal, Input, Select, Button } from '@/components/ui'
import { useModalStore, useSimulationStore, useUIStore } from '@/store'
import { ASSET_CLASS_OPTIONS } from '@/lib/constants'
import { cn, formatCurrency, formatNumber } from '@/lib/utils'
import { TOP_STOCKS } from './topStocks'
import { TOP_CRYPTO } from './topCrypto'
import type { AssetClass } from '@/types'
import type { GlobalAsset } from './assetTypes'

type Tab = 'stocks' | 'crypto' | 'manual'

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'stocks', label: 'Stocks', emoji: '📊' },
  { id: 'crypto', label: 'Crypto', emoji: '🪙' },
  { id: 'manual', label: 'Manual', emoji: '✏️' },
]

const initialManualState = {
  ticker: '',
  name: '',
  assetClass: 'stock' as AssetClass,
}

function getPrefix(currency: string) {
  if (currency === 'EUR') return '€'
  if (currency === 'GBP') return '£'
  if (currency === 'CHF') return 'Fr'
  if (currency === 'JPY') return '¥'
  return '$'
}

function AssetPickRow({
  asset,
  onSelect,
}: {
  asset: GlobalAsset
  onSelect: (asset: GlobalAsset) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(asset)}
      className={cn(
        'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg',
        'bg-surface-raised hover:bg-surface-overlay border border-transparent',
        'hover:border-border transition-all duration-150 group text-left'
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-surface-elevated border border-border text-data-xs font-bold text-signal font-mono">
          {asset.symbol.length > 4 ? asset.symbol.slice(0, 3) : asset.symbol}
        </span>

        <div className="min-w-0">
          <p className="text-data-sm font-medium text-ink truncate">{asset.name}</p>
          <p className="text-data-xs text-ink-faint font-mono">
            {asset.symbol}
          </p>
        </div>
      </div>

      <ChevronRight
        size={14}
        strokeWidth={2}
        className="shrink-0 text-ink-faint group-hover:text-signal transition-colors duration-150"
      />
    </button>
  )
}

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

export function AddAssetModal() {
  const activeModal = useModalStore((s) => s.activeModal)
  const closeModal = useModalStore((s) => s.closeModal)
  const addAsset = useSimulationStore((s) => s.addAsset)
  const displayCurrency = useUIStore((s) => s.currency)

  const isOpen = activeModal === 'add-asset'

  const [tab, setTab] = useState<Tab>('stocks')
  const [search, setSearch] = useState('')
  const [manualForm, setManualForm] = useState(initialManualState)
  const [selectedCatalogAsset, setSelectedCatalogAsset] = useState<GlobalAsset | null>(null)

  const [ownedQuantity, setOwnedQuantity] = useState('')
  const [ownedValue, setOwnedValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    setTab('stocks')
    setSearch('')
    setManualForm(initialManualState)
    setSelectedCatalogAsset(null)
    setOwnedQuantity('')
    setOwnedValue('')
    setError(null)
  }, [isOpen])

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

  const currentList = tab === 'stocks' ? filteredStocks : filteredCrypto

  const ownedQuantityNum = parseFloat(ownedQuantity) || 0
  const ownedValueNum = parseFloat(ownedValue) || 0

  const calculatedPrice =
    ownedQuantityNum > 0 && ownedValueNum > 0
      ? ownedValueNum / ownedQuantityNum
      : 0

  function submitAsset(input: {
    ticker: string
    name: string
    assetClass: AssetClass
  }) {
    setError(null)

    if ((ownedQuantityNum > 0 && ownedValueNum <= 0) || (ownedValueNum > 0 && ownedQuantityNum <= 0)) {
      setError('Bitte trage Menge und aktuellen Wert ein — oder lasse beide Felder leer.')
      return
    }

    const result = addAsset({
      ticker: input.ticker,
      name: input.name,
      assetClass: input.assetClass,
      currency: displayCurrency,
      initialQuantity: ownedQuantityNum,
      initialValue: ownedValueNum,
      initialFee: 0,
      initialNote:
        ownedQuantityNum > 0 && ownedValueNum > 0
          ? 'START_SNAPSHOT'
          : undefined,
    })

    if (!result.success) {
      setError(result.error)
      return
    }

    closeModal()
  }

  function handleCatalogSubmit(e: FormEvent) {
    e.preventDefault()

    if (!selectedCatalogAsset) {
      setError('Bitte wähle zuerst ein Asset aus.')
      return
    }

    submitAsset({
      ticker: selectedCatalogAsset.symbol,
      name: selectedCatalogAsset.name,
      assetClass: selectedCatalogAsset.type as AssetClass,
    })
  }

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault()

    submitAsset({
      ticker: manualForm.ticker,
      name: manualForm.name,
      assetClass: manualForm.assetClass,
    })
  }

  const activeCurrency = displayCurrency
  const prefix = getPrefix(activeCurrency)

  return (
    <Modal
      open={isOpen}
      onClose={closeModal}
      title="Asset hinzufügen"
      description="Wähle ein Asset aus und trage ein, wie viel du aktuell besitzt."
      maxWidth="md"
    >
      <div className="flex gap-1 p-1 rounded-lg bg-surface-raised border border-border mb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id)
              setSearch('')
              setSelectedCatalogAsset(null)
              setError(null)
            }}
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

      {(tab === 'stocks' || tab === 'crypto') && (
        <form onSubmit={handleCatalogSubmit} className="space-y-4">
          {!selectedCatalogAsset ? (
            <>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={tab === 'stocks' ? 'AAPL, Apple…' : 'BTC, Bitcoin…'}
              />

              <div className="space-y-1 max-h-80 overflow-y-auto pr-0.5">
                {currentList.length === 0 ? (
                  <div className="py-8 text-center text-data-sm text-ink-faint">
                    Keine Ergebnisse für „{search}"
                  </div>
                ) : (
                  currentList.map((asset) => (
                    <AssetPickRow
                      key={asset.id}
                      asset={asset}
                      onSelect={(a) => setSelectedCatalogAsset(a)}
                    />
                  ))
                )}
              </div>

              {!search && (
                <p className="flex items-center gap-1.5 text-data-xs text-ink-faint pt-1">
                  <Zap size={11} strokeWidth={2.5} className="text-amber-400" />
                  Wähle ein Asset aus und trage danach deinen aktuellen Bestand in {displayCurrency} ein.
                </p>
              )}
            </>
          ) : (
            <>
              <div className="rounded-lg border border-border bg-surface-raised px-3 py-3">
                <p className="text-data-sm font-semibold text-ink">
                  {selectedCatalogAsset.name}
                </p>
                <p className="text-data-xs text-ink-faint font-mono">
                  {selectedCatalogAsset.symbol} · Eingabe in {displayCurrency}
                </p>

                <button
                  type="button"
                  onClick={() => setSelectedCatalogAsset(null)}
                  className="mt-2 text-data-xs text-signal hover:text-signal-dim"
                >
                  Anderes Asset wählen
                </button>
              </div>

              <OwnedPositionFields
                quantity={ownedQuantity}
                value={ownedValue}
                onQuantityChange={setOwnedQuantity}
                onValueChange={setOwnedValue}
                currency={activeCurrency}
                prefix={prefix}
                calculatedPrice={calculatedPrice}
                ticker={selectedCatalogAsset.symbol}
              />

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
                  Asset hinzufügen
                </Button>
              </div>
            </>
          )}
        </form>
      )}

      {tab === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <p className="text-data-sm text-ink-muted">
            Gib das Asset manuell ein. Alle Werte werden in {displayCurrency} gespeichert.
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

          <Select
            label="Typ"
            value={manualForm.assetClass}
            onChange={(e) =>
              setManualForm((f) => ({ ...f, assetClass: e.target.value as AssetClass }))
            }
            options={ASSET_CLASS_OPTIONS}
          />

          <OwnedPositionFields
            quantity={ownedQuantity}
            value={ownedValue}
            onQuantityChange={setOwnedQuantity}
            onValueChange={setOwnedValue}
            currency={activeCurrency}
            prefix={prefix}
            calculatedPrice={calculatedPrice}
            ticker={manualForm.ticker || 'Asset'}
          />

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

function OwnedPositionFields({
  quantity,
  value,
  onQuantityChange,
  onValueChange,
  currency,
  prefix,
  calculatedPrice,
  ticker,
}: {
  quantity: string
  value: string
  onQuantityChange: (value: string) => void
  onValueChange: (value: string) => void
  currency: string
  prefix: string
  calculatedPrice: number
  ticker: string
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface/60 p-3">
      <div>
        <p className="text-data-sm font-semibold text-ink">
          Im Besitz
        </p>
        <p className="text-data-xs text-ink-faint mt-0.5">
          Trage ein, wie viel du aktuell besitzt und wie viel es aktuell wert ist. Die Rendite startet bei 0,00 %.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label={`Im Besitz (${ticker})`}
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          placeholder="0.00000000"
          value={quantity}
          onChange={(e) => onQuantityChange(e.target.value)}
        />

        <Input
          label={`Aktueller Wert (${currency})`}
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          placeholder="0.00"
          prefix={prefix}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2">
        <p className="text-data-xs text-ink-muted uppercase tracking-wide">
          Startkurs
        </p>
        <p className="font-mono text-data-sm text-ink">
          {calculatedPrice > 0
            ? `${formatCurrency(calculatedPrice, currency)} / ${ticker}`
            : '—'}
        </p>
      </div>

      {quantity && value && (
        <p className="text-data-xs text-ink-faint">
          Start: {formatNumber(parseFloat(quantity) || 0, 8)} {ticker} mit einem Wert von{' '}
          {formatCurrency(parseFloat(value) || 0, currency)}. Rendite startet bei 0,00 %.
        </p>
      )}
    </div>
  )
}
