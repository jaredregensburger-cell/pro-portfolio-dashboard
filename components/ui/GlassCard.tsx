'use client'

import { cn } from '@/lib/utils'
import type { HTMLAttributes, ReactNode } from 'react'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  accent?: 'signal' | 'gain' | 'loss' | 'violet' | 'amber' | 'none'
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  glow?: boolean
}

const accentMap = {
  signal: 'border-t-signal/50',
  gain: 'border-t-gain/50',
  loss: 'border-t-loss/50',
  violet: 'border-t-violet/50',
  amber: 'border-t-amber/50',
  none: 'border-t-border',
}

const glowMap = {
  signal: 'shadow-signal',
  gain: 'shadow-gain',
  loss: 'shadow-loss',
  violet: '',
  amber: '',
  none: '',
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export function GlassCard({
  children,
  accent = 'none',
  hover = false,
  padding = 'md',
  glow = false,
  className,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        // Base glass
        'rounded-xl border border-border bg-surface',
        'border-t-2',
        accentMap[accent],
        // Shadow
        'shadow-glass',
        glow && accent !== 'none' && glowMap[accent],
        // Hover
        hover && 'transition-all duration-200 hover:bg-surface-raised hover:border-border-strong cursor-pointer',
        // Padding
        paddingMap[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
