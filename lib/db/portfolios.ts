/**
 * /lib/db/portfolios.ts
 * All Supabase queries for portfolios.
 * Import { supabase } for client components, createServerClient() for server.
 */

import { supabase } from '@/lib/supabase'
import type { PortfolioRow } from '@/types/database'

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Fetch all portfolios for the currently authenticated user.
 */
export async function getPortfolios(): Promise<PortfolioRow[]> {
  const { data, error } = await supabase
    .from('portfolios')
    .select('*')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) throw new Error(`getPortfolios: ${error.message}`)
  return data ?? []
}

/**
 * Fetch a single portfolio by ID.
 * RLS ensures the user can only access their own portfolios.
 */
export async function getPortfolio(portfolioId: string): Promise<PortfolioRow | null> {
  const { data, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('id', portfolioId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw new Error(`getPortfolio: ${error.message}`)
  }
  return data
}

/**
 * Fetch the user's default portfolio.
 */
export async function getDefaultPortfolio(): Promise<PortfolioRow | null> {
  const { data, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('is_default', true)
    .maybeSingle()

  if (error) throw new Error(`getDefaultPortfolio: ${error.message}`)
  return data
}

/**
 * Get computed portfolio summary via RPC.
 * Returns total_value, total_cost, unrealized_gain, etc. — all from transactions.
 */
export async function getPortfolioSummary(portfolioId: string) {
  const { data, error } = await supabase
    .rpc('get_portfolio_summary', { p_portfolio_id: portfolioId })

  if (error) throw new Error(`getPortfolioSummary: ${error.message}`)
  return data?.[0] ?? null
}

/**
 * Get chart data for a portfolio over a date range.
 * Returns daily snapshots with value, cost, and gain.
 */
export async function getPortfolioChartData(
  portfolioId: string,
  from?: string,
  to?: string
) {
  const args: Record<string, string> = { p_portfolio_id: portfolioId }
  if (from) args.p_from = from
  if (to)   args.p_to   = to

  const { data, error } = await supabase.rpc('get_portfolio_chart_data', args)

  if (error) throw new Error(`getPortfolioChartData: ${error.message}`)
  return data ?? []
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Create a new portfolio for the current user.
 */
export async function createPortfolio(input: {
  name:         string
  description?: string
  currency?:    string
}): Promise<PortfolioRow> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('portfolios')
    .insert({
      user_id:     user.id,
      name:        input.name,
      description: input.description ?? null,
      currency:    input.currency ?? 'USD',
    })
    .select()
    .single()

  if (error) throw new Error(`createPortfolio: ${error.message}`)
  return data
}

/**
 * Update portfolio metadata.
 */
export async function updatePortfolio(
  portfolioId: string,
  input: { name?: string; description?: string; currency?: string }
): Promise<PortfolioRow> {
  const { data, error } = await supabase
    .from('portfolios')
    .update(input)
    .eq('id', portfolioId)
    .select()
    .single()

  if (error) throw new Error(`updatePortfolio: ${error.message}`)
  return data
}

/**
 * Delete a portfolio and all its assets/transactions (cascade).
 */
export async function deletePortfolio(portfolioId: string): Promise<void> {
  const { error } = await supabase
    .from('portfolios')
    .delete()
    .eq('id', portfolioId)

  if (error) throw new Error(`deletePortfolio: ${error.message}`)
}
