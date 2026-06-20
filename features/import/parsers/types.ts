export type ImportRow = {
  ticker: string
  name: string
  asset_class: string
  type: 'buy' | 'sell'
  quantity: number
  price: number
  date: string
  source_id?: string
}

export interface ImportParser {
  id: string
  name: string

  canParse(headers: string[]): boolean

  parse(
    rows: string[][],
    headers: string[]
  ): ImportRow[]
}
