import type { ImportParser, ImportRow } from './types'
import { resolveIsinToTicker } from './isinResolver'

function normalizeAssetClass(value: string) {
  const v = value.toLowerCase().trim()

  if (v === 'stock') return 'stock'
  if (v === 'crypto') return 'crypto'
  if (v === 'etf') return 'etf'

  return 'stock'
}

export const tradeRepublicParser: ImportParser = {
  id: 'trade_republic',

  name: 'Trade Republic',

  canParse(headers) {
    return (
      headers.includes('transaction_id') &&
      headers.includes('shares') &&
      headers.includes('symbol') &&
      headers.includes('category')
    )
  },

  parse(rows, headers) {
    const result: ImportRow[] = []

    rows.slice(1).forEach((cells) => {
      const get = (key: string) =>
        cells[headers.indexOf(key)] ?? ''

      const category = get('category').toUpperCase()
      const type = get('type').toUpperCase()

      if (category !== 'TRADING') return
      if (type !== 'BUY' && type !== 'SELL') return

      const symbol = get('symbol').trim().toUpperCase()
      
      result.push({
        ticker: resolveIsinToTicker(symbol),
        name: get('name').trim(),
        asset_class: normalizeAssetClass(get('asset_class')),
        type: type === 'BUY' ? 'buy' : 'sell',
        quantity: Number(get('shares')),
        price: Number(get('price')),
        date: get('datetime') || get('date'),
        source_id: get('transaction_id'),
      })
    })

    return result
  },
}
