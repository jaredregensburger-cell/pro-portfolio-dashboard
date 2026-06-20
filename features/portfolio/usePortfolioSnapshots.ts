'use client'

import { useCallback, useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { PortfolioValuePoint } from '@/features/portfolio/logic'

type DbSnapshot = {
  id: string
  portfolio_id: string
  total_value: number
  total_cost: number
  currency: string
  interval: string
  snapshot_date: string
  created_at: string
}

export function usePortfolioSnapshots(portfolioId: string | null) {
  const [points, setPoints] = useState<PortfolioValuePoint[]>([])
  const [loading, setLoading] = useState(false)

  const loadSnapshots = useCallback(async () => {
    if (!portfolioId) {
      setPoints([])
      return
    }

    setLoading(true)

    try {
      const supabase = createSupabaseBrowserClient()

      const { data, error } = await supabase
        .from('portfolio_snapshots')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .eq('interval', 'daily')
        .order('snapshot_date', { ascending: true })

      if (error) throw error

      const mapped: PortfolioValuePoint[] = ((data ?? []) as DbSnapshot[]).map((item) => {
        const totalValue = Number(item.total_value)
        const totalCost = Number(item.total_cost)
        const gain = totalValue - totalCost

        return {
          date: item.snapshot_date,
          totalValue,
          totalCost,
          gain,
          gainPct: totalCost > 0 ? (gain / totalCost) * 100 : 0,
        }
      })

      setPoints(mapped)
    } catch (err) {
      console.error('Portfolio snapshots load error:', err)
      setPoints([])
    } finally {
      setLoading(false)
    }
  }, [portfolioId])

  useEffect(() => {
    loadSnapshots()

    const handleRefresh = () => {
      loadSnapshots()
    }

    window.addEventListener('folio:portfolio-changed', handleRefresh)

    return () => {
      window.removeEventListener('folio:portfolio-changed', handleRefresh)
    }
  }, [loadSnapshots])

  return {
    points,
    loading,
    reload: loadSnapshots,
  }
}
