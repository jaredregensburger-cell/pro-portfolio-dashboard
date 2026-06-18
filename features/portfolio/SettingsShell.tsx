'use client'

import { useState } from 'react'
import { GlassCard, Button, Badge, Input } from '@/components/ui'
import { useUIStore, useSimulationStore, useOnboardingStore, useModalStore } from '@/store'
import { showInfoToast } from '@/store/toast.store'
import { CURRENCIES } from '@/lib/constants'
import {
  User,
  Bell,
  Shield,
  Palette,
  Database,
  CreditCard,
  Sparkles,
  Trash2,
  Briefcase,
  Plus,
  Pencil,
  Check,
  X,
  RotateCcw,
} from 'lucide-react'

const SETTINGS_SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'portfolios', label: 'Portfolios', icon: Briefcase },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'data', label: 'Data & Integrations', icon: Database },
  { id: 'billing', label: 'Billing', icon: CreditCard },
]

const INVESTOR_TYPE_LABELS: Record<string, string> = {
  conservative: 'Konservativ',
  balanced: 'Ausgewogen',
  growth: 'Wachstum',
  aggressive: 'Aggressiv',
}

export function SettingsShell() {
  const currency = useUIStore((s) => s.currency)
  const setCurrency = useUIStore((s) => s.setCurrency)
  const displayName = useUIStore((s) => s.displayName)
  const email = useUIStore((s) => s.email)
  const setProfile = useUIStore((s) => s.setProfile)

  const assets = useSimulationStore((s) => s.assets)
  const transactions = useSimulationStore((s) => s.transactions)
  const loadDemoData = useSimulationStore((s) => s.loadDemoData)
  const resetSimulation = useSimulationStore((s) => s.resetSimulation)

  const portfolios = useSimulationStore((s) => s.portfolios)
  const activePortfolioId = useSimulationStore((s) => s.activePortfolioId)
  const setActivePortfolio = useSimulationStore((s) => s.setActivePortfolio)
  const renamePortfolio = useSimulationStore((s) => s.renamePortfolio)
  const removePortfolio = useSimulationStore((s) => s.removePortfolio)
  const openModal = useModalStore((s) => s.openModal)

  const profile = useOnboardingStore((s) => s.profile)
  const resetOnboarding = useOnboardingStore((s) => s.resetOnboarding)

  const [draftName, setDraftName] = useState(displayName)
  const [draftEmail, setDraftEmail] = useState(email)
  const [draftCurrency, setDraftCurrency] = useState(currency)

  const [confirmingReset, setConfirmingReset] = useState(false)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [editingPortfolioId, setEditingPortfolioId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  function handleSave() {
    setProfile({
      displayName: draftName.trim() || 'Investor',
      email: draftEmail.trim() || 'alex@folio.app',
    })

    setCurrency(draftCurrency)

    showInfoToast('Gespeichert', 'Deine Einstellungen wurden gespeichert.')
  }

  function handleReset() {
    if (!confirmingReset) {
      setConfirmingReset(true)
      return
    }

    resetSimulation()
    setConfirmingReset(false)
    showInfoToast('Daten zurückgesetzt', 'Alle lokalen Portfolio-Daten wurden entfernt.')
  }

  function handleDeletePortfolio(id: string, name: string) {
    if (confirmingDeleteId !== id) {
      setConfirmingDeleteId(id)
      return
    }

    removePortfolio(id)
    showInfoToast('Portfolio gelöscht', `"${name}" und alle zugehörigen Daten wurden entfernt.`)
    setConfirmingDeleteId(null)
  }

  function startEditing(id: string, currentName: string) {
    setEditingPortfolioId(id)
    setEditName(currentName)
  }

  function commitRename() {
    if (editingPortfolioId && editName.trim()) {
      renamePortfolio(editingPortfolioId, editName.trim())
      showInfoToast('Portfolio umbenannt', 'Der neue Name wurde gespeichert.')
    }

    setEditingPortfolioId(null)
  }

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <div className="sticky top-0 z-10 flex gap-1 flex-wrap overflow-x-auto scrollbar-none -mx-1 px-1 py-2 bg-void/80 backdrop-blur sm:overflow-visible sm:mx-0 sm:px-0">
        {SETTINGS_SECTIONS.map((s) => {
          const Icon = s.icon

          return (
            <button
              key={s.id}
              onClick={() => scrollToSection(s.id)}
              className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-data-sm text-ink-muted hover:text-ink hover:bg-surface-raised border border-transparent hover:border-border transition-all duration-150"
            >
              <Icon size={14} strokeWidth={1.75} />
              {s.label}
            </button>
          )
        })}
      </div>

      <div id="profile" className="scroll-mt-20">
        <GlassCard accent="signal">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-data-base font-semibold text-ink">Profile</h2>
              <p className="text-data-sm text-ink-muted mt-0.5">
                Manage your account information
              </p>
            </div>
            <Badge variant="signal" size="sm">Active</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-data-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Alex Investor"
                className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-data-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-signal focus:ring-1 focus:ring-signal transition-colors duration-150"
              />
            </div>

            <div>
              <label className="block text-data-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
                Email
              </label>
              <input
                type="email"
                value={draftEmail}
                onChange={(e) => setDraftEmail(e.target.value)}
                placeholder="alex@folio.app"
                className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-data-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-signal focus:ring-1 focus:ring-signal transition-colors duration-150"
              />
            </div>
          </div>

          {profile && (
            <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-2">
              <span className="text-data-xs text-ink-faint uppercase tracking-wide">
                Investor-Profil
              </span>
              <Badge variant="violet" size="sm">
                {INVESTOR_TYPE_LABELS[profile.investorType]}
              </Badge>
              <Badge variant="muted" size="sm">
                {profile.experienceLevel}
              </Badge>
              <button
                onClick={resetOnboarding}
                className="ml-auto flex items-center gap-1.5 text-data-xs text-ink-faint hover:text-ink transition-colors duration-150"
              >
                <RotateCcw size={12} strokeWidth={2} />
                Onboarding erneut starten
              </button>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-border flex justify-end">
            <Button variant="primary" size="sm" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </GlassCard>
      </div>

      <div id="portfolios" className="scroll-mt-20">
        <GlassCard padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h2 className="text-data-base font-semibold text-ink">Portfolios</h2>
              <p className="text-data-sm text-ink-muted mt-0.5">
                Verwalte deine Portfolios — wechsle, benenne um oder lege neue an
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => openModal('add-portfolio')}>
              <Plus size={14} strokeWidth={2.5} />
              Neu
            </Button>
          </div>

          <div className="divide-y divide-border">
            {portfolios.map((p) => {
              const isActive = p.id === activePortfolioId
              const isEditing = editingPortfolioId === p.id
              const assetCount = assets.filter((a) => a.portfolioId === p.id).length

              return (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="text-data-lg shrink-0">{p.icon}</span>

                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                        maxLength={40}
                        className="py-1.5"
                      />
                      <Button variant="ghost" size="icon" onClick={commitRename}>
                        <Check size={14} className="text-gain" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEditingPortfolioId(null)}>
                        <X size={14} className="text-loss" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-data-sm font-medium text-ink truncate">{p.name}</p>
                        <p className="text-data-xs text-ink-faint">
                          {assetCount} {assetCount === 1 ? 'Asset' : 'Assets'} · {draftCurrency}
                        </p>
                      </div>

                      {isActive && <Badge variant="signal" size="sm">Aktiv</Badge>}

                      <div className="flex items-center gap-1 shrink-0">
                        {!isActive && (
                          <Button variant="ghost" size="sm" onClick={() => setActivePortfolio(p.id)}>
                            Wechseln
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditing(p.id, p.name)}
                          title="Umbenennen"
                        >
                          <Pencil size={13} strokeWidth={2} />
                        </Button>

                        {portfolios.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePortfolio(p.id, p.name)}
                            onBlur={() => setConfirmingDeleteId(null)}
                            title={confirmingDeleteId === p.id ? 'Nochmal klicken zum Bestätigen' : 'Löschen'}
                            className={confirmingDeleteId === p.id ? 'text-loss' : 'hover:text-loss'}
                          >
                            <Trash2 size={13} strokeWidth={2} />
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </GlassCard>
      </div>

      <div id="notifications" className="scroll-mt-20">
        <GlassCard>
          <h2 className="text-data-base font-semibold text-ink mb-1">Notifications</h2>
          <p className="text-data-sm text-ink-muted">Notifications are not connected yet.</p>
        </GlassCard>
      </div>

      <div id="security" className="scroll-mt-20">
        <GlassCard>
          <h2 className="text-data-base font-semibold text-ink mb-1">Security</h2>
          <p className="text-data-sm text-ink-muted">
            Security settings are managed by your authentication provider.
          </p>
        </GlassCard>
      </div>

      <div id="appearance" className="scroll-mt-20">
        <GlassCard>
          <h2 className="text-data-base font-semibold text-ink mb-1">Preferences</h2>
          <p className="text-data-sm text-ink-muted mb-5">Display & currency settings</p>

          <div>
            <label className="block text-data-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
              Base Currency
            </label>
            <select
              value={draftCurrency}
              onChange={(e) => setDraftCurrency(e.target.value)}
              className="rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-data-sm text-ink focus:outline-none focus:border-signal focus:ring-1 focus:ring-signal transition-colors duration-150 cursor-pointer"
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.symbol} {c.label} ({c.value})
                </option>
              ))}
            </select>

            <p className="mt-2 text-data-xs text-ink-faint">
              Klicke auf “Save Changes”, um die Anzeige-Währung zu speichern.
            </p>
          </div>
        </GlassCard>
      </div>

      <div id="data" className="scroll-mt-20">
        <GlassCard accent="violet">
          <div className="flex items-start justify-between gap-4 mb-1">
            <div>
              <h2 className="text-data-base font-semibold text-ink">Simulation Data</h2>
              <p className="text-data-sm text-ink-muted mt-0.5">
                Your portfolio is stored locally in this browser. No backend required.
              </p>
            </div>
            <Sparkles size={16} className="text-violet shrink-0 mt-1" />
          </div>

          <div className="flex items-center gap-6 mt-4 mb-5 font-mono text-data-sm">
            <div>
              <p className="text-data-2xl font-semibold text-ink">{portfolios.length}</p>
              <p className="text-data-xs text-ink-faint uppercase tracking-wide">Portfolios</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-data-2xl font-semibold text-ink">{assets.length}</p>
              <p className="text-data-xs text-ink-faint uppercase tracking-wide">Assets</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-data-2xl font-semibold text-ink">{transactions.length}</p>
              <p className="text-data-xs text-ink-faint uppercase tracking-wide">Transactions</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
            <Button variant="secondary" size="sm" onClick={loadDemoData}>
              <Sparkles size={14} strokeWidth={1.75} />
              Load Demo Data
            </Button>

            <Button
              variant={confirmingReset ? 'danger' : 'outline'}
              size="sm"
              onClick={handleReset}
              onBlur={() => setConfirmingReset(false)}
            >
              <Trash2 size={14} strokeWidth={1.75} />
              {confirmingReset ? 'Click again to confirm' : 'Reset All Data'}
            </Button>
          </div>
        </GlassCard>
      </div>

      <div id="billing" className="scroll-mt-20">
        <GlassCard>
          <h2 className="text-data-base font-semibold text-ink mb-1">Billing</h2>
          <p className="text-data-sm text-ink-muted">Billing is not connected yet.</p>
        </GlassCard>
      </div>

      <GlassCard accent="loss">
        <h2 className="text-data-base font-semibold text-ink mb-1">Danger Zone</h2>
        <p className="text-data-sm text-ink-muted mb-4">
          Irreversible actions — proceed with caution
        </p>
        <Button variant="danger" size="sm">
          Delete Account
        </Button>
      </GlassCard>
    </div>
  )
}
