import type { Metadata } from 'next'
import { AppShell } from '@/components/layout'
import { AssetDetailShell } from '@/features/assets/AssetDetailShell'

export const metadata: Metadata = {
  title: 'Asset',
}

export default function AssetDetailPage({
  params,
}: {
  params: { ticker: string }
}) {
  return (
    <AppShell title={params.ticker.toUpperCase()} subtitle="Asset details">
      <AssetDetailShell ticker={params.ticker} />
    </AppShell>
  )
}
