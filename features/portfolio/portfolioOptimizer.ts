import type { RankedPosition } from './logic'
import { calculatePortfolioScore } from './portfolioScore'

export type PortfolioImprovement = {
  title: string
  description: string
  impact: number
  currentScore: number
  projectedScore: number
  priority: 'high' | 'medium' | 'low'
}

export function getPortfolioImprovements(
  positions: RankedPosition[],
  totalValue: number
): PortfolioImprovement[] {
  const current = calculatePortfolioScore(positions, totalValue)
  const improvements: PortfolioImprovement[] = []

  const openPositions = positions.filter((p) => p.position.hasPosition)

  const cryptoValue = openPositions
    .filter((p) => p.asset.assetClass === 'crypto')
    .reduce((sum, p) => sum + p.position.currentValue, 0)

  const cryptoPct = totalValue > 0 ? (cryptoValue / totalValue) * 100 : 0

  const hasEtf = openPositions.some((p) => p.asset.assetClass === 'etf')

  const largestPosition = openPositions[0]
  const largestPct =
    largestPosition && totalValue > 0
      ? (largestPosition.position.currentValue / totalValue) * 100
      : 0

  if (!hasEtf && openPositions.length >= 2) {
    const projectedScore = Math.min(100, current.score + 8)

    improvements.push({
      title: 'ETF-Anteil aufbauen',
      description:
        'Ein breit gestreuter ETF kann dein Portfolio stabiler machen und die Abhängigkeit von Einzelpositionen reduzieren.',
      impact: projectedScore - current.score,
      currentScore: current.score,
      projectedScore,
      priority: 'high',
    })
  }

  if (cryptoPct > 40) {
    const impact = cryptoPct > 70 ? 12 : 7
    const projectedScore = Math.min(100, current.score + impact)

    improvements.push({
      title: 'Krypto-Gewichtung reduzieren',
      description:
        'Dein Portfolio ist stark von Krypto abhängig. Ein niedrigerer Krypto-Anteil kann Schwankungen reduzieren.',
      impact: projectedScore - current.score,
      currentScore: current.score,
      projectedScore,
      priority: cryptoPct > 70 ? 'high' : 'medium',
    })
  }

  if (largestPosition && largestPct > 30) {
    const projectedScore = Math.min(100, current.score + 7)

    improvements.push({
      title: `${largestPosition.asset.ticker}-Anteil begrenzen`,
      description:
        'Deine größte Position ist sehr dominant. Neue Käufe in andere Assets können das Klumpenrisiko senken.',
      impact: projectedScore - current.score,
      currentScore: current.score,
      projectedScore,
      priority: largestPct > 50 ? 'high' : 'medium',
    })
  }

  if (openPositions.length < 6) {
    const projectedScore = Math.min(100, current.score + 6)

    improvements.push({
      title: 'Mehr Positionen hinzufügen',
      description:
        'Weitere Positionen können dein Risiko breiter verteilen und dein Portfolio robuster machen.',
      impact: projectedScore - current.score,
      currentScore: current.score,
      projectedScore,
      priority: openPositions.length < 3 ? 'high' : 'medium',
    })
  }

  if (totalValue < 1000) {
    const projectedScore = Math.min(100, current.score + 4)

    improvements.push({
      title: 'Portfolio weiter aufbauen',
      description:
        'Mit mehr investiertem Kapital werden Portfolio-Signale aussagekräftiger und langfristige Analysen sinnvoller.',
      impact: projectedScore - current.score,
      currentScore: current.score,
      projectedScore,
      priority: 'low',
    })
  }

  return improvements
    .filter((item) => item.impact > 0)
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3)
}
