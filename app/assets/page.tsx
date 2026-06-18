import type { Metadata } from 'next'
import { AppShell } from '@/components/layout'
import { AssetsShell } from '@/features/assets/AssetsShell'
import { AddAssetButton } from '@/features/assets/AddAssetButton'

export const metadata: Metadata = {
  title: 'Assets',
}

export default function AssetsPage() {
  return (
    <AppShell
      title="Assets"
      subtitle="All positions across your portfolio"
      topbarActions={<AddAssetButton label="Add Asset" />}
    >
      <AssetsShell />
    </AppShell>
  )
}
