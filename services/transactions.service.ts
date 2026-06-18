/**
 * Transactions Service
 * All Supabase data access for transactions/ledger.
 */

import type { Transaction, TransactionType, PaginatedResponse } from '@/types'

interface FetchTransactionsOptions {
  portfolioId: string
  type?: TransactionType
  assetId?: string
  page?: number
  pageSize?: number
  from?: string
  to?: string
}

/**
 * Fetch paginated transactions
 * TODO: supabase.from('transactions').select('*').eq('portfolio_id', portfolioId)
 */
export async function fetchTransactions(
  _options: FetchTransactionsOptions
): Promise<PaginatedResponse<Transaction>> {
  await new Promise((r) => setTimeout(r, 300))
  return { data: [], total: 0, page: 1, pageSize: 20, hasMore: false }
}

/**
 * Record a new transaction
 */
export async function createTransaction(
  _data: Omit<Transaction, 'id' | 'createdAt'>
): Promise<Transaction | null> {
  await new Promise((r) => setTimeout(r, 300))
  return null
}

/**
 * Update transaction status or note
 */
export async function updateTransaction(
  _id: string,
  _data: Partial<Pick<Transaction, 'status' | 'note'>>
): Promise<Transaction | null> {
  await new Promise((r) => setTimeout(r, 200))
  return null
}

/**
 * Cancel / delete a transaction
 */
export async function cancelTransaction(_id: string): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 200))
  return true
}

/**
 * Export transactions as CSV blob
 */
export async function exportTransactionsCsv(
  _portfolioId: string
): Promise<Blob | null> {
  await new Promise((r) => setTimeout(r, 400))
  return null
}
