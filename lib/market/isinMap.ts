export const ISIN_TO_TICKER: Record<string, string> = {
  US69608A1088: 'PLTR',
  US6701002056: 'NVO',
}

export function resolveIsinToTicker(value: string) {
  const clean = value.trim().toUpperCase()
  return ISIN_TO_TICKER[clean] ?? clean
}
