'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, Search, ChevronDown, Menu, Settings, LogOut, User } from 'lucide-react'
import { cn, initials } from '@/lib/utils'
import { Button } from '@/components/ui'
import { LiveDataIndicator } from '@/features/portfolio/LiveDataIndicator'
import { useLiveMarketDataContext } from '@/features/portfolio/LiveMarketDataProvider'
import { useUIStore } from '@/store'
import { showInfoToast } from '@/store/toast.store'

interface TopbarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  const { status, lastUpdatedAt, staleTickers, refresh } = useLiveMarketDataContext()
  const openMobileSidebar = useUIStore((s) => s.openMobileSidebar)
  const displayName = useUIStore((s) => s.displayName)
  const email = useUIStore((s) => s.email)
  const [userOpen, setUserOpen] = useState(false)

  const firstName = displayName?.trim()?.split(' ')[0] || 'Investor'

  return (
    <header className="relative flex h-topbar items-center justify-between gap-3 px-4 sm:px-6 border-b border-border bg-surface/80 backdrop-blur-glass shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={openMobileSidebar}
          aria-label="Menü öffnen"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors duration-150 lg:hidden"
        >
          <Menu size={18} strokeWidth={1.75} />
        </button>

        <div className="min-w-0">
          <h1 className="text-data-base sm:text-data-lg font-semibold text-ink truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-data-sm text-ink-muted truncate hidden sm:block">
              {title === 'Dashboard' ? `Good morning, ${firstName}` : subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {actions}

        <LiveDataIndicator
          status={status}
          lastUpdatedAt={lastUpdatedAt}
          staleCount={staleTickers.size}
          onRefresh={refresh}
          className="hidden md:flex"
        />

        <button
          onClick={() => showInfoToast('Suche', 'Die Suche ist noch nicht verbunden.')}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface-raised px-2.5 sm:px-3 py-1.5 text-data-sm text-ink-muted hover:text-ink hover:border-border-strong transition-all duration-150"
        >
          <Search size={14} strokeWidth={1.75} />
          <span className="hidden sm:block">Search</span>
          <kbd className="hidden lg:flex items-center gap-0.5 font-mono text-data-xs text-ink-faint border border-border rounded px-1 py-0.5 ml-1">
            ⌘K
          </kbd>
        </button>

        <Button
          variant="ghost"
          size="icon"
          className="relative hidden sm:flex"
          onClick={() => showInfoToast('Benachrichtigungen', 'Keine neuen Benachrichtigungen.')}
        >
          <Bell size={17} strokeWidth={1.75} />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-signal border-2 border-surface" />
        </Button>

        <div className="relative">
          <button
            onClick={() => setUserOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-lg px-1.5 sm:px-2 py-1.5 hover:bg-surface-raised transition-all duration-150"
          >
            <div
              className={cn(
                'h-7 w-7 rounded-full flex items-center justify-center text-data-xs font-semibold shrink-0',
                'bg-signal-gradient text-white'
              )}
            >
              {initials(displayName || 'Investor')}
            </div>

            <div className="hidden md:block text-left">
              <p className="text-data-sm font-medium text-ink leading-none">
                {displayName || 'Investor'}
              </p>
            </div>

            <ChevronDown
              size={14}
              className={cn(
                'text-ink-faint hidden md:block transition-transform',
                userOpen && 'rotate-180'
              )}
            />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-surface-elevated shadow-glass-lg overflow-hidden z-50">
              <div className="px-3 py-3 border-b border-border">
                <p className="text-data-sm font-semibold text-ink truncate">
                  {displayName || 'Investor'}
                </p>
                <p className="text-data-xs text-ink-faint truncate">
                  {email || 'Keine E-Mail'}
                </p>
              </div>

              <Link
                href="/settings"
                onClick={() => setUserOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-data-sm text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors"
              >
                <Settings size={14} />
                Settings
              </Link>

              <button
                onClick={() => {
                  setUserOpen(false)
                  showInfoToast('Profil', 'Profilverwaltung ist noch nicht verbunden.')
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-data-sm text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors"
              >
                <User size={14} />
                Profile
              </button>

              <button
  onClick={() => {
    setUserOpen(false)
  }}
  className="flex w-full items-center gap-2 px-3 py-2.5 text-data-sm text-ink-muted hover:text-loss hover:bg-loss/10 transition-colors"
>
  <LogOut size={14} />
  Logout
</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
