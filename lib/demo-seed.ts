/**
 * /lib/demo-seed.ts
 * Realistic demo data for the asset & transaction simulation.
 * Loaded via useSimulationStore().loadDemoData()
 */

import type { SimAsset, SimTransaction, SimPortfolio } from '@/types/simulation'

const now = () => new Date().toISOString()

export const DEMO_PORTFOLIO_ID = 'demo-portfolio-main'

export const DEMO_PORTFOLIOS: SimPortfolio[] = [
  { id: DEMO_PORTFOLIO_ID, name: 'Main Portfolio', icon: '💼', currency: 'USD', createdAt: '2022-10-01T10:00:00Z' },
]

export const DEMO_ASSETS: SimAsset[] = [
  { id: 'demo-aapl', portfolioId: DEMO_PORTFOLIO_ID, ticker: 'AAPL', name: 'Apple Inc.',                     assetClass: 'stock',  currency: 'USD', addedAt: '2023-01-15T10:00:00Z' },
  { id: 'demo-btc',  portfolioId: DEMO_PORTFOLIO_ID, ticker: 'BTC',  name: 'Bitcoin',                         assetClass: 'crypto', currency: 'USD', addedAt: '2023-03-10T11:00:00Z' },
  { id: 'demo-vti',  portfolioId: DEMO_PORTFOLIO_ID, ticker: 'VTI',  name: 'Vanguard Total Stock Market ETF', assetClass: 'etf',    currency: 'USD', addedAt: '2022-11-05T10:00:00Z' },
  { id: 'demo-msft', portfolioId: DEMO_PORTFOLIO_ID, ticker: 'MSFT', name: 'Microsoft Corporation',           assetClass: 'stock',  currency: 'USD', addedAt: '2023-02-20T10:00:00Z' },
  { id: 'demo-xau',  portfolioId: DEMO_PORTFOLIO_ID, ticker: 'XAU',  name: 'Gold (Spot)',                     assetClass: 'metal',  currency: 'USD', addedAt: '2023-06-01T10:00:00Z' },
  { id: 'demo-usd',  portfolioId: DEMO_PORTFOLIO_ID, ticker: 'USD',  name: 'US Dollar Cash',                  assetClass: 'cash',   currency: 'USD', addedAt: '2022-10-01T10:00:00Z' },
]

export const DEMO_TRANSACTIONS: SimTransaction[] = [
  { id: 'tx-aapl-1', assetId: 'demo-aapl', type: 'buy', quantity: 20, price: 130.00, fee: 1.99, executedAt: '2023-01-15T10:00:00Z', note: 'Initial AAPL position', createdAt: now() },
  { id: 'tx-aapl-2', assetId: 'demo-aapl', type: 'buy', quantity: 15, price: 152.50, fee: 1.99, executedAt: '2023-04-10T14:30:00Z', note: 'Added on dip', createdAt: now() },
  { id: 'tx-aapl-3', assetId: 'demo-aapl', type: 'buy', quantity: 15, price: 178.20, fee: 1.99, executedAt: '2023-08-01T09:45:00Z', note: 'Pre-earnings buy', createdAt: now() },
  { id: 'tx-aapl-4', assetId: 'demo-aapl', type: 'buy', quantity: 5,  price: 189.84, fee: 1.99, executedAt: '2024-01-15T14:30:00Z', note: 'Latest add', createdAt: now() },

  { id: 'tx-btc-1', assetId: 'demo-btc', type: 'buy', quantity: 0.50, price: 25000.00, fee: 9.99, executedAt: '2023-03-10T11:00:00Z', note: 'Bitcoin DCA entry', createdAt: now() },
  { id: 'tx-btc-2', assetId: 'demo-btc', type: 'buy', quantity: 0.25, price: 30000.00, fee: 9.99, executedAt: '2023-06-15T16:00:00Z', note: 'BTC DCA', createdAt: now() },
  { id: 'tx-btc-3', assetId: 'demo-btc', type: 'buy', quantity: 0.10, price: 35000.00, fee: 9.99, executedAt: '2023-10-20T09:00:00Z', note: 'BTC DCA', createdAt: now() },
  { id: 'tx-btc-4', assetId: 'demo-btc', type: 'buy', quantity: 0.15, price: 42350.00, fee: 9.99, executedAt: '2024-01-14T09:15:00Z', note: 'BTC top-up', createdAt: now() },

  { id: 'tx-vti-1', assetId: 'demo-vti', type: 'buy', quantity: 60, price: 195.00, fee: 0, executedAt: '2022-11-05T10:00:00Z', note: 'VTI core position', createdAt: now() },
  { id: 'tx-vti-2', assetId: 'demo-vti', type: 'buy', quantity: 40, price: 203.50, fee: 0, executedAt: '2023-02-01T10:00:00Z', note: 'VTI monthly DCA', createdAt: now() },

  { id: 'tx-msft-1', assetId: 'demo-msft', type: 'buy',  quantity: 20, price: 305.00, fee: 1.99, executedAt: '2023-02-20T10:00:00Z', note: 'MSFT initial', createdAt: now() },
  { id: 'tx-msft-2', assetId: 'demo-msft', type: 'buy',  quantity: 15, price: 320.00, fee: 1.99, executedAt: '2023-05-10T14:00:00Z', note: 'MSFT add', createdAt: now() },
  { id: 'tx-msft-3', assetId: 'demo-msft', type: 'sell', quantity: 5,  price: 358.00, fee: 1.99, executedAt: '2023-09-15T11:00:00Z', note: 'Partial profit taking', createdAt: now() },
  { id: 'tx-msft-4', assetId: 'demo-msft', type: 'buy',  quantity: 5,  price: 374.51, fee: 1.99, executedAt: '2024-01-10T11:45:00Z', note: 'MSFT re-add', createdAt: now() },

  { id: 'tx-xau-1', assetId: 'demo-xau', type: 'buy', quantity: 2, price: 1950.00, fee: 5.00, executedAt: '2023-06-01T10:00:00Z', note: 'Gold hedge', createdAt: now() },
  { id: 'tx-xau-2', assetId: 'demo-xau', type: 'buy', quantity: 1, price: 2050.00, fee: 5.00, executedAt: '2023-12-01T10:00:00Z', note: 'Gold add', createdAt: now() },

  { id: 'tx-usd-1', assetId: 'demo-usd', type: 'buy',  quantity: 5000, price: 1, fee: 0, executedAt: '2022-10-01T10:00:00Z', note: 'Initial deposit', createdAt: now() },
  { id: 'tx-usd-2', assetId: 'demo-usd', type: 'sell', quantity: 1200, price: 1, fee: 0, executedAt: '2023-01-15T10:00:00Z', note: 'Deployed into AAPL', createdAt: now() },
]
