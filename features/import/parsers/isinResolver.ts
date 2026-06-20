const ISIN_TO_TICKER: Record<string, string> = {
  US69608A1088: 'PLTR',
  US6701002056: 'NVO',
  US0378331005: 'AAPL',
  US5949181045: 'MSFT',
  US88160R1014: 'TSLA',
  US02079K3059: 'GOOGL',
  US0231351067: 'AMZN',
  US67066G1040: 'NVDA',
  US30303M1027: 'META',
  US1912161007: 'KO',
  US5801351017: 'MCD',
  US0028241000: 'ABT',
  IE00B4L5Y983: 'IWDA',
  IE00B5BMR087: 'SXR8',
  IE00B3RBWM25: 'VWRL',
}

export function resolveIsinToTicker(value: string) {
  const clean = value.trim().toUpperCase()
  return ISIN_TO_TICKER[clean] ?? clean
}
