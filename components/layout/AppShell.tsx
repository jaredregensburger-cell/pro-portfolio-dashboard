'use client'

import { Sidebar } from './Sidebar'
import { MobileSidebar } from './MobileSidebar'
import { Topbar } from './Topbar'
import { useUIStore } from '@/store'
import { cn } from '@/lib/utils'
import { AddAssetModal } from '@/features/assets/AddAssetModal'
import { AddTransactionModal } from '@/features/transactions/AddTransactionModal'
import { AddPortfolioModal } from '@/features/portfolio/AddPortfolioModal'
import { AddWatchlistItemModal } from '@/features/watchlist/AddWatchlistItemModal'
import { LiveMarketDataProvider } from '@/features/portfolio/LiveMarketDataProvider'
import { OnboardingGate } from '@/features/onboarding/OnboardingGate'
import { ToastContainer } from '@/components/ui'
import { ChatBubble } from '@/components/ai-chat'

interface AppShellProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  topbarActions?: React.ReactNode
}

export function AppShell({ children, title, subtitle, topbarActions }: AppShellProps) {
  const { sidebar } = useUIStore()
  const isCollapsed = sidebar === 'collapsed'

  return (
    <OnboardingGate>
      <LiveMarketDataProvider>
        <div className="min-h-screen bg-void">
          {/* Desktop sidebar (fixed, hidden below lg) */}
          <Sidebar />

          {/* Mobile sidebar (slide-in drawer, hidden at lg and above) */}
          <MobileSidebar />

          {/* Main content area */}
          <div
            className={cn(
              'flex flex-col min-h-screen transition-all duration-300 ease-in-out',
              'ml-0', // mobile: no offset, sidebar is an overlay
              isCollapsed ? 'lg:ml-16' : 'lg:ml-sidebar'
            )}
          >
            <Topbar title={title} subtitle={subtitle} actions={topbarActions} />
            <main className="flex-1 p-4 sm:p-6 overflow-auto animate-fade-in">
              {children}
            </main>
          </div>

          {/* Global modals — available on every page */}
          <AddAssetModal />
          <AddTransactionModal />
          <AddPortfolioModal />
          <AddWatchlistItemModal />

          {/* Toast notifications — error/success states surface here */}
          <ToastContainer />

          {/* AI Chat — floating widget, always visible */}
          <ChatBubble />
        </div>
      </LiveMarketDataProvider>
    </OnboardingGate>
  )
}
