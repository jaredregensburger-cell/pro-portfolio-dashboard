import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AssetClass } from '@/types'
import type { SimAsset, SimTransaction, SimTransactionType, SimPortfolio } from '@/types/simulation'
import { generateId } from '@/lib/utils'
import { validateSell } from '@/lib/calculations'
import { DEMO_ASSETS, DEMO_TRANSACTIONS, DEMO_PORTFOLIOS, DEMO_PORTFOLIO_ID } from '@/lib/demo-seed'

export interface AddAssetInput {
  ticker: string
  name: string
  assetClass: AssetClass
  currency?: string
  initialQuantity?: number
  initialValue?: number
  initialFee?: number
  initialNote?: string
}

export interface AddTransactionInput {
  assetId: string
  type: SimTransactionType
  quantity: number
  price: number
  fee?: number
  executedAt: string
  note?: string
}

export interface AddPortfolioInput {
  name: string
  icon?: string
  currency?: string
}

export type AddTransactionResult =
  | { success: true; transaction: SimTransaction }
  | { success: false; error: string }

export type AddAssetResult =
  | { success: true; asset: SimAsset }
  | { success: false; error: string }

export type AddPortfolioResult =
  | { success: true; portfolio: SimPortfolio }
  | { success: false; error: string }

interface SimulationState {
  portfolios: SimPortfolio[]
  activePortfolioId: string | null
  assets: SimAsset[]
  transactions: SimTransaction[]
  hasHydrated: boolean

  addPortfolio: (input: AddPortfolioInput) => AddPortfolioResult
  removePortfolio: (portfolioId: string) => void
  setActivePortfolio: (portfolioId: string) => void
  renamePortfolio: (portfolioId: string, name: string) => void

  addAsset: (input: AddAssetInput) => AddAssetResult
  removeAsset: (assetId: string) => void

  addTransaction: (input: AddTransactionInput) => AddTransactionResult
  removeTransaction: (transactionId: string) => void

  loadDemoData: () => void
  resetSimulation: () => void

  getActivePortfolio: () => SimPortfolio | null
  getAssetsForActive: () => SimAsset[]
  getTransactionsForActive: () => SimTransaction[]
}

function createDefaultPortfolio(): SimPortfolio {
  return {
    id: generateId('portfolio'),
    name: 'My Portfolio',
    icon: '💼',
    currency: 'USD',
    createdAt: new Date().toISOString(),
  }
}

