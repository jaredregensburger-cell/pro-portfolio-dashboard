'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Search, Zap, ChevronRight, Loader2 } from 'lucide-react'
import { Modal, Input, Select, Button } from '@/components/ui'
import { useModalStore, useUIStore } from '@/store'
import { ASSET_CLASS_OPTIONS } from '@/lib/constants'
import { cn, formatCurrency, formatNumber } from '@/lib/utils'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { AssetClass } from '@/types'
import type { GlobalAsset } from './assetTypes'

type Tab = 'stock' | 'crypto' | 'etf' | 'metal' | 'manual'

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'stock', label: 'Stocks', emoji: '📊' },
  { id: 'crypto', label: 'Crypto', emoji: '🪙' },
  { id: 'etf', label: 'ETFs', emoji: '📈' },
  { id: 'metal', label: 'Metals', emoji: '🥇' },
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

function toDbAssetClass(assetClass: AssetClass) {
  if (assetClass === 'stock') return 'equity'
  if (assetClass === 'metal') return 'commodity'
  return assetClass
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
            {asset.symbol} · {asset.type.toUpperCase()}
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
  const displayCurrency = useUIStore((s) => s.currency)

  const isOpen = activeModal === 'add-asset'

  const [tab, setTab] = useState<Tab>('stock')
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<GlobalAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [manualForm, setManualForm] = useState(initialManualState)
  const [selectedCatalogAsset, setSelectedCatalogAsset] = useState<GlobalAsset | null>(null)

  const [ownedQuantity, setOwnedQuantity] = useState('')
  const [ownedValue, setOwnedValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    setTab('stock')
    setSearch('')
    setResults([])
    setLoading(false)
    setSaving(false)
    setManualForm(initialManualState)
    setSelectedCatalogAsset(null)
    setOwnedQuantity('')
    setOwnedValue('')
    setError(null)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (tab === 'manual') return

    const query = search.trim()

    if (query.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    let cancelled = false

    const timeout = window.setTimeout(async () => {
      try {
        setLoading(true)

        const params = new URLSearchParams({
          q: query,
          type: tab,
        })

        const res = await fetch(`/api/search-assets?${params.toString()}`, {
          cache: 'no-store',
        })

        const data = await res.json()

        if (!cancelled) {
          setResults(Array.isArray(data.assets) ? data.assets : [])
        }
      } catch {
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 350)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [isOpen, search, tab])

  const ownedQuantityNum = parseFloat(ownedQuantity) || 0
  const ownedValueNum = parseFloat(ownedValue) || 0

  const calculatedPrice =
    ownedQuantityNum > 0 && ownedValueNum > 0
      ? ownedValueNum / ownedQuantityNum
      : 0

  async function getOrCreateDefaultPortfolio(userId: string) {
    const supabase = createSupabaseBrowserClient()

    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .maybeSingle()

    if (error) throw error
    if (portfolio) return portfolio

    const { data: created, error: createError } = await supabase
      .from('portfolios')
      .insert({
        user_id: userId,
        name: 'Mein Portfolio',
        description: 'Default portfolio',
        currency: displayCurrency || 'EUR',
        is_default: true,
      })
      .select('*')
      .single()

    if (createError) throw createError
    return created
  }

  async function submitAsset(input: {
    ticker: string
    name: string
    assetClass: AssetClass
  }) {
    setError(null)
    setSaving(true)

    try {
      if ((ownedQuantityNum > 0 && ownedValueNum <= 0) || (ownedValueNum > 0 && ownedQuantityNum <= 0)) {
        setError('Bitte trage Menge und aktuellen Wert ein — oder lasse beide Felder leer.')
        return
      }

      const ticker = input.ticker.trim().toUpperCase()
      const name = input.name.trim()

      if (!ticker) {
        setError('Symbol ist erforderlich.')
        return
      }

      if (!name) {
        setError('Name ist erforderlich.')
        return
      }

      const supabase = createSupabaseBrowserClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Du musst eingeloggt sein.')
        return
      }

      const portfolio = await getOrCreateDefaultPortfolio(user.id)

      const { data: existingAsset, error: existingError } = await supabase
        .from('assets')
        .select('id')
        .eq('portfolio_id', portfolio.id)
        .eq('ticker', ticker)
        .maybeSingle()

      if (existingError) throw existingError

      if (existingAsset) {
        setError(`${ticker} existiert bereits in diesem Portfolio.`)
        return
      }

      const price = calculatedPrice > 0 ? calculatedPrice : 0

      const { data: createdAsset, error: assetError } = await supabase
        .from('assets')
        .insert({
          portfolio_id: portfolio.id,
          ticker,
          name,
          asset_class: toDbAssetClass(input.assetClass),
          current_price: price,
          currency: displayCurrency || 'EUR',
        })
        .select('*')
        .single()

      if (assetError) throw assetError

      if (ownedQuantityNum > 0 && ownedValueNum > 0) {
        const { error: txError } = await supabase
          .from('transactions')
          .insert({
            portfolio_id: portfolio.id,
            asset_id: createdAsset.id,
            type: 'buy',
            status: 'completed',
            quantity: ownedQuantityNum,
            price,
            total_amount: ownedValueNum,
            fee: 0,
            currency: displayCurrency || 'EUR',
            note: 'Startbestand',
            executed_at: new Date().toISOString(),
          })

        if (txError) throw txError
      }

      window.dispatchEvent(new Event('folio:portfolio-changed'))
      closeModal()
    } catch (err) {
      console.error('Add asset error:', err)
      setError(err instanceof Error ? err.message : 'Asset konnte nicht gespeichert werden.')
    } finally {
      setSaving(false)
    }
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

  function getPlaceholder() {
    if (tab === 'stock') return 'Apple, Tesla, ASML, SAP…'
    if (tab === 'crypto') return 'Bitcoin, Ethereum, Solana…'
    if (tab === 'etf') return 'MSCI World, S&P 500, Vanguard…'
    if (tab === 'metal') return 'Gold, Silver, Platinum…'
    return 'Suchen…'
  }

  return (
    <Modal
      open={isOpen}
      onClose={closeModal}
      title="Asset hinzufügen"
      description="Suche Aktien, ETFs, Krypto oder Metalle und trage ein, wie viel du aktuell besitzt."
      maxWidth="md"
    >
      <div className="flex gap-1 p-1 rounded-lg bg-surface-raised border border-border mb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id)
              setSearch('')
              setResults([])
              setSelectedCatalogAsset(null)
              setError(null)
            }}
            className={cn(
              'flex-1 min-w-fit flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md',
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

      {tab !== 'manual' && (
        <form onSubmit={handleCatalogSubmit} className="space-y-4">
          {!selectedCatalogAsset ? (
            <>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={getPlaceholder()}
              />

              <div className="space-y-1 max-h-80 overflow-y-auto pr-0.5">
                {search.trim().length < 2 ? (
                  <div className="py-8 text-center text-data-sm text-ink-faint">
                    Gib mindestens 2 Zeichen ein, um über Twelve Data zu suchen.
                  </div>
                ) : loading ? (
                  <div className="py-8 flex items-center justify-center gap-2 text-data-sm text-ink-muted">
                    <Loader2 size={16} className="animate-spin" />
                    Suche läuft…
                  </div>
                ) : results.length === 0 ? (
                  <div className="py-8 text-center text-data-sm text-ink-faint">
                    Keine Ergebnisse für „{search}"
                  </div>
                ) : (
                  results.map((asset) => (
                    <AssetPickRow
                      key={asset.id}
                      asset={asset}
                      onSelect={(a) => setSelectedCatalogAsset(a)}
                    />
                  ))
                )}
              </div>

              <p className="flex items-center gap-1.5 text-data-xs text-ink-faint pt-1">
                <Zap size={11} strokeWidth={2.5} className="text-amber-400" />
                Werte werden in deiner gewählten Währung {displayCurrency} gespeichert.
              </p>
            </>
          ) : (
            <>
              <div className="rounded-lg border border-border bg-surface-raised px-3 py-3">
                <p className="text-data-sm font-semibold text-ink">
                  {selectedCatalogAsset.name}
                </p>
                <p className="text-data-xs text-ink-faint font-mono">
                  {selectedCatalogAsset.symbol} · {selectedCatalogAsset.type.toUpperCase()} · Eingabe in {displayCurrency}
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
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? 'Speichern…' : 'Asset hinzufügen'}
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
            maxLength={16}
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
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Speichern…' : 'Asset anlegen'}
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
