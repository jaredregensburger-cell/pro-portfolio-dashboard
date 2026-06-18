import type { Metadata } from 'next'
import { AppShell } from '@/components/layout'
import { AnalyticsShell } from '@/features/portfolio/AnalyticsShell'

export const metadata: Metadata = {
  title: 'Analytics',
}

export default function AnalyticsPage() {
  return (
    <AppShell title="Analytics" subtitle="Equity Curve, Performance & Profit-Analyse">
      <AnalyticsShell />
    </AppShell>
  )
}
