'use client'

import { cn } from '@/lib/utils'
import type { PortfolioImprovement } from './portfolioOptimizer'
import { Sparkles, ArrowUpRight } from 'lucide-react'

interface PortfolioOptimizerProps {
  improvements: PortfolioImprovement[]
}

function getPriorityLabel(priority: 'high' | 'medium' | 'low') {
  if (priority === 'high') return 'Hoch'
  if (priority === 'medium') return 'Mittel'
  return 'Niedrig'
}

export function PortfolioOptimizer({ improvements }: PortfolioOptimizerProps) {
  if (improvements.length === 0) {
    return null
  }

  return (
    <GlassCard className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-signal" />
            <p className="text-data-sm font-semibold text-ink">
              Folio AI Optimizer
            </p>
          </div>

          <p className="mt-1 text-data-sm text-ink-muted">
            So könntest du deinen Portfolio Score verbessern.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {improvements.map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-signal/20 bg-signal/10 p-4"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <p className="text-data-sm font-semibold text-ink">
                {item.title}
              </p>

              <span
                className={cn(
                  'rounded-full border border-border px-2 py-0.5 text-data-xs',
                  item.priority === 'high'
                    ? 'text-loss'
                    : item.priority === 'medium'
                      ? 'text-yellow-400'
                      : 'text-ink-muted'
                )}
              >
                {getPriorityLabel(item.priority)}
              </span>
            </div>

            <p className="text-data-sm text-ink-muted">
              {item.description}
            </p>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-data-xs text-ink-faint">
                Score Impact
              </p>

              <div className="flex items-center gap-1 text-gain">
                <ArrowUpRight size={14} />
                <span className="font-mono text-data-sm font-semibold">
                  +{item.impact}
                </span>
              </div>
            </div>

            <div className="mt-2 font-mono text-data-xs text-ink-muted">
              {item.currentScore} → {item.projectedScore}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
