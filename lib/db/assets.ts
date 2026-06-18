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

// Supabase generated types are currently too strict / broken in this project.
// This keeps the build working until the database types are regenerated.
const db = supabase as any

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getAssets(
  portfolioId: string,
  filters?: { assetClass?: AssetClassEnum; activeOnly?: boolean }
): Promise<AssetPerformanceView[]> {
  let query = db
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

export async function getAsset(assetId: string): Promise<AssetPerformanceView | null> {
  const { data, error } = await db
    .from('v_asset_performance')
    .select('*')
    .eq('asset_id', assetId)
    .maybeSingle()

  if (error) throw new Error(`getAsset: ${error.message}`)

  return data as AssetPerformanceView | null
}

export async function getAssetAllocation(portfolioId: string): Promise<
  {
    assetClass: AssetClassEnum
    value: number
    pct: number
  }[]
> {
  const { data, error } = await db
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

export async function createAsset(input: {
  portfolioId: string
  ticker: string
  name: string
  assetClass: AssetClassEnum
  currency?: string
  logoUrl?: string
}): Promise<AssetRow> {
  const { data, error } = await db
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

export async function updateAssetPrice(
  assetId: string,
  currentPrice: number
): Promise<AssetRow> {
  const { data, error } = await db
    .from('assets')
    .update({ current_price: currentPrice })
    .eq('id', assetId)
    .select()
    .single()

  if (error) throw new Error(`updateAssetPrice: ${error.message}`)

  return data as AssetRow
}

export async function updateAsset(
  assetId: string,
  input: { name?: string; logoUrl?: string }
): Promise<AssetRow> {
  const { data, error } = await db
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

export async function findOrCreateAsset(input: {
  portfolioId: string
  ticker: string
  name: string
  assetClass: AssetClassEnum
  currency?: string
}): Promise<AssetRow> {
  const { data: existing, error } = await db
    .from('assets')
    .select('*')
    .eq('portfolio_id', input.portfolioId)
    .eq('ticker', input.ticker.toUpperCase())
    .maybeSingle()

  if (error) throw new Error(`findOrCreateAsset: ${error.message}`)

  if (existing) return existing as AssetRow

  return createAsset(input)
}
