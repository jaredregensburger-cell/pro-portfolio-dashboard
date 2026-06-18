/**
 * /lib/db/transactions.ts
 * All Supabase queries for transactions.
 */

import { supabase } from '@/lib/supabase'
import type { TransactionRow, TransactionTypeEnum, TransactionStatusEnum } from '@/types/database'

// Supabase generated types are currently too strict / broken in this project.
const db = supabase as any

export interface TransactionWithAsset extends TransactionRow {
  assets: {
    ticker: string
    name: string
  } | null
}

export interface CreateTransactionInput {
  portfolioId: string
  assetId?: string | null
  type: TransactionTypeEnum
  status?: TransactionStatusEnum
  quantity?: number | null
  price?: number | null
  totalAmount: number
  fee?: number
  currency?: string
  note?: string
  externalId?: string
  executedAt: string
}

type PnLTransactionRow = {
  type: TransactionTypeEnum
  total_amount: number | null
  fee: number | null
  quantity: number | null
  price: number | null
  status: TransactionStatusEnum
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getTransactions(
  portfolioId: string,
  options?: {
    assetId?: string
    type?: TransactionTypeEnum
    status?: TransactionStatusEnum
    from?: string
    to?: string
    page?: number
    pageSize?: number
  }
): Promise<{ data: TransactionWithAsset[]; total: number }> {
  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = db
    .from('transactions')
    .select('*, assets(ticker, name)', { count: 'exact' })
    .eq('portfolio_id', portfolioId)
    .order('executed_at', { ascending: false })
    .range(from, to)

  if (options?.assetId) query = query.eq('asset_id', options.assetId)
  if (options?.type) query = query.eq('type', options.type)
  if (options?.status) query = query.eq('status', options.status)
  if (options?.from) query = query.gte('executed_at', options.from)
  if (options?.to) query = query.lte('executed_at', options.to)

  const { data, error, count } = await query

  if (error) throw new Error(`getTransactions: ${error.message}`)

  return {
    data: (data ?? []) as TransactionWithAsset[],
    total: count ?? 0,
  }
}

export async function getAssetTransactions(assetId: string): Promise<TransactionRow[]> {
  const { data, error } = await db
    .from('transactions')
    .select('*')
    .eq('asset_id', assetId)
    .order('executed_at', { ascending: false })

  if (error) throw new Error(`getAssetTransactions: ${error.message}`)

  return (data ?? []) as TransactionRow[]
}

export async function computePortfolioPnL(portfolioId: string) {
  const { data, error } = await db
    .from('transactions')
    .select('type, total_amount, fee, quantity, price, status')
    .eq('portfolio_id', portfolioId)
    .eq('status', 'completed')

  if (error) throw new Error(`computePortfolioPnL: ${error.message}`)

  const txns = (data ?? []) as PnLTransactionRow[]

  return {
    totalBuyCost: txns
      .filter((t) => t.type === 'buy')
      .reduce((sum, t) => sum + Number(t.total_amount ?? 0) + Number(t.fee ?? 0), 0),

    totalSellProceeds: txns
      .filter((t) => t.type === 'sell')
      .reduce((sum, t) => sum + Number(t.total_amount ?? 0) - Number(t.fee ?? 0), 0),

    totalDividends: txns
      .filter((t) => t.type === 'dividend')
      .reduce((sum, t) => sum + Number(t.total_amount ?? 0), 0),

    totalFees: txns.reduce((sum, t) => sum + Number(t.fee ?? 0), 0),

    transactionCount: txns.length,
  }
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function createTransaction(
  input: CreateTransactionInput
): Promise<TransactionRow> {
  if (['buy', 'sell'].includes(input.type)) {
    if (!input.quantity || !input.price) {
      throw new Error('Buy and sell transactions require both quantity and price')
    }
  }

  const { data, error } = await db
    .from('transactions')
    .insert({
      portfolio_id: input.portfolioId,
      asset_id: input.assetId ?? null,
      type: input.type,
      status: input.status ?? 'completed',
      quantity: input.quantity ?? null,
      price: input.price ?? null,
      total_amount: input.totalAmount,
      fee: input.fee ?? 0,
      currency: input.currency ?? 'USD',
      note: input.note ?? null,
      external_id: input.externalId ?? null,
      executed_at: input.executedAt,
    })
    .select()
    .single()

  if (error) throw new Error(`createTransaction: ${error.message}`)

  return data as TransactionRow
}

export async function recordBuy(input: {
  portfolioId: string
  assetId: string
  quantity: number
  price: number
  fee?: number
  currency?: string
  note?: string
  executedAt?: string
}): Promise<TransactionRow> {
  return createTransaction({
    portfolioId: input.portfolioId,
    assetId: input.assetId,
    type: 'buy',
    quantity: input.quantity,
    price: input.price,
    totalAmount: input.quantity * input.price,
    fee: input.fee ?? 0,
    currency: input.currency ?? 'USD',
    note: input.note,
    executedAt: input.executedAt ?? new Date().toISOString(),
  })
}

export async function recordSell(input: {
  portfolioId: string
  assetId: string
  quantity: number
  price: number
  fee?: number
  currency?: string
  note?: string
  executedAt?: string
}): Promise<TransactionRow> {
  return createTransaction({
    portfolioId: input.portfolioId,
    assetId: input.assetId,
    type: 'sell',
    quantity: input.quantity,
    price: input.price,
    totalAmount: input.quantity * input.price,
    fee: input.fee ?? 0,
    currency: input.currency ?? 'USD',
    note: input.note,
    executedAt: input.executedAt ?? new Date().toISOString(),
  })
}

export async function updateTransaction(
  transactionId: string,
  input: { status?: TransactionStatusEnum; note?: string }
): Promise<TransactionRow> {
  const { data, error } = await db
    .from('transactions')
    .update(input)
    .eq('id', transactionId)
    .select()
    .single()

  if (error) throw new Error(`updateTransaction: ${error.message}`)

  return data as TransactionRow
}

export async function cancelTransaction(transactionId: string): Promise<TransactionRow> {
  return updateTransaction(transactionId, { status: 'cancelled' })
}

export function transactionsToCsv(transactions: TransactionWithAsset[]): string {
  const headers = [
    'Date',
    'Ticker',
    'Type',
    'Quantity',
    'Price',
    'Amount',
    'Fee',
    'Currency',
    'Status',
    'Note',
  ]

  const rows = transactions.map((t) => [
    new Date(t.executed_at).toISOString().split('T')[0],
    t.assets?.ticker ?? '',
    t.type,
    t.quantity ?? '',
    t.price ?? '',
    t.total_amount,
    t.fee,
    t.currency,
    t.status,
    t.note ?? '',
  ])

  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
}
