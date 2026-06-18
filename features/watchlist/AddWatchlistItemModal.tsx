'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Modal, Input, Select, Button } from '@/components/ui'
import { useModalStore, useWatchlistStore } from '@/store'
import { showSuccessToast } from '@/store/toast.store'
import { ASSET_CLASS_OPTIONS } from '@/lib/constants'
import type { AssetClass } from '@/types'

const initialState = {
  ticker: '',
  name: '',
  assetClass: 'stock' as AssetClass,
}

export function AddWatchlistItemModal() {
  const activeModal = useModalStore((s) => s.activeModal)
  const context = useModalStore((s) => s.context)
  const closeModal = useModalStore((s) => s.closeModal)
  const addItem = useWatchlistStore((s) => s.addItem)

  const isOpen = activeModal === 'add-watchlist-item'

  const [form, setForm] = useState(initialState)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setForm({
        ticker: context.ticker ?? '',
        name: context.name ?? '',
        assetClass: 'stock',
      })
      setError(null)
    }
  }, [isOpen, context.ticker, context.name])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const result = addItem({
      ticker: form.ticker,
      name: form.name,
      assetClass: form.assetClass,
    })

    if (!result.success) {
      setError(result.error)
      return
    }

    showSuccessToast(`${result.item.ticker} beobachtet`, 'Zur Watchlist hinzugefügt.')
    closeModal()
  }

  return (
    <Modal
      open={isOpen}
      onClose={closeModal}
      title="Zur Watchlist hinzufügen"
      description="Beobachte ein Asset, ohne es zu kaufen. Sobald du eine Transaktion erfasst, wird daraus eine echte Position."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Symbol"
          placeholder="z. B. TSLA, SOL, XAG"
          value={form.ticker}
          onChange={(e) => setForm((f) => ({ ...f, ticker: e.target.value.toUpperCase() }))}
          maxLength={10}
          autoFocus
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
          <Button type="submit" variant="primary">
            Beobachten
          </Button>
        </div>
      </form>
    </Modal>
  )
}
