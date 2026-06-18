'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface OnboardingOptionCardProps {
  icon: React.ReactNode
  title: string
  description: string
  selected: boolean
  onClick: () => void
}

export function OnboardingOptionCard({
  icon,
  title,
  description,
  selected,
  onClick,
}: OnboardingOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-start gap-3 rounded-xl border p-5 text-left',
        'transition-all duration-200 hover:-translate-y-0.5',
        selected
          ? 'border-signal bg-signal/10 shadow-signal'
          : 'border-border bg-surface hover:border-border-strong hover:bg-surface-raised'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg text-data-xl transition-colors duration-200',
          selected ? 'bg-signal/20' : 'bg-surface-elevated'
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-data-base font-semibold text-ink">{title}</p>
        <p className="text-data-sm text-ink-muted mt-1 leading-relaxed">{description}</p>
      </div>

      {selected && (
        <div className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-signal animate-fade-in">
          <Check size={12} strokeWidth={3} className="text-white" />
        </div>
      )}
    </button>
  )
}
