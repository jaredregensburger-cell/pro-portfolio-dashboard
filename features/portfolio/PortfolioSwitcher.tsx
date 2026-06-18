'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronsUpDown, Check, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSimulationStore, useModalStore, useUIStore } from '@/store'

interface PortfolioSwitcherProps {
  collapsed?: boolean
}

export function PortfolioSwitcher({ collapsed = false }: PortfolioSwitcherProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const portfolios = useSimulationStore((s) => s.portfolios)
  const activePortfolioId = useSimulationStore((s) => s.activePortfolioId)
  const setActivePortfolio = useSimulationStore((s) => s.setActivePortfolio)
  const openModal = useModalStore((s) => s.openModal)
  const currency = useUIStore((s) => s.currency)

  const active = portfolios.find((p) => p.id === activePortfolioId) ?? portfolios[0]

  useEffect(() => {
    if (!open) return

    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (!active) return null

  if (collapsed) {
    return (
      <button
        onClick={() => setOpen((o) => !o)}
        title={active.name}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-data-base hover:bg-surface-raised transition-colors duration-150"
      >
        {active.icon}
      </button>
    )
  }

  return (
    <div ref={containerRef} className="relative px-2 pb-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg border border-border bg-surface-raised px-2.5 py-2',
          'hover:border-border-strong transition-colors duration-150'
        )}
      >
        <span className="text-data-base">{active.icon}</span>

        <div className="flex-1 min-w-0 text-left">
          <p className="text-data-sm font-medium text-ink truncate leading-tight">
            {active.name}
          </p>
          <p className="text-data-xs text-ink-faint">{currency}</p>
        </div>

        <ChevronsUpDown size={14} className="text-ink-faint shrink-0" />
      </button>

      {open && (
        <div
          className={cn(
            'absolute left-2 right-2 top-full mt-1.5 z-50 rounded-lg border border-border bg-surface-elevated',
            'shadow-glass-lg py-1.5 animate-slide-up max-h-72 overflow-y-auto'
          )}
        >
          {portfolios.map((p) => {
            const isActive = p.id === active.id

            return (
              <button
                key={p.id}
                onClick={() => {
                  setActivePortfolio(p.id)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors duration-150',
                  isActive ? 'bg-signal/10' : 'hover:bg-surface-raised'
                )}
              >
                <span className="text-data-base">{p.icon}</span>

                <div className="flex-1 min-w-0">
                  <p className={cn('truncate text-data-sm font-medium', isActive ? 'text-signal' : 'text-ink')}>
                    {p.name}
                  </p>
                  <p className="text-data-xs text-ink-faint">{currency}</p>
                </div>

                {isActive && <Check size={14} className="text-signal shrink-0" />}
              </button>
            )
          })}

          <div className="border-t border-border mt-1.5 pt-1.5">
            <button
              onClick={() => {
                setOpen(false)
                openModal('add-portfolio')
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors duration-150"
            >
              <Plus size={14} className="shrink-0" />
              <span className="text-data-sm font-medium">Neues Portfolio</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
