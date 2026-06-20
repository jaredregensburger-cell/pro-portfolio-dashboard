'use client'

import { GlassCard } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { PortfolioScoreResult } from './portfolioScore'
import { Sparkles, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

interface PortfolioInsightsProps {
  score: PortfolioScoreResult
}

function getIcon(status: 'good' | 'warning' | 'bad') {
  if (status === 'good') return CheckCircle2
  if (status === 'warning') return AlertTriangle
  return XCircle
}

function getColor(status: 'good' | 'warning' | 'bad') {
  if (status === 'good') return 'text-gain'
  if (status === 'warning') return 'text-yellow-400'
  return 'text-loss'
}

export function PortfolioInsights({ score }: PortfolioInsightsProps) {
  return (
    <GlassCard className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-signal" />
            <p className="text-data-sm font-semibold text-ink">
              Folio AI Analyse
            </p>
          </div>

          <p className="mt-1 text-data-sm text-ink-muted">
            Deine wichtigsten Portfolio-Signale auf einen Blick.
          </p>
        </div>

        <div className="text-right">
          <p className="font-mono text-data-2xl font-semibold text-ink">
            {score.score}
          </p>
          <p className="text-data-xs text-ink-muted">
            /100 · {score.label}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {score.insights.map((insight) => {
          const Icon = getIcon(insight.status)

          return (
            <div
              key={insight.label}
              className="rounded-xl border border-border bg-surface-raised p-4"
            >
              <div className="flex items-start gap-3">
                <Icon
                  size={17}
                  className={cn('mt-0.5 shrink-0', getColor(insight.status))}
                />

                <div>
                  <p className="text-data-sm font-semibold text-ink">
                    {insight.label}
                  </p>

                  <p className="mt-1 text-data-sm text-ink-muted">
                    {insight.message}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-signal/20 bg-signal/10 p-4">
        <p className="text-data-sm font-semibold text-ink">
          Folio AI Empfehlung
        </p>

        <p className="mt-1 text-data-sm text-ink-muted">
          Als Nächstes kann Folio dir konkrete Vorschläge zeigen, wie du deinen
          Score verbessern kannst — inklusive Risiko, Diversifikation und
          Rebalancing.
        </p>
      </div>
    </GlassCard>
  )
}
