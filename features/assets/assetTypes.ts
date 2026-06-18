// ─── Unified Global Asset Model ───────────────────────────────────────────────
// Used for pre-defined market lists (top stocks, top crypto, etc.)
// This is the "catalog" type — not to be confused with the portfolio Asset type.

export type GlobalAssetType = 'stock' | 'crypto' | 'etf' | 'metal'

export interface GlobalAsset {
  /** Unique stable ID for this catalog entry */
  id: string
  /** Ticker / trading symbol */
  symbol: string
  /** Full human-readable name */
  name: string
  /** Asset class */
  type: GlobalAssetType
  /** Default trading currency */
  currency: string
}
