export function computeAssetPosition(
  asset: SimAsset,
  allTransactions: SimTransaction[],
  livePrices?: Map<string, number>
): AssetPosition {
  const txns = allTransactions
    .filter((t) => t.assetId === asset.id)
    .sort((a, b) => new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime())

  let totalBuyQty = 0
  let totalBuyCost = 0
  let totalSellQty = 0
  let totalSellProceeds = 0
  let totalFees = 0
  let currentPrice = 0
  let lastTradeAt: string | null = null

  for (const t of txns) {
    totalFees += t.fee

    if (t.type === 'buy') {
      totalBuyQty += t.quantity
      totalBuyCost += t.quantity * t.price + t.fee
    } else {
      totalSellQty += t.quantity
      totalSellProceeds += t.quantity * t.price - t.fee
    }

    currentPrice = t.price
    lastTradeAt = t.executedAt
  }

  const quantity = Math.max(totalBuyQty - totalSellQty, 0)

  const isInitialSnapshotOnly =
    txns.length === 1 &&
    txns[0]?.type === 'buy' &&
    txns[0]?.note === 'START_SNAPSHOT'

  const livePrice = livePrices?.get(asset.ticker)

  const isLivePrice =
    livePrice !== undefined &&
    totalBuyQty > 0 &&
    quantity > 0 &&
    !isInitialSnapshotOnly

  if (isLivePrice) {
    currentPrice = livePrice
  }

  const avgCostBasis = totalBuyQty > 0 ? totalBuyCost / totalBuyQty : 0

  const currentValue = quantity * currentPrice
  const costBasis = quantity * avgCostBasis

  const unrealizedGain = currentValue - costBasis
  const unrealizedGainPct = costBasis > 0 ? (unrealizedGain / costBasis) * 100 : 0

  const realizedGain = totalSellProceeds - totalSellQty * avgCostBasis

  return {
    quantity,
    avgCostBasis,
    currentPrice,
    currentValue,
    costBasis,
    unrealizedGain,
    unrealizedGainPct,
    realizedGain,
    totalFees,
    transactionCount: txns.length,
    lastTradeAt,
    hasPosition: quantity > 0,
    isLivePrice,
  }
}
