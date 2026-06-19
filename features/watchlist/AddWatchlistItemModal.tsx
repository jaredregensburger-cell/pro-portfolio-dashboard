'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Search, ChevronRight, Loader2 } from 'lucide-react'
import { Modal, Input, Select, Button } from '@/components/ui'
import { useModalStore, useUIStore } from '@/store'
import { showSuccessToast } from '@/store/toast.store'
import { ASSET_CLASS_OPTIONS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { AssetClass } from '@/types'
import type { GlobalAsset } from '@/features/assets/assetTypes'

const initialState = {
  ticker: '',
  name: '',
  assetClass: 'stock' as AssetClass,
}

function toDbAssetClass(assetClass: AssetClass) {
  if (assetClass === 'stock') return 'equity'
  if (assetClass === 'metal') return 'commodity'
  return assetClass
}

function AssetSuggestionRow({
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

export function AddWatchlistItemModal() {
  const activeModal = useModalStore((s) => s.activeModal)
  const context = useModalStore((s) => s.context)
  const closeModal = useModalStore((s) => s.closeModal)
  const currency = useUIStore((s) => s.currency)

  const isOpen = activeModal === 'add-watchlist-item'

  const [form, setForm] = useState(initialState)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<GlobalAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const ticker = context.ticker ?? ''
    const name = context.name ?? ''

    setForm({
      ticker,
      name,
      assetClass: 'stock',
    })

    setQuery(ticker || name)
    setSuggestions([])
    setLoading(false)
    setSaving(false)
    setError(null)
  }, [isOpen, context.ticker, context.name])

  useEffect(() => {
    if (!isOpen) return

    const search = query.trim()

    if (search.length < 2) {
      setSuggestions([])
      setLoading(false)
      return
    }

    let cancelled = false

    const timeout = window.setTimeout(async () => {
      try {
        setLoading(true)

        const params = new URLSearchParams({
          q: search,
        })

        const res = await fetch(`/api/search-assets?${params.toString()}`, {
          cache: 'no-store',
        })

        const data = await res.json()

        if (!cancelled) {
          setSuggestions(Array.isArray(data.assets) ? data.assets : [])
        }
      } catch {
        if (!cancelled) setSuggestions([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 350)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [isOpen, query])

  function handleSelect(asset: GlobalAsset) {
    setForm({
      ticker: asset.symbol.toUpperCase(),
      name: asset.name,
      assetClass: asset.type as AssetClass,
    })

    setQuery(`${asset.symbol} ${asset.name}`)
    setSuggestions([])
    setError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const ticker = form.ticker.trim().toUpperCase()
      const name = form.name.trim()

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

      const { error: insertError } = await supabase
        .from('watchlist_items')
        .insert({
          user_id: user.id,
          ticker,
          name,
          asset_class: toDbAssetClass(form.assetClass),
          currency: currency || 'EUR',
        })

      if (insertError) {
        if (insertError.code === '23505') {
          setError(`${ticker} ist bereits auf deiner Watchlist.`)
          return
        }

        throw insertError
      }

      showSuccessToast(`${ticker} beobachtet`, 'Zur Watchlist hinzugefügt.')
      window.dispatchEvent(new Event('folio:watchlist-changed'))
      closeModal()
    } catch (err) {
      console.error('Add watchlist item error:', err)
      setError(err instanceof Error ? err.message : 'Watchlist-Eintrag konnte nicht gespeichert werden.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={isOpen}
      onClose={closeModal}
      title="Zur Watchlist hinzufügen"
      description="Suche ein Asset und füge es deiner Watchlist hinzu."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-data-xs font-medium uppercase tracking-wide text-ink-muted">
            Asset suchen
          </label>

          <div className="relative">
            <Search
              size={14}
              strokeWidth={2}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
            />

            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setForm((f) => ({
                  ...f,
                  ticker: e.target.value.toUpperCase(),
                  name: '',
                }))
              }}
              placeholder="z. B. Tesla, Bitcoin, MSCI World, Gold"
              className={cn(
                'w-full pl-8 pr-3 py-2 rounded-lg border border-border',
                'bg-surface-raised text-data-sm text-ink placeholder:text-ink-faint',
                'focus:outline-none focus:ring-1 focus:ring-signal focus:border-signal',
                'transition-colors duration-150'
              )}
              autoFocus
            />
          </div>

          {query.trim().length >= 2 && (
            <div className="space-y-1 max-h-56 overflow-y-auto">
              {loading ? (
                <div className="py-4 flex items-center justify-center gap-2 text-data-sm text-ink-muted">
                  <Loader2 size={16} className="animate-spin" />
                  Suche läuft…
                </div>
              ) : suggestions.length === 0 ? (
                <div className="py-4 text-center text-data-sm text-ink-faint">
                  Keine Vorschläge gefunden.
                </div>
              ) : (
                suggestions.map((asset) => (
                  <AssetSuggestionRow
                    key={asset.id}
                    asset={asset}
                    onSelect={handleSelect}
                  />
                ))
              )}
            </div>
          )}
        </div>

        <Input
          label="Symbol"
          placeholder="z. B. TSLA, SOL, XAG"
          value={form.ticker}
          onChange={(e) => setForm((f) => ({ ...f, ticker: e.target.value.toUpperCase() }))}
          maxLength={16}
          required
        />

        <Input
          label="Name"
          placeholder="z. B. Tesla Inc."
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          maxLength={80}
          required
        />

        <Select
          label="Typ"
          value={form.assetClass}
          onChange={(e) => setForm((f) => ({ ...f, assetClass: e.target.value as AssetClass }))}
          options={ASSET_CLASS_OPTIONS}
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
            {saving ? 'Speichern…' : 'Beobachten'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
