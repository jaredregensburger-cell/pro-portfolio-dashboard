'use client'

import { Bell, Search, ChevronDown, Menu } from 'lucide-react'
import { cn, initials } from '@/lib/utils'
import { Button } from '@/components/ui'
import { LiveDataIndicator } from '@/features/portfolio/LiveDataIndicator'
import { useLiveMarketDataContext } from '@/features/portfolio/LiveMarketDataProvider'
import { useUIStore } from '@/store'

interface TopbarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

const MOCK_USER = {
  displayName: 'Alex Investor',
  email: 'alex@folio.app',
  avatarUrl: null,
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  const { status, lastUpdatedAt, staleTickers, refresh } = useLiveMarketDataContext()
  const openMobileSidebar = useUIStore((s) => s.openMobileSidebar)

  return (
    <header className="flex h-topbar items-center justify-between gap-3 px-4 sm:px-6 border-b border-border bg-surface/80 backdrop-blur-glass shrink-0">
      {/* Left: Hamburger (mobile) + Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={openMobileSidebar}
          aria-label="Menü öffnen"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors duration-150 lg:hidden"
        >
          <Menu size={18} strokeWidth={1.75} />
        </button>
        <div className="min-w-0">
          <h1 className="text-data-base sm:text-data-lg font-semibold text-ink truncate">{title}</h1>
          {subtitle && (
            <p className="text-data-sm text-ink-muted truncate hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right: Actions + Live Data + Search + User */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {actions}

        <LiveDataIndicator
          status={status}
          lastUpdatedAt={lastUpdatedAt}
          staleCount={staleTickers.size}
          onRefresh={refresh}
          className="hidden md:flex"
        />

        {/* Search — icon-only on mobile */}
        <button className="flex items-center gap-2 rounded-lg border border-border bg-surface-raised px-2.5 sm:px-3 py-1.5 text-data-sm text-ink-muted hover:text-ink hover:border-border-strong transition-all duration-150">
          <Search size={14} strokeWidth={1.75} />
          <span className="hidden sm:block">Search</span>
          <kbd className="hidden lg:flex items-center gap-0.5 font-mono text-data-xs text-ink-faint border border-border rounded px-1 py-0.5 ml-1">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative hidden sm:flex">
          <Bell size={17} strokeWidth={1.75} />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-signal border-2 border-surface" />
        </Button>

        {/* User */}
        <button className="flex items-center gap-2.5 rounded-lg px-1.5 sm:px-2 py-1.5 hover:bg-surface-raised transition-all duration-150">
          <div
            className={cn(
              'h-7 w-7 rounded-full flex items-center justify-center text-data-xs font-semibold shrink-0',
              'bg-signal-gradient text-white'
            )}
          >
            {MOCK_USER.avatarUrl ? (
              <img src={MOCK_USER.avatarUrl} alt="" className="h-7 w-7 rounded-full" />
            ) : (
              initials(MOCK_USER.displayName)
            )}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-data-sm font-medium text-ink leading-none">
              {MOCK_USER.displayName}
            </p>
          </div>
          <ChevronDown size={14} className="text-ink-faint hidden md:block" />
        </button>
      </div>
    </header>
  )
}
