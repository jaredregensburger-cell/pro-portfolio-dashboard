import type { RankedPosition } from './logic'

export type PortfolioScoreInsight = {
  label: string
  status: 'good' | 'warning' | 'bad'
  message: string
}

export type PortfolioScoreResult = {
  score: number
  label: string
  insights: PortfolioScoreInsight[]
}

export function calculatePortfolioScore(
  positions: RankedPosition[],
  totalValue: number
): PortfolioScoreResult {
  const openPositions = positions.filter((p) => p.position.hasPosition)
  const insights: PortfolioScoreInsight[] = []

  let score = 100

  if (openPositions.length < 3) {
    score -= 25
    insights.push({
      label: 'Diversifikation',
      status: 'bad',
      message: 'Dein Portfolio hat weniger als 3 aktive Positionen.',
    })
  } else if (openPositions.length < 6) {
    score -= 10
    insights.push({
      label: 'Diversifikation',
      status: 'warning',
      message: 'Mehr Positionen könnten dein Risiko besser verteilen.',
    })
  } else {
    insights.push({
      label: 'Diversifikation',
      status: 'good',
      message: 'Dein Portfolio ist über mehrere Positionen verteilt.',
    })
  }

  const largestPosition = openPositions[0]

  if (largestPosition && totalValue > 0) {
    const largestPct =
      (largestPosition.position.currentValue / totalValue) * 100

    if (largestPct > 50) {
      score -= 25
      insights.push({
        label: 'Klumpenrisiko',
        status: 'bad',
        message: `${largestPosition.asset.ticker} macht ${largestPct.toFixed(0)} % deines Portfolios aus.`,
      })
    } else if (largestPct > 30) {
      score -= 10
      insights.push({
        label: 'Klumpenrisiko',
        status: 'warning',
        message: `${largestPosition.asset.ticker} ist mit ${largestPct.toFixed(0)} % sehr dominant.`,
      })
    } else {
      insights.push({
        label: 'Klumpenrisiko',
        status: 'good',
        message: 'Keine einzelne Position dominiert dein Portfolio.',
      })
    }
  }

  const assetClasses = new Set(
    openPositions.map((p) => p.asset.assetClass)
  )

  if (assetClasses.size === 1) {
    score -= 20
    insights.push({
      label: 'Asset-Mix',
      status: 'bad',
      message: 'Dein Portfolio besteht nur aus einer Asset-Klasse.',
    })
  } else if (assetClasses.size === 2) {
    score -= 8
    insights.push({
      label: 'Asset-Mix',
      status: 'warning',
      message: 'Dein Portfolio nutzt bisher nur wenige Asset-Klassen.',
    })
  } else {
    insights.push({
      label: 'Asset-Mix',
      status: 'good',
      message: 'Dein Portfolio ist über mehrere Asset-Klassen verteilt.',
    })
  }

  const cashValue = openPositions
    .filter((p) => p.asset.assetClass === 'cash')
    .reduce((sum, p) => sum + p.position.currentValue, 0)

  const cashPct = totalValue > 0 ? (cashValue / totalValue) * 100 : 0

  if (cashPct > 40) {
    score -= 10
    insights.push({
      label: 'Cashquote',
      status: 'warning',
      message: `Deine Cashquote liegt bei ${cashPct.toFixed(0)} %.`,
    })
  } else {
    insights.push({
      label: 'Cashquote',
      status: 'good',
      message: 'Deine Cashquote wirkt nicht übermäßig hoch.',
    })
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)))

  return {
    score: finalScore,
    label:
      finalScore >= 80
        ? 'Stark'
        : finalScore >= 60
          ? 'Solide'
          : finalScore >= 40
            ? 'Ausbaufähig'
            : 'Riskant',
    insights,
  }
}
