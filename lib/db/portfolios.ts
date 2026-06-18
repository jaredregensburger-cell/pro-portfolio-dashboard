/**
 * /lib/db/portfolios.ts
 * All Supabase queries for portfolios.
 */

import { supabase } from '@/lib/supabase'
import type { PortfolioRow } from '@/types/database'

// Supabase generated types are currently too strict / broken in this project.
const db = supabase as any

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getPortfolios(): Promise<PortfolioRow[]> {
  const { data, error } = await db
    .from('portfolios')
    .select('*')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) throw new Error(`getPortfolios: ${error.message}`)

  return (data ?? []) as PortfolioRow[]
}

export async function getPortfolio(portfolioId: string): Promise<PortfolioRow | null> {
  const { data, error } = await db
    .from('portfolios')
    .select('*')
    .eq('id', portfolioId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`getPortfolio: ${error.message}`)
  }

  return data as PortfolioRow
}

export async function getDefaultPortfolio(): Promise<PortfolioRow | null> {
  const { data, error } = await db
    .from('portfolios')
    .select('*')
    .eq('is_default', true)
    .maybeSingle()

  if (error) throw new Error(`getDefaultPortfolio: ${error.message}`)

  return data as PortfolioRow | null
}

export async function getPortfolioSummary(portfolioId: string) {
  const { data, error } = await db
    .rpc('get_portfolio_summary', { p_portfolio_id: portfolioId })

  if (error) throw new Error(`getPortfolioSummary: ${error.message}`)

  return data?.[0] ?? null
}

export async function getPortfolioChartData(
  portfolioId: string,
  from?: string,
  to?: string
) {
  const args: Record<string, string> = {
    p_portfolio_id: portfolioId,
  }

  if (from) args.p_from = from
  if (to) args.p_to = to

  const { data, error } = await db
    .rpc('get_portfolio_chart_data', args)

  if (error) throw new Error(`getPortfolioChartData: ${error.message}`)

  return data ?? []
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function createPortfolio(input: {
  name: string
  description?: string
  currency?: string
}): Promise<PortfolioRow> {
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await db
    .from('portfolios')
    .insert({
      user_id: user.id,
      name: input.name,
      description: input.description ?? null,
      currency: input.currency ?? 'USD',
    })
    .select()
    .single()

  if (error) throw new Error(`createPortfolio: ${error.message}`)

  return data as PortfolioRow
}

export async function updatePortfolio(
  portfolioId: string,
  input: { name?: string; description?: string; currency?: string }
): Promise<PortfolioRow> {
  const { data, error } = await db
    .from('portfolios')
    .update(input)
    .eq('id', portfolioId)
    .select()
    .single()

  if (error) throw new Error(`updatePortfolio: ${error.message}`)

  return data as PortfolioRow
}

export async function deletePortfolio(portfolioId: string): Promise<void> {
  const { error } = await db
    .from('portfolios')
    .delete()
    .eq('id', portfolioId)

  if (error) throw new Error(`deletePortfolio: ${error.message}`)
}
