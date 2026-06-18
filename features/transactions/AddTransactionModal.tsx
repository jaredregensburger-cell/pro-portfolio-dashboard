'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Modal, Input, Select, Button, SegmentedControl, EmptyState } from '@/components/ui'
import { useModalStore, useSimulationStore } from '@/store'
import { useActivePortfolioData } from '@/features/portfolio/useActivePortfolioData'
import { useLiveMarketDataContext } from '@/features/portfolio/LiveMarketDataProvider'
import { computeAssetPosition } from '@/lib/calculations'
import { showSuccessToast } from '@/store/toast.store'
import { formatCurrency, formatNumber, toDateInputValue, fromDateInputValue } from '@/lib/utils'
import { ASSET_CLASS_META } from '@/lib/constants'
import type { SimTransactionType } from '@/types/simulation'
import { PackagePlus } from 'lucide-react'

export function AddTransactionModal() {
  const activeModal = useModalStore((s) => s.activeModal)
  const context = useModalStore((s) => s.context)
  const closeModal = useModalStore((s) => s.closeModal)
  const openModal = useModalStore((s) => s.openModal)

  const { assets, transactions } = useActivePortfolioData()
  const { livePrices } = useLiveMarketDataContext()
  const addTransaction = useSimulationStore((s) => s.addTransaction)

  const isOpen = activeModal === 'add-transaction'

  const [assetId, setAssetId] = useState('')
  const [type, setType] = useState<SimTransactionType>('buy')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [fee, setFee] = useState('0')
  const [date, setDate] = useState(toDateInputValue())
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Initialize / reset form whenever the modal opens
  useEffect(() => {
    if (!isOpen) return
    const initialAssetId = context.assetId ?? assets[0]?.id ?? ''
    setAssetId(initialAssetId)
    setType(context.type ?? 'buy')
    setQuantity('')
    // Prefill price with the latest live quote, if one exists, to save a lookup
    const initialAsset = assets.find((a) => a.id === initialAssetId)
    const liveQuote = initialAsset ? livePrices.get(initialAsset.ticker) : undefined
    setPrice(liveQuote !== undefined ? String(liveQuote) : '')
    setFee('0')
    setDate(toDateInputValue())
    setNote('')
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, context.assetId, context.type])

  const selectedAsset = assets.find((a) => a.id === assetId)

  const position = useMemo(() => {
    if (!selectedAsset) return null
    return computeAssetPosition(selectedAsset, transactions)
  }, [selectedAsset, transactions])

  const quantityNum = parseFloat(quantity) || 0
  const priceNum = parseFloat(price) || 0
  const feeNum = parseFloat(fee) || 0
  const grossAmount = quantityNum * priceNum
  const netAmount = type === 'buy' ? grossAmount + feeNum : grossAmount - feeNum

  function handleClose() {
    closeModal()
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!assetId) {
      setError('Bitte wähle ein Asset')
      return
    }
    if (quantityNum <= 0) {
      setError('Menge muss größer als 0 sein')
      return
    }
    if (priceNum <= 0) {
      setError('Preis muss größer als 0 sein')
      return
    }

    const result = addTransaction({
      assetId,
      type,
      quantity: quantityNum,
      price: priceNum,
      fee: feeNum,
      executedAt: fromDateInputValue(date),
      note: note.trim() || undefined,
    })

    if (!result.success) {
      setError(result.error)
      return
    }

    showSuccessToast(
      type === 'buy' ? 'Kauf erfasst' : 'Verkauf erfasst',
      `${formatNumber(quantityNum, 4)} ${selectedAsset?.ticker ?? ''} · ${formatCurrency(netAmount)}`
    )

    handleClose()
  }

  // ── Empty state: no assets exist yet ──
  if (isOpen && assets.length === 0) {
    return (
      <Modal open={isOpen} onClose={handleClose} title="Transaktion erfassen">
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
      title="Transaktion erfassen"
      description="Buy- und Sell-Transaktionen bestimmen Bestand und Durchschnittspreis automatisch."
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

        {/* Current position context */}
        {selectedAsset && position && (
          <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2.5 border border-border">
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
            <div className="text-right">
              {position.hasPosition ? (
                <p className="font-mono text-data-sm text-ink">
                  {formatNumber(position.quantity, 4)} @ Ø {formatCurrency(position.avgCostBasis)}
                </p>
              ) : (
                <p className="text-data-sm text-ink-faint">Keine Position</p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Menge"
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            placeholder="0.00"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            hint={
              type === 'sell' && position?.hasPosition
                ? `Verfügbar: ${formatNumber(position.quantity, 4)}`
                : undefined
            }
          />
          <Input
            label="Preis pro Einheit"
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            placeholder="0.00"
            prefix="$"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Datum"
            type="date"
            value={date}
            max={toDateInputValue()}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            label="Gebühr"
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            placeholder="0.00"
            prefix="$"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
          />
        </div>

        <Input
          label="Notiz (optional)"
          placeholder="z. B. Monatliches Sparplan-Buy"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={120}
        />

        {/* Live total preview */}
        <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-3 border border-border">
          <div>
            <p className="text-data-xs text-ink-muted uppercase tracking-wide">
              {type === 'buy' ? 'Gesamtkosten' : 'Erlös (netto)'}
            </p>
            {feeNum > 0 && (
              <p className="text-data-xs text-ink-faint mt-0.5">
                {formatCurrency(grossAmount)} {type === 'buy' ? '+' : '−'} {formatCurrency(feeNum)} Gebühr
              </p>
            )}
          </div>
          <p className="font-mono text-data-xl font-semibold text-ink">
            {formatCurrency(netAmount)}
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
          <Button type="submit" variant="primary">
            {type === 'buy' ? 'Kauf erfassen' : 'Verkauf erfassen'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
