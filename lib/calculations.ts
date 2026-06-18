/**
 * /lib/calculations.ts
 *
 * @deprecated Re-export shim. The financial calculation engine now lives in
 * /features/portfolio/logic.ts — import from there directly in new code.
 * This file exists only so earlier imports (`@/lib/calculations`) keep working.
 */

export {
  computeAssetPosition,
  validateSell,
  getAllocation,
  getRankedPositions,
  getPortfolioAnalytics,
} from '@/features/portfolio/logic'