export const useSimulationStore = create<SimulationState>()(
  persist(
    (set, get) => ({
      portfolios: [],
      activePortfolioId: null,
      assets: [],
      transactions: [],
      hasHydrated: false,

      addPortfolio: (input) => {
        const name = input.name.trim()
        if (!name) return { success: false, error: 'Name ist erforderlich' }

        const portfolio: SimPortfolio = {
          id: generateId('portfolio'),
          name,
          icon: input.icon ?? '💼',
          currency: input.currency ?? 'USD',
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          portfolios: [...state.portfolios, portfolio],
          activePortfolioId: portfolio.id,
        }))

        return { success: true, portfolio }
      },

      removePortfolio: (portfolioId) => {
        const { portfolios, assets, activePortfolioId } = get()
        if (portfolios.length <= 1) return

        const assetIdsInPortfolio = new Set(
          assets.filter((a) => a.portfolioId === portfolioId).map((a) => a.id)
        )

        const remainingPortfolios = portfolios.filter((p) => p.id !== portfolioId)

        set((state) => ({
          portfolios: remainingPortfolios,
          assets: state.assets.filter((a) => a.portfolioId !== portfolioId),
          transactions: state.transactions.filter((t) => !assetIdsInPortfolio.has(t.assetId)),
          activePortfolioId:
            activePortfolioId === portfolioId
              ? remainingPortfolios[0]?.id ?? null
              : activePortfolioId,
        }))
      },

      setActivePortfolio: (portfolioId) => set({ activePortfolioId: portfolioId }),

      renamePortfolio: (portfolioId, name) => {
        const trimmed = name.trim()
        if (!trimmed) return

        set((state) => ({
          portfolios: state.portfolios.map((p) =>
            p.id === portfolioId ? { ...p, name: trimmed } : p
          ),
        }))
      },

      addAsset: (input) => {
        const { activePortfolioId, assets } = get()

        if (!activePortfolioId) {
          return { success: false, error: 'Kein aktives Portfolio ausgewählt' }
        }

        const ticker = input.ticker.trim().toUpperCase()
        const name = input.name.trim()

        if (!ticker) return { success: false, error: 'Symbol ist erforderlich' }
        if (!name) return { success: false, error: 'Name ist erforderlich' }

        const exists = assets.some(
          (a) => a.portfolioId === activePortfolioId && a.ticker === ticker
        )

        if (exists) {
          return { success: false, error: `${ticker} existiert bereits in diesem Portfolio` }
        }

        const asset: SimAsset = {
          id: generateId('asset'),
          portfolioId: activePortfolioId,
          ticker,
          name,
          assetClass: input.assetClass,
          currency: input.currency ?? 'USD',
          addedAt: new Date().toISOString(),
        }

        const initialQuantity = input.initialQuantity ?? 0
        const initialValue = input.initialValue ?? 0
        const initialFee = input.initialFee ?? 0

        if (initialQuantity < 0) {
          return { success: false, error: 'Menge darf nicht negativ sein' }
        }

        if (initialValue < 0) {
          return { success: false, error: 'Wert darf nicht negativ sein' }
        }

        if (initialFee < 0) {
          return { success: false, error: 'Gebühr darf nicht negativ sein' }
        }

        if ((initialQuantity > 0 && initialValue <= 0) || (initialValue > 0 && initialQuantity <= 0)) {
          return {
            success: false,
            error: 'Für eine Startposition müssen Menge und aktueller Wert beide größer als 0 sein',
          }
        }

        const initialTransaction: SimTransaction | null =
          initialQuantity > 0 && initialValue > 0
            ? {
                id: generateId('tx'),
                assetId: asset.id,
                type: 'buy',
                quantity: initialQuantity,
                price: Math.max((initialValue - initialFee) / initialQuantity, 0),
                fee: initialFee,
                executedAt: new Date().toISOString(),
                note: input.initialNote ?? 'Startbestand',
                createdAt: new Date().toISOString(),
              }
            : null

        if (initialTransaction && initialTransaction.price <= 0) {
          return { success: false, error: 'Berechneter Preis muss größer als 0 sein' }
        }

        set((state) => ({
          assets: [...state.assets, asset],
          transactions: initialTransaction
            ? [...state.transactions, initialTransaction]
            : state.transactions,
        }))

        return { success: true, asset }
      },

      removeAsset: (assetId) => {
        set((state) => ({
          assets: state.assets.filter((a) => a.id !== assetId),
          transactions: state.transactions.filter((t) => t.assetId !== assetId),
        }))
      },

      addTransaction: (input) => {
        const { assets, transactions } = get()
        const asset = assets.find((a) => a.id === input.assetId)

        if (!asset) return { success: false, error: 'Asset nicht gefunden' }
        if (input.quantity <= 0) return { success: false, error: 'Menge muss größer als 0 sein' }
        if (input.price <= 0) return { success: false, error: 'Preis muss größer als 0 sein' }
        if (input.fee !== undefined && input.fee < 0) {
          return { success: false, error: 'Gebühr darf nicht negativ sein' }
        }

        if (input.type === 'sell') {
          const assetTxns = transactions.filter((t) => t.assetId === asset.id)
          const { valid, available } = validateSell(asset, assetTxns, input.quantity)

          if (!valid) {
            return {
              success: false,
              error: `Nicht genug Bestand: du hältst ${available} ${asset.ticker}, kannst aber nicht ${input.quantity} verkaufen`,
            }
          }
        }

        const transaction: SimTransaction = {
          id: generateId('tx'),
          assetId: input.assetId,
          type: input.type,
          quantity: input.quantity,
          price: input.price,
          fee: input.fee ?? 0,
          executedAt: input.executedAt,
          note: input.note,
          createdAt: new Date().toISOString(),
        }

        set((state) => ({ transactions: [...state.transactions, transaction] }))

        return { success: true, transaction }
      },

      removeTransaction: (transactionId) => {
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== transactionId),
        }))
      },

      loadDemoData: () => {
        set({
          portfolios: DEMO_PORTFOLIOS,
          activePortfolioId: DEMO_PORTFOLIO_ID,
          assets: DEMO_ASSETS,
          transactions: DEMO_TRANSACTIONS,
        })
      },

      resetSimulation: () => {
        const fresh = createDefaultPortfolio()

        set({
          portfolios: [fresh],
          activePortfolioId: fresh.id,
          assets: [],
          transactions: [],
        })
      },

      getActivePortfolio: () => {
        const { portfolios, activePortfolioId } = get()
        return portfolios.find((p) => p.id === activePortfolioId) ?? null
      },

      getAssetsForActive: () => {
        const { assets, activePortfolioId } = get()
        return assets.filter((a) => a.portfolioId === activePortfolioId)
      },

      getTransactionsForActive: () => {
        const { assets, transactions, activePortfolioId } = get()

        const activeAssetIds = new Set(
          assets.filter((a) => a.portfolioId === activePortfolioId).map((a) => a.id)
        )

        return transactions.filter((t) => activeAssetIds.has(t.assetId))
      },
    }),
    {
      name: 'folio-simulation',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2 && persistedState?.assets?.length > 0 && !persistedState.assets[0]?.portfolioId) {
          const fallbackPortfolio = createDefaultPortfolio()

          return {
            ...persistedState,
            portfolios: [fallbackPortfolio],
            activePortfolioId: fallbackPortfolio.id,
            assets: persistedState.assets.map((a: SimAsset) => ({
              ...a,
              portfolioId: fallbackPortfolio.id,
            })),
          }
        }

        return persistedState
      },
      onRehydrateStorage: () => (state) => {
        if (state && state.portfolios.length === 0) {
          const fresh = createDefaultPortfolio()
          state.portfolios = [fresh]
          state.activePortfolioId = fresh.id
        }

        if (state) state.hasHydrated = true
      },
    }
  )
)
