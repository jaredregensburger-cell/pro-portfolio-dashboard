import type { Metadata } from 'next'
import { AppShell } from '@/components/layout'
import { DashboardShell } from '@/features/portfolio/DashboardShell'
import { AddAssetButton } from '@/features/assets/AddAssetButton'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default function DashboardPage() {
  return (
    <AppShell
      title="Dashboard"
      subtitle="Good morning, Alex"
      topbarActions={<AddAssetButton label="Add Asset" />}
    >
      <DashboardShell />
    </AppShell>
  )
}
