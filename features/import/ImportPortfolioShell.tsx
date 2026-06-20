'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, X, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { GlassCard, Button } from '@/components/ui'
import { cn, formatCurrency, formatNumber } from '@/lib/utils'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { showSuccessToast } from '@/store/toast.store'

type ImportRow = {
  ticker: string
  name: string
  asset_class: string
  type: 'buy' | 'sell'
  quantity: number
  price: number
  date: string
  source_id?: string
  source?: 'folio' | 'trade_republic'
}

const FOLIO_COLUMNS = ['ticker', 'name', 'asset_class', 'type', 'quantity', 'price', 'date']

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]

    if (char === '"' && inQuotes && next === '"') {
      cell += '"'
      i++
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === ',' && !inQuotes) {
      row.push(cell.trim())
      cell = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i++
      row.push(cell.trim())
      if (row.some((v) => v.length > 0)) rows.push(row)
      row = []
      cell = ''
      continue
    }

    cell += char
  }

  row.push(cell.trim())
  if (row.some((v) => v.length > 0)) rows.push(row)

  return rows
}

function normalizeAssetClass(value: string) {
  const v = value.toLowerCase().trim()

  if (v === 'stock' || v === 'equity') return 'stock'
  if (v === 'crypto') return 'crypto'
  if (v === 'etf') return 'etf'
  if (v === 'metal' || v === 'commodity') return 'metal'
  if (v === 'cash') return 'cash'

  return ''
}

function normalizeTradeRepublicAssetClass(value: string) {
  const v = value.toLowerCase().trim()

  if (v === 'stock') return 'stock'
  if (v === 'crypto') return 'crypto'
  if (v === 'etf') return 'etf'
  if (v === 'derivative') return 'stock'
  if (v === 'fund') return 'etf'

  return 'stock'
}

function toDbAssetClass(assetClass: string) {
  if (assetClass === 'stock') return 'equity'
  if (assetClass === 'metal') return 'commodity'
  return assetClass
}

function detectFormat(headers: string[]) {
  const isFolio = FOLIO_COLUMNS.every((col) => headers.includes(col))

  if (isFolio) return 'folio'

  const isTradeRepublic =
    headers.includes('transaction_id') &&
    headers.includes('category') &&
    headers.includes('type') &&
    headers.includes('symbol') &&
    headers.includes('shares') &&
    headers.includes('price') &&
    headers.includes('date')

  if (isTradeRepublic) return 'trade_republic'

  return 'unknown'
}

function mapFolioRows(parsed: string[][], headers: string[]): ImportRow[] {
  return parsed.slice(1).map((cells, index) => {
    const get = (key: string) => cells[headers.indexOf(key)] ?? ''

    const ticker = get('ticker').toUpperCase().trim()
    const name = get('name').trim()
    const assetClass = normalizeAssetClass(get('asset_class'))
    const type = get('type').toLowerCase().trim()
    const quantity = Number(get('quantity'))
    const price = Number(get('price'))
    const date = get('date').trim()

    if (!ticker) throw new Error(`Zeile ${index + 2}: ticker fehlt.`)
    if (!name) throw new Error(`Zeile ${index + 2}: name fehlt.`)
    if (!assetClass) throw new Error(`Zeile ${index + 2}: asset_class ist ungültig.`)
    if (type !== 'buy' && type !== 'sell') throw new Error(`Zeile ${index + 2}: type muss buy oder sell sein.`)
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error(`Zeile ${index + 2}: quantity ist ungültig.`)
    if (!Number.isFinite(price) || price <= 0) throw new Error(`Zeile ${index + 2}: price ist ungültig.`)
    if (!date) throw new Error(`Zeile ${index + 2}: date fehlt.`)

    return {
      ticker,
      name,
      asset_class: assetClass,
      type: type as 'buy' | 'sell',
      quantity,
      price,
      date,
      source: 'folio',
    }
  })
}

