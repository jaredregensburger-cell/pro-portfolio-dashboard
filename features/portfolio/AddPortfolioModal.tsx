'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Modal, Input, Select, Button } from '@/components/ui'
import { useModalStore, useSimulationStore } from '@/store'
import { showSuccessToast } from '@/store/toast.store'
import { CURRENCIES } from '@/lib/constants'

const ICON_OPTIONS = ['💼', '📈', '🚀', '🛡️', '💎', '🏦', '🌱', '⚡']

const initialState = {
  name: '',
  icon: ICON_OPTIONS[0],
  currency: 'USD',
}

export function AddPortfolioModal() {
  const activeModal = useModalStore((s) => s.activeModal)
  const closeModal = useModalStore((s) => s.closeModal)
  const addPortfolio = useSimulationStore((s) => s.addPortfolio)

  const isOpen = activeModal === 'add-portfolio'

  const [form, setForm] = useState(initialState)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setForm(initialState)
      setError(null)
    }
  }, [isOpen])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const result = addPortfolio({
      name: form.name,
      icon: form.icon,
      currency: form.currency,
    })

    if (!result.success) {
      setError(result.error)
      return
    }

    showSuccessToast('Portfolio angelegt', `${result.portfolio.icon} ${result.portfolio.name}`)
    closeModal()
  }

  return (
    <Modal
      open={isOpen}
      onClose={closeModal}
      title="Neues Portfolio"
      description="Lege ein separates Portfolio an — z. B. für eine andere Strategie oder Anlageklasse. Jedes Portfolio hat eigene Assets und Transaktionen."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-data-xs font-medium text-ink-muted uppercase tracking-wide mb-1.5">
            Symbol
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {ICON_OPTIONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setForm((f) => ({ ...f, icon }))}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-data-lg border transition-all duration-150 ${
                  form.icon === icon
                    ? 'border-signal bg-signal/10'
                    : 'border-border hover:border-border-strong'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Name"
          placeholder="z. B. Krypto-Strategie, Rente, Spielgeld"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          maxLength={40}
          autoFocus
          required
        />

        <Select
          label="Basiswährung"
          value={form.currency}
          onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
          options={CURRENCIES.map((c) => ({ label: `${c.symbol} ${c.value}`, value: c.value }))}
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
            Portfolio anlegen
          </Button>
        </div>
      </form>
    </Modal>
  )
}
