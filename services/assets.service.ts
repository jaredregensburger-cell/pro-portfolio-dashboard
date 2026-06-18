/**
 * Assets Service
 * All Supabase data access for individual assets/positions.
 */

import type { Asset, AssetClass, PaginatedResponse } from '@/types'

interface FetchAssetsOptions {
  portfolioId: string
  assetClass?: AssetClass
  page?: number
  pageSize?: number
}

/**
 * Fetch paginated assets for a portfolio
 * TODO: supabase.from('assets').select('*').eq('portfolio_id', portfolioId)
 */
export async function fetchAssets(
  _options: FetchAssetsOptions
): Promise<PaginatedResponse<Asset>> {
  await new Promise((r) => setTimeout(r, 300))
  return { data: [], total: 0, page: 1, pageSize: 20, hasMore: false }
}

/**
 * Add a new asset/position to a portfolio
 */
export async function createAsset(
  _portfolioId: string,
  _data: Omit<Asset, 'id' | 'addedAt' | 'updatedAt'>
): Promise<Asset | null> {
  await new Promise((r) => setTimeout(r, 300))
  return null
}

/**
 * Update an existing position (e.g. quantity, avg cost basis)
 */
export async function updateAsset(
  _assetId: string,
  _data: Partial<Asset>
): Promise<Asset | null> {
  await new Promise((r) => setTimeout(r, 200))
  return null
}

/**
 * Close / remove a position from a portfolio
 */
export async function deleteAsset(_assetId: string): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 200))
  return true
}

/**
 * Refresh current price for a single asset
 * In production: call a price service Edge Function
 */
export async function refreshAssetPrice(
  _ticker: string
): Promise<{ price: number; updatedAt: string } | null> {
  await new Promise((r) => setTimeout(r, 500))
  return null
}
