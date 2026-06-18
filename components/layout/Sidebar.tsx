'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  PieChart,
  TrendingUp,
  ArrowLeftRight,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  BarChart3,
  Star,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store'
import { PortfolioSwitcher } from '@/features/portfolio/PortfolioSwitcher'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Portfolio', href: '/portfolio', icon: PieChart },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Assets', href: '/assets', icon: TrendingUp },
  { label: 'Watchlist', href: '/watchlist', icon: Star },
  { label: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
]

const BOTTOM_ITEMS = [{ label: 'Settings', href: '/settings', icon: Settings }]

interface SidebarProps {
  /** True when rendered as the mobile slide-in drawer rather than the fixed desktop rail */
  variant?: 'desktop' | 'mobile'
}

export function Sidebar({ variant = 'desktop' }: SidebarProps) {
  const pathname = usePathname()
  const { sidebar, toggleSidebar, closeMobileSidebar } = useUIStore()
  const isCollapsed = variant === 'desktop' && sidebar === 'collapsed'
  const isMobile = variant === 'mobile'

  return (
    <aside
      className={cn(
        'h-screen flex flex-col border-r border-border bg-surface',
        isMobile
          ? 'w-72 shrink-0'
          : cn(
              'fixed left-0 top-0 z-40 transition-all duration-300 ease-in-out hidden lg:flex',
              isCollapsed ? 'w-16' : 'w-sidebar'
            )
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between gap-3 h-topbar px-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-signal-gradient">
            <Zap size={16} className="text-white" strokeWidth={2.5} />
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="animate-fade-in min-w-0">
              <p className="font-semibold text-ink text-sm leading-tight truncate">Folio</p>
              <p className="text-data-xs text-ink-faint truncate">Investor Dashboard</p>
            </div>
          )}
        </div>
        {isMobile && (
          <button
            onClick={closeMobileSidebar}
            aria-label="Menü schließen"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:text-ink hover:bg-surface-raised transition-colors duration-150"
          >
            <X size={16} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Portfolio Switcher */}
      <div className="pt-2 shrink-0">
        <PortfolioSwitcher collapsed={isCollapsed && !isMobile} />
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
  key={item.href}
  href={item.href as any}
              onClick={isMobile ? closeMobileSidebar : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5',
                'transition-all duration-150 group relative',
                isActive
                  ? 'bg-signal/10 text-signal border border-signal/20'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-raised border border-transparent'
              )}
            >
              <Icon
                size={18}
                strokeWidth={isActive ? 2.5 : 1.75}
                className={cn('shrink-0', isActive ? 'text-signal' : '')}
              />
              {(!isCollapsed || isMobile) && (
                <span
                  className={cn(
                    'text-data-sm font-medium animate-fade-in',
                    isActive ? 'text-signal' : ''
                  )}
                >
                  {item.label}
                </span>
              )}
              {/* Active indicator */}
              {isActive && (
                <span className="absolute right-2.5 h-1.5 w-1.5 rounded-full bg-signal" />
              )}
              {/* Collapsed tooltip */}
              {isCollapsed && !isMobile && (
                <div className="absolute left-full ml-2 hidden group-hover:flex items-center z-50">
                  <div className="bg-surface-elevated border border-border rounded-md px-2.5 py-1 text-data-sm text-ink whitespace-nowrap shadow-glass">
                    {item.label}
                  </div>
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Nav */}
      <div className="py-4 px-2 space-y-0.5 border-t border-border shrink-0">
        {BOTTOM_ITEMS.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href as any}
              onClick={isMobile ? closeMobileSidebar : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5',
                'transition-all duration-150 group relative',
                isActive
                  ? 'bg-signal/10 text-signal border border-signal/20'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-raised border border-transparent'
              )}
            >
              <Icon size={18} strokeWidth={1.75} className="shrink-0" />
              {(!isCollapsed || isMobile) && (
                <span className="text-data-sm font-medium animate-fade-in">{item.label}</span>
              )}
              {isCollapsed && !isMobile && (
                <div className="absolute left-full ml-2 hidden group-hover:flex items-center z-50">
                  <div className="bg-surface-elevated border border-border rounded-md px-2.5 py-1 text-data-sm text-ink whitespace-nowrap shadow-glass">
                    {item.label}
                  </div>
                </div>
              )}
            </Link>
          )
        })}

        {/* Collapse toggle — desktop only */}
        {!isMobile && (
          <button
            onClick={toggleSidebar}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-ink-faint hover:text-ink-muted hover:bg-surface-raised transition-all duration-150 border border-transparent"
          >
            {isCollapsed ? (
              <ChevronRight size={18} strokeWidth={1.75} className="shrink-0" />
            ) : (
              <>
                <ChevronLeft size={18} strokeWidth={1.75} className="shrink-0" />
                <span className="text-data-sm font-medium animate-fade-in">Collapse</span>
              </>
            )}
          </button>
        )}
      </div>
    </aside>
  )
}
