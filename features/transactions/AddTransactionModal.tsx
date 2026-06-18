'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Modal, Input, Select, Button, SegmentedControl, EmptyState } from '@/components/ui'
import { useModalStore, useSimulationStore, useUIStore } from '@/store'
import { useActivePortfolioData } from '@/features/portfolio/useActivePortfolioData'
import { computeAssetPosition } from '@/lib/calculations'
import { showSuccessToast } from '@/store/toast.store'
import { formatCurrency, formatNumber, toDateInputValue } from '@/lib/utils'
import { ASSET_CLASS_META } from '@/lib/constants'
import type { SimTransactionType } from '@/types/simulation'
import { PackagePlus } from 'lucide-react'

function currentTimeInputValue() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function dateTimeToIso(date: string, time: string) {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)

  return new Date(
    year,
    (month ?? 1) - 1,
    day ?? 1,
    hour ?? 0,
    minute ?? 0,
    0
  ).toISOString()
}

export function AddTransactionModal() {
  const activeModal = useModalStore((s) => s.activeModal)
  const context = useModalStore((s) => s.context)
  const closeModal = useModalStore((s) => s.closeModal)
  const openModal = useModalStore((s) => s.openModal)

  const currency = useUIStore((s) => s.currency)

  const { assets, transactions } = useActivePortfolioData()
  const addTransaction = useSimulationStore((s) => s.addTransaction)

  const isOpen = activeModal === 'add-transaction'

  const [assetId, setAssetId] = useState('')
  const [type, setType] = useState<SimTransactionType>('buy')
  const [amount, setAmount] = useState('')
  const [quantity, setQuantity] = useState('')
  const [fee, setFee] = useState('0')
  const [date, setDate] = useState(toDateInputValue())
  const [time, setTime] = useState(currentTimeInputValue())
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const initialAssetId = context.assetId ?? assets[0]?.id ?? ''

    setAssetId(initialAssetId)
    setType(context.type ?? 'buy')
    setAmount('')
    setQuantity('')
    setFee('0')
    setDate(toDateInputValue())
    setTime(currentTimeInputValue())
    setNote('')
    setError(null)
  }, [isOpen, context.assetId, context.type, assets])

  const selectedAsset = assets.find((a) => a.id === assetId)

  const position = useMemo(() => {
    if (!selectedAsset) return null
    return computeAssetPosition(selectedAsset, transactions)
  }, [selectedAsset, transactions])

  const amountNum = parseFloat(amount) || 0
  const quantityNum = parseFloat(quantity) || 0
  const feeNum = parseFloat(fee) || 0

  const effectiveAmount =
    type === 'buy'
      ? Math.max(amountNum - feeNum, 0)
      : amountNum

  const calculatedPrice =
    quantityNum > 0 ? effectiveAmount / quantityNum : 0

  const netAmount =
    type === 'buy'
      ? effectiveAmount + feeNum
      : effectiveAmount - feeNum

  function handleClose() {
    closeModal()
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!assetId) {
      setError('Bitte wähle ein Asset.')
      return
    }

    if (amountNum <= 0) {
      setError(type === 'buy' ? 'Investierter Betrag muss größer als 0 sein.' : 'Verkaufswert muss größer als 0 sein.')
      return
    }

    if (quantityNum <= 0) {
      setError(type === 'buy' ? 'Erhaltene Menge muss größer als 0 sein.' : 'Verkaufte Menge muss größer als 0 sein.')
      return
    }

    if (calculatedPrice <= 0) {
      setError('Der berechnete Preis muss größer als 0 sein.')
      return
    }

    if (type === 'sell' && position?.hasPosition && quantityNum > position.quantity) {
      setError(`Du kannst maximal ${formatNumber(position.quantity, 8)} ${selectedAsset?.ticker} verkaufen.`)
      return
    }

    const result = addTransaction({
      assetId,
      type,
      quantity: quantityNum,
      price: calculatedPrice,
      fee: feeNum,
      executedAt: dateTimeToIso(date, time),
      note: note.trim() || undefined,
    })

    if (!result.success) {
      setError(result.error)
      return
    }

    showSuccessToast(
      type === 'buy' ? 'Kauf erfasst' : 'Verkauf erfasst',
      `${formatNumber(quantityNum, 8)} ${selectedAsset?.ticker ?? ''} · ${formatCurrency(netAmount, currency)}`
    )

    handleClose()
  }

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
      description="Gib Betrag, erhaltene Menge, Datum und Uhrzeit ein — der Kurs wird automatisch berechnet."
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
                  {formatNumber(position.quantity, 8)} @ Ø {formatCurrency(position.avgCostBasis, currency)}
                </p>
              ) : (
                <p className="text-data-sm text-ink-faint">Keine Position</p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={type === 'buy' ? 'Investierter Betrag' : 'Verkaufswert'}
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            placeholder="0.00"
            prefix={currency === 'EUR' ? '€' : '$'}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <Input
            label={type === 'buy' ? 'Erhaltene Menge' : 'Verkaufte Menge'}
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            placeholder="0.00000000"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            hint={
              type === 'sell' && position?.hasPosition
                ? `Verfügbar: ${formatNumber(position.quantity, 8)}`
                : undefined
            }
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
            label="Uhrzeit"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        <Input
          label="Gebühr"
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          placeholder="0.00"
          prefix={currency === 'EUR' ? '€' : '$'}
          value={fee}
          onChange={(e) => setFee(e.target.value)}
        />

        <Input
          label="Notiz (optional)"
          placeholder="z. B. Kraken Einzahlung"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={120}
        />

        <div className="rounded-lg bg-surface px-3 py-3 border border-border space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-data-xs text-ink-muted uppercase tracking-wide">
              Berechneter Kurs
            </p>
            <p className="font-mono text-data-sm text-ink">
              {calculatedPrice > 0 ? formatCurrency(calculatedPrice, currency) : '—'}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-data-xs text-ink-muted uppercase tracking-wide">
              Menge
            </p>
            <p className="font-mono text-data-sm text-ink">
              {formatNumber(quantityNum, 8)} {selectedAsset?.ticker ?? ''}
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-2">
            <div>
              <p className="text-data-xs text-ink-muted uppercase tracking-wide">
                {type === 'buy' ? 'Gesamtkosten' : 'Erlös netto'}
              </p>
              {feeNum > 0 && (
                <p className="text-data-xs text-ink-faint mt-0.5">
                  Gebühr: {formatCurrency(feeNum, currency)}
                </p>
              )}
            </div>

            <p className="font-mono text-data-xl font-semibold text-ink">
              {formatCurrency(netAmount, currency)}
            </p>
          </div>
        </div>

        <p className="text-data-xs text-ink-faint">
          Ohne externe Kurs-API berechnet die App den Kurs aus Betrag ÷ Menge. Das funktioniert für Krypto, Aktien, ETFs, Metalle und Cash.
        </p>

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