function mapTradeRepublicRows(parsed: string[][], headers: string[]): ImportRow[] {
  const rows: ImportRow[] = []

  parsed.slice(1).forEach((cells, index) => {
    const get = (key: string) => cells[headers.indexOf(key)] ?? ''

    const category = get('category').toUpperCase().trim()
    const rawType = get('type').toUpperCase().trim()

    if (category !== 'TRADING') return
    if (rawType !== 'BUY' && rawType !== 'SELL') return

    const symbol = get('symbol').toUpperCase().trim()
    const name = get('name').trim()
    const assetClass = normalizeTradeRepublicAssetClass(get('asset_class'))
    const quantity = Number(get('shares'))
    const price = Number(get('price'))
    const date = get('datetime').trim() || get('date').trim()
    const sourceId = get('transaction_id').trim()

    if (!symbol) throw new Error(`Zeile ${index + 2}: symbol fehlt.`)
    if (!name) throw new Error(`Zeile ${index + 2}: name fehlt.`)
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error(`Zeile ${index + 2}: shares ist ungültig.`)
    if (!Number.isFinite(price) || price <= 0) throw new Error(`Zeile ${index + 2}: price ist ungültig.`)
    if (!date) throw new Error(`Zeile ${index + 2}: date fehlt.`)

    rows.push({
      ticker: symbol,
      name,
      asset_class: assetClass,
      type: rawType === 'BUY' ? 'buy' : 'sell',
      quantity,
      price,
      date,
      source_id: sourceId || undefined,
      source: 'trade_republic',
    })
  })

  if (rows.length === 0) {
    throw new Error('Keine Trade-Republic-Kauf- oder Verkaufstransaktionen gefunden.')
  }

  return rows
}

