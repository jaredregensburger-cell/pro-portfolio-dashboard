'use client'

import { useCallback, useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { SimAsset, SimTransaction } from '@/types/simulation'
import type { AssetClass } from '@/types'

export interface ActivePortfolioData {
  portfolioId: string | null
  assets: SimAsset[]
  transactions: SimTransaction[]
  hasHydrated: boolean
  reload: () => Promise<void>
}

type DbPortfolio = {
  id: string
  user_id: string
  name: string
  currency: string
  is_default: boolean
}

type DbAsset = {
  id: string
  portfolio_id: string
  ticker: string
  name: string
  asset_class: string
  currency: string
  added_at?: string | null
  created_at?: string | null
}

type DbTransaction = {
  id: string
  portfolio_id: string
  asset_id: string | null
  type: string
  quantity: number | null
  price: number | null
  fee: number | null
  executed_at: string
  note: string | null
  created_at: string
}

function mapAssetClass(value: string): AssetClass {
  if (value === 'equity') return 'stock'
  if (value === 'commodity') return 'metal'
  if (value === 'crypto') return 'crypto'
  if (value === 'etf') return 'etf'
  if (value === 'cash') return 'cash'
  return 'stock'
}

export function useActivePortfolioData(): ActivePortfolioData {
  const [portfolioId, setPortfolioId] = useState<string | null>(null)
  const [assets, setAssets] = useState<SimAsset[]>([])
  const [transactions, setTransactions] = useState<SimTransaction[]>([])
  const [hasHydrated, setHasHydrated] = useState(false)

  const load = useCallback(async () => {
    setHasHydrated(false)

    const supabase = createSupabaseBrowserClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setPortfolioId(null)
      setAssets([])
      setTransactions([])
      setHasHydrated(true)
      return
    }

    let portfolio: DbPortfolio | null = null

    const { data: defaultPortfolio, error: defaultError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .maybeSingle()

    if (defaultError) {
      console.error('Default portfolio load error:', defaultError)
    }

    portfolio = defaultPortfolio as DbPortfolio | null

    if (!portfolio) {
      const { data: firstPortfolio, error: firstError } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (firstError) {
        console.error('First portfolio load error:', firstError)
      }

      portfolio = firstPortfolio as DbPortfolio | null
    }

    if (!portfolio) {
      const { data: createdPortfolio, error: createError } = await supabase
        .from('portfolios')
        .insert({
          user_id: user.id,
          name: 'Mein Portfolio',
          description: 'Default portfolio',
          currency: 'EUR',
          is_default: true,
        })
        .select('*')
        .single()

      if (createError) {
        console.error('Portfolio create error:', createError)
        setPortfolioId(null)
        setAssets([])
        setTransactions([])
        setHasHydrated(true)
        return
      }

      portfolio = createdPortfolio as DbPortfolio
    }

    const [{ data: dbAssets, error: assetsError }, { data: dbTransactions, error: txError }] =
      await Promise.all([
        supabase
          .from('assets')
          .select('*')
          .eq('portfolio_id', portfolio.id)
          .order('added_at', { ascending: true }),

        supabase
          .from('transactions')
          .select('*')
          .eq('portfolio_id', portfolio.id)
          .order('executed_at', { ascending: false }),
      ])

    if (assetsError) console.error('Assets load error:', assetsError)
    if (txError) console.error('Transactions load error:', txError)

    const mappedAssets: SimAsset[] = ((dbAssets ?? []) as DbAsset[]).map((asset) => ({
      id: asset.id,
      portfolioId: asset.portfolio_id,
      ticker: asset.ticker,
      name: asset.name,
      assetClass: mapAssetClass(asset.asset_class),
      currency: asset.currency,
      addedAt: asset.added_at ?? asset.created_at ?? new Date().toISOString(),
    }))

    const mappedTransactions: SimTransaction[] = ((dbTransactions ?? []) as DbTransaction[])
      .filter((tx) => tx.type === 'buy' || tx.type === 'sell')
      .filter((tx) => tx.asset_id)
      .filter((tx) => tx.quantity !== null && tx.price !== null)
      .map((tx) => ({
        id: tx.id,
        assetId: tx.asset_id as string,
        type: tx.type as 'buy' | 'sell',
        quantity: Number(tx.quantity),
        price: Number(tx.price),
        fee: Number(tx.fee ?? 0),
        executedAt: tx.executed_at,
        note: tx.note ?? undefined,
        createdAt: tx.created_at,
      }))

    setPortfolioId(portfolio.id)
    setAssets(mappedAssets)
    setTransactions(mappedTransactions)
    setHasHydrated(true)
  }, [])

  useEffect(() => {
    load()

    const handleRefresh = () => {
      load()
    }

    window.addEventListener('folio:portfolio-changed', handleRefresh)

    return () => {
      window.removeEventListener('folio:portfolio-changed', handleRefresh)
    }
  }, [load])

  return {
    portfolioId,
    assets,
    transactions,
    hasHydrated,
    reload: load,
  }
}
