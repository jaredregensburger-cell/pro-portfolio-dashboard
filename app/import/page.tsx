import type { Metadata } from 'next'
import { AppShell } from '@/components/layout'
import { ImportPortfolioShell } from '@/features/import/ImportPortfolioShell'

export const metadata: Metadata = {
  title: 'Import Portfolio',
}

export default function ImportPage() {
  return (
    <AppShell
      title="Import Portfolio"
      subtitle="Importiere dein bestehendes Depot in Sekunden"
    >
      <ImportPortfolioShell />
    </AppShell>
  )
}
