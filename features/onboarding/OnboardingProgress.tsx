'use client'

import { cn } from '@/lib/utils'

interface OnboardingProgressProps {
  step: number
  totalSteps: number
}

export function OnboardingProgress({ step, totalSteps }: OnboardingProgressProps) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 rounded-full transition-all duration-300',
            i === step ? 'w-8 bg-signal' : i < step ? 'w-4 bg-signal/40' : 'w-4 bg-surface-elevated'
          )}
        />
      ))}
    </div>
  )
}
