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

const TRADE_REPUBLIC_COLUMNS = [
  'datetime',
  'date',
  'category',
  'type',
  'asset_class',
  'name',
  'symbol',
  'shares',
  'price',
  'amount',
  'currency',
  'transaction_id',
]

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let current: string[] = []
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
      current.push(cell.trim())
      cell = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i++
      current.push(cell.trim())
      if (current.some((v) => v.length > 0)) rows.push(current)
      current = []
      cell = ''
      continue
    }

    cell += char
  }

  current.push(cell.trim())
  if (current.some((v) => v.length > 0)) rows.push(current)

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

function toDbAssetClass(assetClass: string) {
  if (assetClass === 'stock') return 'equity'
  if (assetClass === 'metal') return 'commodity'
  return assetClass
}

function detectFormat(headers: string[]) {
  const hasFolio = FOLIO_COLUMNS.every((col) => headers.includes(col))
  if (hasFolio) return 'folio'

  const hasTradeRepublic =
    headers.includes('transaction_id') &&
    headers.includes('shares') &&
    headers.includes('symbol') &&
    headers.includes('category') &&
    headers.includes('type')

  if (hasTradeRepublic) return 'trade_republic'

  return 'unknown'
}

function mapFolioRows(parsed: string[][]
