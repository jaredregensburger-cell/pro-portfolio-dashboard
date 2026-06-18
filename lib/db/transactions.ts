/**
 * /lib/db/transactions.ts
 * All Supabase queries for transactions.
 * This is the core of the system — all portfolio values derive from here.
 */

import { supabase } from '@/lib/supabase'
import type { TransactionRow, TransactionTypeEnum, TransactionStatusEnum } from '@/types/database'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TransactionWithAsset extends TransactionRow {
  assets: {
    ticker: string
    name:   string
  } | null
}

export interface CreateTransactionInput {
  portfolioId:  string
  assetId?:     string | null
  type:         TransactionTypeEnum
  status?:      TransactionStatusEnum
  quantity?:    number | null
  price?:       number | null
  totalAmount:  number
  fee?:         number
  currency?:    string
  note?:        string
  externalId?:  string
  executedAt:   string
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Fetch paginated transactions with asset metadata.
 */
export async function getTransactions(
  portfolioId: string,
  options?: {
    assetId?:  string
    type?:     TransactionTypeEnum
    status?:   TransactionStatusEnum
    from?:     string
    to?:       string
    page?:     number
    pageSize?: number
  }
): Promise<{ data: TransactionWithAsset[]; total: number }> {
  const page     = options?.page     ?? 1
  const pageSize = options?.pageSize ?? 20
  const from     = (page - 1) * pageSize
  const to       = from + pageSize - 1

  let query = supabase
    .from('transactions')
    .select('*, assets(ticker, name)', { count: 'exact' })
    .eq('portfolio_id', portfolioId)
    .order('executed_at', { ascending: false })
    .range(from, to)

  if (options?.assetId) query = query.eq('asset_id', options.assetId)
  if (options?.type)    query = query.eq('type', options.type)
  if (options?.status)  query = query.eq('status', options.status)
  if (options?.from)    query = query.gte('executed_at', options.from)
  if (options?.to)      query = query.lte('executed_at', options.to)

  const { data, error, count } = await query

  if (error) throw new Error(`getTransactions: ${error.message}`)
  return {
    data:  (data ?? []) as TransactionWithAsset[],
    total: count ?? 0,
  }
}

/**
 * Fetch all transactions for a specific asset.
 */
export async function getAssetTransactions(assetId: string): Promise<TransactionRow[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('asset_id', assetId)
    .order('executed_at', { ascending: false })

  if (error) throw new Error(`getAssetTransactions: ${error.message}`)
  return data ?? []
}

/**
 * Compute portfolio P&L directly from transactions.
 * This is the authoritative calculation — never use stored values.
 */
export async function computePortfolioPnL(portfolioId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('type, total_amount, fee, quantity, price, status')
    .eq('portfolio_id', portfolioId)
    .eq('status', 'completed')

  if (error) throw new Error(`computePortfolioPnL: ${error.message}`)

  const txns = data ?? []

  return {
    totalBuyCost: txns
      .filter(t => t.type === 'buy')
      .reduce((sum, t) => sum + (t.total_amount ?? 0) + (t.fee ?? 0), 0),

    totalSellProceeds: txns
      .filter(t => t.type === 'sell')
      .reduce((sum, t) => sum + (t.total_amount ?? 0) - (t.fee ?? 0), 0),

    totalDividends: txns
      .filter(t => t.type === 'dividend')
      .reduce((sum, t) => sum + (t.total_amount ?? 0), 0),

    totalFees: txns
      .reduce((sum, t) => sum + (t.fee ?? 0), 0),

    transactionCount: txns.length,
  }
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Record a new transaction.
 * The DB trigger will automatically update the asset's quantity and avg_cost_basis.
 */
export async function createTransaction(
  input: CreateTransactionInput
): Promise<TransactionRow> {
  // Validate buy/sell requirements
  if (['buy', 'sell'].includes(input.type)) {
    if (!input.quantity || !input.price) {
      throw new Error('Buy and sell transactions require both quantity and price')
    }
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      portfolio_id: input.portfolioId,
      asset_id:     input.assetId    ?? null,
      type:         input.type,
      status:       input.status     ?? 'completed',
      quantity:     input.quantity   ?? null,
      price:        input.price      ?? null,
      total_amount: input.totalAmount,
      fee:          input.fee        ?? 0,
      currency:     input.currency   ?? 'USD',
      note:         input.note       ?? null,
      external_id:  input.externalId ?? null,
      executed_at:  input.executedAt,
    })
    .select()
    .single()

  if (error) throw new Error(`createTransaction: ${error.message}`)
  return data
}

/**
 * Record a BUY transaction (convenience wrapper).
 * total_amount is computed as quantity * price.
 */
export async function recordBuy(input: {
  portfolioId: string
  assetId:     string
  quantity:    number
  price:       number
  fee?:        number
  currency?:   string
  note?:       string
  executedAt?: string
}): Promise<TransactionRow> {
  return createTransaction({
    portfolioId:  input.portfolioId,
    assetId:      input.assetId,
    type:         'buy',
    quantity:     input.quantity,
    price:        input.price,
    totalAmount:  input.quantity * input.price,
    fee:          input.fee ?? 0,
    currency:     input.currency ?? 'USD',
    note:         input.note,
    executedAt:   input.executedAt ?? new Date().toISOString(),
  })
}

/**
 * Record a SELL transaction (convenience wrapper).
 */
export async function recordSell(input: {
  portfolioId: string
  assetId:     string
  quantity:    number
  price:       number
  fee?:        number
  currency?:   string
  note?:       string
  executedAt?: string
}): Promise<TransactionRow> {
  return createTransaction({
    portfolioId:  input.portfolioId,
    assetId:      input.assetId,
    type:         'sell',
    quantity:     input.quantity,
    price:        input.price,
    totalAmount:  input.quantity * input.price,
    fee:          input.fee ?? 0,
    currency:     input.currency ?? 'USD',
    note:         input.note,
    executedAt:   input.executedAt ?? new Date().toISOString(),
  })
}

/**
 * Update a transaction's status or note.
 * NOTE: Only status and note can be changed — financial data is immutable.
 */
export async function updateTransaction(
  transactionId: string,
  input: { status?: TransactionStatusEnum; note?: string }
): Promise<TransactionRow> {
  const { data, error } = await supabase
    .from('transactions')
    .update(input)
    .eq('id', transactionId)
    .select()
    .single()

  if (error) throw new Error(`updateTransaction: ${error.message}`)
  return data
}

/**
 * Cancel a pending transaction.
 * Does NOT delete — sets status to 'cancelled' for audit trail.
 */
export async function cancelTransaction(transactionId: string): Promise<TransactionRow> {
  return updateTransaction(transactionId, { status: 'cancelled' })
}

/**
 * Export transactions as CSV string (client-side).
 */
export function transactionsToCsv(transactions: TransactionWithAsset[]): string {
  const headers = ['Date', 'Ticker', 'Type', 'Quantity', 'Price', 'Amount', 'Fee', 'Currency', 'Status', 'Note']
  const rows = transactions.map(t => [
    new Date(t.executed_at).toISOString().split('T')[0],
    t.assets?.ticker ?? '',
    t.type,
    t.quantity  ?? '',
    t.price     ?? '',
    t.total_amount,
    t.fee,
    t.currency,
    t.status,
    t.note      ?? '',
  ])

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
}
