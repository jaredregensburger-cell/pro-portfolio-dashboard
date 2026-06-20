import type { RankedPosition } from './logic'

export type PortfolioScoreInsight = {
  label: string
  status: 'good' | 'warning' | 'bad'
  message: string
}

export type PortfolioRecommendation = {
  title: string
  priority: 'high' | 'medium' | 'low'
  message: string
}

export type PortfolioScoreResult = {
  score: number
  label: string
  insights: PortfolioScoreInsight[]
  recommendations: PortfolioRecommendation[]
}

export function calculatePortfolioScore(
  positions: RankedPosition[],
  totalValue: number
): PortfolioScoreResult {
  const openPositions = positions.filter((p) => p.position.hasPosition)
  const insights: PortfolioScoreInsight[] = []
  const recommendations: PortfolioRecommendation[] = []

  recommendations.push({
  title: 'Krypto-Risiko senken',
  priority: 'high',
  message: 'Dein Portfolio ist stark von Krypto abhängig. Ein ETF- oder Cash-Anteil könnte die Schwankungen reduzieren.',
})

  recommendations.push({
  title: 'Breitere Basis aufbauen',
  priority: 'medium',
  message: 'Ein breit gestreuter ETF kann helfen, dein Portfolio stabiler und weniger abhängig von Einzelpositionen zu machen.',
})

  recommendations.push({
  title: 'Klumpenrisiko reduzieren',
  priority: 'high',
  message: 'Eine einzelne Position dominiert dein Portfolio. Prüfe, ob du neue Käufe stärker auf andere Assets verteilst.',
})

  let score = 100

  if (totalValue < 100) {
    score -= 20
    insights.push({
      label: 'Portfolio-Größe',
      status: 'warning',
      message: `Dein Portfolio ist mit ${totalValue.toFixed(2)} € noch sehr klein. Die Analyse wird aussagekräftiger, sobald mehr Kapital investiert ist.`,
    })
  } else if (totalValue < 1000) {
    score -= 8
    insights.push({
      label: 'Portfolio-Größe',
      status: 'warning',
      message: 'Dein Portfolio ist noch klein. Erste Signale sind sichtbar, aber langfristige Aussagen sind begrenzt.',
    })
  } else {
    insights.push({
      label: 'Portfolio-Größe',
      status: 'good',
      message: 'Dein Portfolio hat genug Volumen für eine sinnvollere Analyse.',
    })
  }

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
      score -= 12
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

  const cryptoValue = openPositions
    .filter((p) => p.asset.assetClass === 'crypto')
    .reduce((sum, p) => sum + p.position.currentValue, 0)

  const cryptoPct = totalValue > 0 ? (cryptoValue / totalValue) * 100 : 0

  if (cryptoPct > 70) {
    score -= 18
    insights.push({
      label: 'Krypto-Gewichtung',
      status: 'bad',
      message: `Krypto macht ${cryptoPct.toFixed(0)} % deines Portfolios aus. Das kann sehr volatil sein.`,
    })
  } else if (cryptoPct > 40) {
    score -= 10
    insights.push({
      label: 'Krypto-Gewichtung',
      status: 'warning',
      message: `Krypto macht ${cryptoPct.toFixed(0)} % deines Portfolios aus. Prüfe, ob das zu deinem Risiko passt.`,
    })
  } else {
    insights.push({
      label: 'Krypto-Gewichtung',
      status: 'good',
      message: 'Deine Krypto-Gewichtung wirkt nicht übermäßig hoch.',
    })
  }

  const hasEtf = openPositions.some((p) => p.asset.assetClass === 'etf')

  if (!hasEtf && openPositions.length >= 3) {
    score -= 10
    insights.push({
      label: 'ETF-Anteil',
      status: 'warning',
      message: 'Du hast aktuell keinen ETF im Portfolio. ETFs können helfen, breiter zu diversifizieren.',
    })
  } else if (hasEtf) {
    insights.push({
      label: 'ETF-Anteil',
      status: 'good',
      message: 'ETF-Anteil vorhanden. Das kann die Stabilität deines Portfolios verbessern.',
    })
  }

  const assetClasses = new Set(
    openPositions.map((p) => p.asset.assetClass)
  )

  if (assetClasses.size === 1) {
    score -= 18
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
      message: `Deine Cashquote liegt bei ${cashPct.toFixed(0)} %. Zu viel Cash kann Rendite kosten.`,
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
  recommendations,
}
