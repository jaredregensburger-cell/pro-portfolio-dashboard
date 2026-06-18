import type { Metadata } from 'next'
import { AppShell } from '@/components/layout'
import { PortfolioShell } from '@/features/portfolio/PortfolioShell'

export const metadata: Metadata = {
  title: 'Portfolio',
}

export default function PortfolioPage() {
  return (
    <AppShell title="Portfolio" subtitle="Allocation & performance overview">
      <PortfolioShell />
    </AppShell>
  )
}
