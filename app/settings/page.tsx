import type { Metadata } from 'next'
import { AppShell } from '@/components/layout'
import { SettingsShell } from '@/features/portfolio/SettingsShell'

export const metadata: Metadata = {
  title: 'Settings',
}

export default function SettingsPage() {
  return (
    <AppShell title="Settings" subtitle="Account preferences & configuration">
      <SettingsShell />
    </AppShell>
  )
}
