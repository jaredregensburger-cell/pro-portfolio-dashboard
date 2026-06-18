/**
 * /lib/db/assets.ts
 * All Supabase queries for assets/positions.
 */

import { supabase } from '@/lib/supabase'
import type { AssetRow, AssetPerformanceView, AssetClassEnum } from '@/types/database'

// ─── Types ────────────────────────────────────────────────────────────────────

type AssetAllocationRow = {
  asset_class: AssetClassEnum
  current_value: number | null
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Fetch all assets for a portfolio with live performance data.
 * Uses the v_asset_performance view which computes P&L from transactions.
 */
export async function getAssets(
  portfolioId: string,
  filters?: { assetClass?: AssetClassEnum; activeOnly?: boolean }
): Promise<AssetPerformanceView[]> {
  let query = supabase
    .from('v_asset_performance')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .order('current_value', { ascending: false })

  if (filters?.assetClass) {
    query = query.eq('asset_class', filters.assetClass)
  }

  if (filters?.activeOnly !== false) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) throw new Error(`getAssets: ${error.message}`)

  return (data ?? []) as AssetPerformanceView[]
}

/**
 * Fetch a single asset with full performance data.
 */
export async function getAsset(assetId: string): Promise<AssetPerformanceView | null> {
  const { data, error } = await supabase
    .from('v_asset_performance')
    .select('*')
    .eq('asset_id', assetId)
    .maybeSingle()

  if (error) throw new Error(`getAsset: ${error.message}`)

  return data as AssetPerformanceView | null
}

/**
 * Get asset allocation breakdown for a portfolio.
 * Returns each asset class with total value and percentage.
 */
export async function getAssetAllocation(portfolioId: string): Promise<
  {
    assetClass: AssetClassEnum
    value: number
    pct: number
  }[]
> {
  const { data, error } = await supabase
    .from('v_asset_performance')
    .select('asset_class, current_value')
    .eq('portfolio_id', portfolioId)
    .eq('is_active', true)

  if (error) throw new Error(`getAssetAllocation: ${error.message}`)

  const rows = (data ?? []) as AssetAllocationRow[]

  const totalValue = rows.reduce(
    (sum, a) => sum + Number(a.current_value ?? 0),
    0
  )

  const byClass = rows.reduce<Record<string, number>>((acc, a) => {
    acc[a.asset_class] = (acc[a.asset_class] ?? 0) + Number(a.current_value ?? 0)
    return acc
  }, {})

  return Object.entries(byClass).map(([assetClass, value]) => ({
    assetClass: assetClass as AssetClassEnum,
    value,
    pct: totalValue > 0 ? (value / totalValue) * 100 : 0,
  }))
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Add a new asset to a portfolio.
 * quantity and avg_cost_basis start at 0 — they'll be set by the
 * transaction trigger when you insert the first buy transaction.
 */
export async function createAsset(input: {
  portfolioId: string
  ticker: string
  name: string
  assetClass: AssetClassEnum
  currency?: string
  logoUrl?: string
}): Promise<AssetRow> {
  const { data, error } = await supabase
    .from('assets')
    .insert({
      portfolio_id: input.portfolioId,
      ticker: input.ticker.toUpperCase(),
      name: input.name,
      asset_class: input.assetClass,
      currency: input.currency ?? 'USD',
      logo_url: input.logoUrl ?? null,
      current_price: 0,
    })
    .select()
    .single()

  if (error) throw new Error(`createAsset: ${error.message}`)

  return data as AssetRow
}

/**
 * Update an asset's market price.
 * NOTE: Never update quantity or avg_cost_basis directly — use transactions.
 */
export async function updateAssetPrice(
  assetId: string,
  currentPrice: number
): Promise<AssetRow> {
  const { data, error } = await supabase
    .from('assets')
    .update({ current_price: currentPrice })
    .eq('id', assetId)
    .select()
    .single()

  if (error) throw new Error(`updateAssetPrice: ${error.message}`)

  return data as AssetRow
}

/**
 * Update asset metadata.
 */
export async function updateAsset(
  assetId: string,
  input: { name?: string; logoUrl?: string }
): Promise<AssetRow> {
  const { data, error } = await supabase
    .from('assets')
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.logoUrl !== undefined && { logo_url: input.logoUrl }),
    })
    .eq('id', assetId)
    .select()
    .single()

  if (error) throw new Error(`updateAsset: ${error.message}`)

  return data as AssetRow
}

/**
 * Find or create an asset by ticker within a portfolio.
 */
export async function findOrCreateAsset(input: {
  portfolioId: string
  ticker: string
  name: string
  assetClass: AssetClassEnum
  currency?: string
}): Promise<AssetRow> {
  const { data: existing, error } = await supabase
    .from('assets')
    .select('*')
    .eq('portfolio_id', input.portfolioId)
    .eq('ticker', input.ticker.toUpperCase())
    .maybeSingle()

  if (error) throw new Error(`findOrCreateAsset: ${error.message}`)

  if (existing) return existing as AssetRow

  return createAsset(input)
}
