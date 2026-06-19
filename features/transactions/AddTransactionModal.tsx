'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Modal, Input, Select, Button, SegmentedControl, EmptyState } from '@/components/ui'
import { useModalStore, useUIStore } from '@/store'
import { useActivePortfolioData } from '@/features/portfolio/useActivePortfolioData'
import { useLiveMarketDataContext } from '@/features/portfolio/LiveMarketDataProvider'
import { computeAssetPosition } from '@/lib/calculations'
import { showSuccessToast } from '@/store/toast.store'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { ASSET_CLASS_META } from '@/lib/constants'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { SimTransactionType } from '@/types/simulation'
import { PackagePlus } from 'lucide-react'

export function AddTransactionModal() {
  const activeModal = useModalStore((s) => s.activeModal)
  const context = useModalStore((s) => s.context)
  const closeModal = useModalStore((s) => s.closeModal)
  const openModal = useModalStore((s) => s.openModal)

  const currency = useUIStore((s) => s.currency)

  const { portfolioId, assets, transactions, reload } = useActivePortfolioData()
  const { livePrices } = useLiveMarketDataContext()

  const isOpen = activeModal === 'add-transaction'

  const [assetId, setAssetId] = useState('')
  const [type, setType] = useState<SimTransactionType>('buy')
  const [quantity, setQuantity] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const initialAssetId = context.assetId ?? assets[0]?.id ?? ''

    setAssetId(initialAssetId)
    setType(context.type ?? 'buy')
    setQuantity('')
    setSaving(false)
    setError(null)
  }, [isOpen, context.assetId, context.type, assets])

  const selectedAsset = assets.find((a) => a.id === assetId)

  const position = useMemo(() => {
    if (!selectedAsset) return null
    return computeAssetPosition(selectedAsset, transactions, livePrices)
  }, [selectedAsset, transactions, livePrices])

  const quantityNum = parseFloat(quantity) || 0

  const livePrice = selectedAsset ? livePrices.get(selectedAsset.ticker) : undefined

  const transactionPrice =
    livePrice && livePrice > 0
      ? livePrice
      : position?.currentPrice ?? 0

  const estimatedValue = quantityNum * transactionPrice

  function handleClose() {
    closeModal()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      if (!portfolioId) {
        setError('Kein Portfolio gefunden.')
        return
      }

      if (!assetId || !selectedAsset) {
        setError('Bitte wähle ein Asset.')
        return
      }

      if (quantityNum <= 0) {
        setError(
          type === 'buy'
            ? 'Dazugekaufte Menge muss größer als 0 sein.'
            : 'Verkaufte Menge muss größer als 0 sein.'
        )
        return
      }

      if (type === 'sell' && position?.hasPosition && quantityNum > position.quantity) {
        setError(`Du kannst maximal ${formatNumber(position.quantity, 8)} ${selectedAsset.ticker} verkaufen.`)
        return
      }

      if (transactionPrice <= 0) {
        setError('Für dieses Asset ist noch kein Kurs verfügbar.')
        return
      }

      const supabase = createSupabaseBrowserClient()

      const { error: insertError } = await supabase
        .from('transactions')
        .insert({
          portfolio_id: portfolioId,
          asset_id: assetId,
          type,
          status: 'completed',
          quantity: quantityNum,
          price: transactionPrice,
          total_amount: estimatedValue,
          fee: 0,
          currency,
          note: type === 'buy' ? 'Dazugekauft' : 'Verkauft',
          executed_at: new Date().toISOString(),
        })

      if (insertError) throw insertError

      showSuccessToast(
        type === 'buy' ? 'Kauf erfasst' : 'Verkauf erfasst',
        `${formatNumber(quantityNum, 8)} ${selectedAsset.ticker} · ${formatCurrency(estimatedValue, currency)}`
      )

      window.dispatchEvent(new Event('folio:portfolio-changed'))
      await reload()
      handleClose()
    } catch (err) {
      console.error('Add transaction error:', err)
      setError(err instanceof Error ? err.message : 'Transaktion konnte nicht gespeichert werden.')
    } finally {
      setSaving(false)
    }
  }

  if (isOpen && assets.length === 0) {
    return (
      <Modal open={isOpen} onClose={handleClose} title="Bestand ändern">
        <EmptyState
          icon={PackagePlus}
          title="Noch keine Assets"
          description="Lege zuerst ein Asset an — danach kannst du Käufe und Verkäufe erfassen."
          action={{
            label: 'Asset anlegen',
            onClick: () => openModal('add-asset'),
          }}
        />
      </Modal>
    )
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Bestand ändern"
      description="Trage nur ein, wie viel du dazugekauft oder verkauft hast."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Asset"
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
          options={assets.map((a) => ({ label: `${a.ticker} — ${a.name}`, value: a.id }))}
          autoFocus
        />

        <SegmentedControl
          label="Typ"
          value={type}
          onChange={setType}
          options={[
            { label: 'Buy', value: 'buy', activeClassName: 'bg-gain/10 text-gain border-gain/30' },
            { label: 'Sell', value: 'sell', activeClassName: 'bg-loss/10 text-loss border-loss/30' },
          ]}
        />

        {selectedAsset && position && (
          <div className="rounded-lg bg-surface px-3 py-3 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded-md text-data-xs font-mono font-medium"
                  style={{
                    backgroundColor: ASSET_CLASS_META[selectedAsset.assetClass].bgColor,
                    color: ASSET_CLASS_META[selectedAsset.assetClass].color,
                  }}
                >
                  {selectedAsset.ticker}
                </span>
                <span className="text-data-sm text-ink-muted">Aktueller Bestand</span>
              </div>

              <p className="font-mono text-data-sm text-ink">
                {formatNumber(position.quantity, 8)} {selectedAsset.ticker}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-data-xs text-ink-muted uppercase tracking-wide">
                Aktueller Kurs
              </span>
              <p className="font-mono text-data-sm text-ink">
                {transactionPrice > 0 ? formatCurrency(transactionPrice, currency) : '—'}
              </p>
            </div>
          </div>
        )}

        <Input
          label={type === 'buy' ? 'Dazugekaufte Menge' : 'Verkaufte Menge'}
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          placeholder="0.00000000"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          hint={
            type === 'sell' && position?.hasPosition
              ? `Verfügbar: ${formatNumber(position.quantity, 8)} ${selectedAsset?.ticker ?? ''}`
              : undefined
          }
        />

        <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-3 border border-border">
          <p className="text-data-xs text-ink-muted uppercase tracking-wide">
            Geschätzter Wert
          </p>
          <p className="font-mono text-data-xl font-semibold text-ink">
            {formatCurrency(estimatedValue, currency)}
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-loss/10 border border-loss/20 px-3 py-2.5 text-data-sm text-loss">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Abbrechen
          </Button>

          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Speichern…' : type === 'buy' ? 'Kauf erfassen' : 'Verkauf erfassen'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
