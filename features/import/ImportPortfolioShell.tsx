'use client'

import { Upload } from 'lucide-react'
import { GlassCard, Button } from '@/components/ui'

export function ImportPortfolioShell() {
  return (
    <div className="max-w-3xl mx-auto">
      <GlassCard className="text-center py-16">
        <Upload className="mx-auto mb-4 h-10 w-10" />

        <h2 className="text-xl font-semibold mb-2">
          Portfolio importieren
        </h2>

        <p className="text-ink-muted mb-6">
          Lade einen PDF- oder CSV-Export deines Brokers hoch.
        </p>

        <Button>
          Datei auswählen
        </Button>
      </GlassCard>
    </div>
  )
}
