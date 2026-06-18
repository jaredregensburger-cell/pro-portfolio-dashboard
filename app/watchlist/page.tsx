import type { Metadata } from 'next'
import { AppShell } from '@/components/layout'
import { WatchlistShell } from '@/features/watchlist/WatchlistShell'

export const metadata: Metadata = {
  title: 'Watchlist',
}

export default function WatchlistPage() {
  return (
    <AppShell title="Watchlist" subtitle="Assets, die du im Blick behältst">
      <WatchlistShell />
    </AppShell>
  )
}
