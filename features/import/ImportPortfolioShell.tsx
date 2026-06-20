'use client'

import { useRef, useState } from 'react'
import { Upload, FileText, X, CheckCircle2 } from 'lucide-react'
import { GlassCard, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

export function ImportPortfolioShell() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleFile(selectedFile: File | null) {
    setError(null)

    if (!selectedFile) return

    const allowedTypes = [
      'text/csv',
      'application/pdf',
      'application/vnd.ms-excel',
    ]

    const allowedExtensions = ['.csv', '.pdf']
    const lowerName = selectedFile.name.toLowerCase()
    const hasAllowedExtension = allowedExtensions.some((ext) =>
      lowerName.endsWith(ext)
    )

    if (!allowedTypes.includes(selectedFile.type) && !hasAllowedExtension) {
      setError('Bitte lade eine CSV- oder PDF-Datei hoch.')
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Die Datei darf maximal 10 MB groß sein.')
      return
    }

    setFile(selectedFile)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <GlassCard className="text-center py-16">
        <Upload className="mx-auto mb-4 h-10 w-10 text-signal" />

        <h2 className="text-xl font-semibold mb-2">
          Portfolio importieren
        </h2>

        <p className="text-ink-muted mb-6">
          Lade einen PDF- oder CSV-Export deines Brokers hoch.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.pdf,text/csv,application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />

        <Button onClick={() => inputRef.current?.click()}>
          Datei auswählen
        </Button>

        {error && (
          <p className="mt-4 text-data-sm text-loss">
            {error}
          </p>
        )}
      </GlassCard>

      {file && (
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-raised">
              <FileText className="h-5 w-5 text-signal" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink">
                {file.name}
              </p>
              <p className="text-data-sm text-ink-muted">
                {(file.size / 1024).toFixed(1)} KB · {file.type || 'Unbekannter Dateityp'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setFile(null)}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg',
                'text-ink-muted hover:bg-surface-raised hover:text-ink'
              )}
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-5 rounded-xl border border-border bg-surface-raised p-4">
            <div className="flex items-center gap-2 text-data-sm text-gain">
              <CheckCircle2 size={16} />
              Datei bereit für Analyse
            </div>

            <p className="mt-2 text-data-sm text-ink-muted">
              Als Nächstes erkennt Folio automatisch Broker, Asset-Symbole,
              Mengen, Preise und Transaktionen.
            </p>
          </div>

          <div className="mt-5 flex justify-end">
            <Button>
              Datei analysieren
            </Button>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