export function ImportPortfolioShell() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<ImportRow[]>([])
  const [format, setFormat] = useState<'folio' | 'trade_republic' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState('')

  async function handleFile(selectedFile: File | null) {
    setError(null)
    setRows([])
    setProgress('')
    setFormat(null)

    if (!selectedFile) return

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Aktuell werden nur CSV-Dateien unterstützt.')
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Die Datei darf maximal 10 MB groß sein.')
      return
    }

    setFile(selectedFile)

    try {
      const text = await selectedFile.text()
      const parsed = parseCsv(text)

      if (parsed.length < 2) {
        setError('Die CSV-Datei enthält keine Daten.')
        return
      }

      const headers = parsed[0].map((h) => h.toLowerCase().trim())
      const detected = detectFormat(headers)

      if (detected === 'unknown') {
        setError('CSV-Format nicht erkannt. Unterstützt werden Folio Standard CSV und Trade Republic CSV.')
        return
      }

      const mappedRows =
        detected === 'trade_republic'
          ? mapTradeRepublicRows(parsed, headers)
          : mapFolioRows(parsed, headers)

      setFormat(detected)
      setRows(mappedRows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CSV konnte nicht gelesen werden.')
    }
  }

  async function getOrCreateDefaultPortfolio(userId: string) {
    const supabase = createSupabaseBrowserClient()

    const { data: existing, error: existingError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .maybeSingle()

    if (existingError) throw existingError
    if (existing) return existing

    const { data: created, error: createError } = await supabase
      .from('portfolios')
      .insert({
        user_id: userId,
        name: 'Mein Portfolio',
        description: 'Imported portfolio',
        currency: 'EUR',
        is_default: true,
      })
      .select('*')
      .single()

    if (createError) throw createError
    return created
  }

  async function handleImport() {
    setError(null)
    setImporting(true)
    setProgress('Import wird vorbereitet…')

    try {
      const supabase = createSupabaseBrowserClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Du musst eingeloggt sein.')
        return
      }

      const portfolio = await getOrCreateDefaultPortfolio(user.id)

      let imported = 0
      let skipped = 0

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        setProgress(`Importiere ${i + 1}/${rows.length} Transaktionen…`)

        const ticker = row.ticker.toUpperCase()
        const executedAt = new Date(row.date).toISOString()

        const { data: existingAsset, error: existingError } = await supabase
          .from('assets')
          .select('*')
          .eq('portfolio_id', portfolio.id)
          .eq('ticker', ticker)
          .maybeSingle()

        if (existingError) throw existingError

        let asset = existingAsset

        if (!asset) {
          const { data: createdAsset, error: assetError } = await supabase
            .from('assets')
            .insert({
              portfolio_id: portfolio.id,
              ticker,
              name: row.name,
              asset_class: toDbAssetClass(row.asset_class),
              current_price: row.price,
              currency: 'EUR',
            })
            .select('*')
            .single()

          if (assetError) throw assetError
          asset = createdAsset
        }

        let existingTx = null

        if (row.source_id) {
          const { data, error } = await supabase
            .from('transactions')
            .select('id')
            .eq('portfolio_id', portfolio.id)
            .eq('note', `CSV Import ${row.source_id}`)
            .maybeSingle()

          if (error) throw error
          existingTx = data
        } else {
          const { data, error } = await supabase
            .from('transactions')
            .select('id')
            .eq('portfolio_id', portfolio.id)
            .eq('asset_id', asset.id)
            .eq('type', row.type)
            .eq('quantity', row.quantity)
            .eq('price', row.price)
            .eq('executed_at', executedAt)
            .maybeSingle()

          if (error) throw error
          existingTx = data
        }

        if (existingTx) {
          skipped++
          continue
        }

        const { error: txError } = await supabase.from('transactions').insert({
          portfolio_id: portfolio.id,
          asset_id: asset.id,
          type: row.type,
          status: 'completed',
          quantity: row.quantity,
          price: row.price,
          total_amount: row.quantity * row.price,
          fee: 0,
          currency: 'EUR',
          note: row.source_id ? `CSV Import ${row.source_id}` : 'CSV Import',
          executed_at: executedAt,
        })

        if (txError) throw txError
        imported++
      }

      showSuccessToast(
        'Import abgeschlossen',
        `${imported} importiert · ${skipped} Duplikate übersprungen.`
      )

      window.dispatchEvent(new Event('folio:portfolio-changed'))

      setFile(null)
      setRows([])
      setProgress('')
      setFormat(null)

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('CSV import error:', err)
      setError(err instanceof Error ? err.message : 'Import fehlgeschlagen.')
    } finally {
      setImporting(false)
    }
  }

  const totalValue = rows.reduce((sum, row) => {
    const value = row.quantity * row.price
    return row.type === 'buy' ? sum + value : sum - value
  }, 0)

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <GlassCard className="text-center py-16">
        <Upload className="mx-auto mb-4 h-10 w-10 text-signal" />

        <h2 className="text-xl font-semibold mb-2">Portfolio importieren</h2>

        <p className="text-ink-muted mb-6">
          Lade eine Folio Standard CSV oder einen Trade Republic CSV-Export hoch.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />

        <Button onClick={() => inputRef.current?.click()} disabled={importing}>
          CSV auswählen
        </Button>

        {error && (
          <div className="mx-auto mt-5 flex max-w-xl items-center gap-2 rounded-xl border border-loss/20 bg-loss/10 px-4 py-3 text-left text-data-sm text-loss">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}
      </GlassCard>

      {file && rows.length > 0 && (
        <GlassCard>
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-raised">
              <FileText className="h-5 w-5 text-signal" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink">{file.name}</p>
              <p className="text-data-sm text-ink-muted">
                {format === 'trade_republic' ? 'Trade Republic CSV erkannt' : 'Folio CSV erkannt'} ·{' '}
                {rows.length} Transaktionen · Gesamtwert ca. {formatCurrency(totalValue, 'EUR')}
              </p>
            </div>

            <button
              type="button"
              disabled={importing}
              onClick={() => {
                setFile(null)
                setRows([])
                setError(null)
                setFormat(null)
              }}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg',
                'text-ink-muted hover:bg-surface-raised hover:text-ink disabled:opacity-50'
              )}
            >
              <X size={16} />
            </button>
          </div>

          <div className="mb-5 rounded-xl border border-border bg-surface-raised p-4">
            <div className="flex items-center gap-2 text-data-sm text-gain">
              <CheckCircle2 size={16} />
              CSV erfolgreich gelesen
            </div>

            <p className="mt-2 text-data-sm text-ink-muted">
              Duplikate werden beim Import automatisch übersprungen.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[760px] text-left text-data-sm">
              <thead className="border-b border-border bg-surface-raised text-ink-faint">
                <tr>
                  <th className="px-4 py-3">Symbol</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Typ</th>
                  <th className="px-4 py-3">Trade</th>
                  <th className="px-4 py-3 text-right">Menge</th>
                  <th className="px-4 py-3 text-right">Preis</th>
                  <th className="px-4 py-3">Datum</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {rows.slice(0, 20).map((row, index) => (
                  <tr key={`${row.ticker}-${index}`} className="text-ink">
                    <td className="px-4 py-3 font-mono font-semibold">{row.ticker}</td>
                    <td className="px-4 py-3">{row.name}</td>
                    <td className="px-4 py-3">{row.asset_class}</td>
                    <td className="px-4 py-3">{row.type}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatNumber(row.quantity, row.asset_class === 'crypto' ? 8 : 4)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatCurrency(row.price, 'EUR')}
                    </td>
                    <td className="px-4 py-3 font-mono text-ink-muted">{row.date.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rows.length > 20 && (
            <p className="mt-3 text-data-sm text-ink-faint">
              Zeige 20 von {rows.length} Transaktionen.
            </p>
          )}

          {progress && (
            <p className="mt-4 flex items-center gap-2 text-data-sm text-ink-muted">
              <Loader2 size={14} className="animate-spin" />
              {progress}
            </p>
          )}

          <div className="mt-5 flex justify-end">
            <Button onClick={handleImport} disabled={importing}>
              {importing ? 'Importiere…' : 'In Portfolio importieren'}
            </Button>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
