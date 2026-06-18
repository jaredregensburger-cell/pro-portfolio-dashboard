/**
 * Portfolio Service
 * All Supabase data access for portfolios lives here.
 * Ready for backend integration — swap mock returns for real queries.
 */

import type { Portfolio, PortfolioSummary, Asset } from '@/types'

// ─── Types ───────────────────────────────────────────────────────────────────

interface FetchPortfoliosOptions {
  userId: string
}

interface FetchPortfolioOptions {
  portfolioId: string
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Fetch all portfolios for a user
 * TODO: Replace mock with: supabase.from('portfolios').select('*').eq('user_id', userId)
 */
export async function fetchPortfolios(_options: FetchPortfoliosOptions): Promise<Portfolio[]> {
  // STUB — wire up Supabase when ready
  await new Promise((r) => setTimeout(r, 500))
  return []
}

/**
 * Fetch a single portfolio with all assets
 * TODO: Replace mock with joined query including assets and summary view
 */
export async function fetchPortfolio(_options: FetchPortfolioOptions): Promise<Portfolio | null> {
  await new Promise((r) => setTimeout(r, 300))
  return null
}

/**
 * Create a new portfolio
 */
export async function createPortfolio(
  _data: Pick<Portfolio, 'name' | 'currency'>
): Promise<Portfolio | null> {
  await new Promise((r) => setTimeout(r, 300))
  return null
}

/**
 * Update portfolio metadata
 */
export async function updatePortfolio(
  _id: string,
  _data: Partial<Pick<Portfolio, 'name' | 'currency'>>
): Promise<Portfolio | null> {
  await new Promise((r) => setTimeout(r, 200))
  return null
}

/**
 * Delete a portfolio
 */
export async function deletePortfolio(_id: string): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 200))
  return true
}

/**
 * Recalculate and return portfolio summary
 * In production: call a Supabase RPC function or Edge Function
 */
export async function fetchPortfolioSummary(
  _portfolioId: string
): Promise<PortfolioSummary | null> {
  await new Promise((r) => setTimeout(r, 200))
  return null
}
