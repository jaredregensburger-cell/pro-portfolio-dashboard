import type { ImportParser, ImportRow } from './types'

function parseNumber(value: string) {
  const cleaned = String(value)
    .replace(/"/g, '')
    .replace(/,/g, '')
    .trim()

  const number = Number(cleaned)

  return Number.isFinite(number) ? number : 0
}

function mapAssetClass(subclass: string) {
  const value = subclass.toLowerCase().trim()

  if (value === 'crypto') return 'crypto'
  if (value === 'stable_coin') return 'cash'
  if (value === 'fiat') return 'cash'

  return 'crypto'
}

export const krakenParser: ImportParser = {
  id: 'kraken_balances',

  name: 'Kraken Balances',

  canParse(headers) {
    return (
      headers.includes('asset') &&
      headers.includes('aclass') &&
      headers.includes('subclass') &&
      headers.includes('wallet') &&
      headers.includes('quantity') &&
      headers.includes('price (usd)') &&
      headers.includes('value (usd)')
    )
  },

  parse(rows, headers) {
    const result: ImportRow[] = []

    rows.slice(1).forEach((cells) => {
      const get = (key: string) => cells[headers.indexOf(key)] ?? ''

      const asset = get('asset').trim().toUpperCase()
      const subclass = get('subclass').trim()
      const quantity = parseNumber(get('quantity'))
      const price = parseNumber(get('price (usd)'))

      if (!asset || asset === 'TOTAL') return
      if (quantity <= 0) return
      if (price <= 0) return

      result.push({
        ticker: asset,
        name: asset,
        asset_class: mapAssetClass(subclass),
        type: 'buy',
        quantity,
        price,
        date: new Date().toISOString(),
        source_id: `kraken-balance-${asset}-${quantity}-${price}`,
      })
    })

    if (result.length === 0) {
      throw new Error('Keine Kraken-Positionen gefunden.')
    }

    return result
  },
}
