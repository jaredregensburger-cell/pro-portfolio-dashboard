import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'gain' | 'loss' | 'signal' | 'violet' | 'amber' | 'muted'
type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
  style?: React.CSSProperties
}

const variantMap: Record<BadgeVariant, string> = {
  default: 'bg-surface-elevated text-ink-muted border-border',
  gain: 'bg-gain/10 text-gain border-gain/20',
  loss: 'bg-loss/10 text-loss border-loss/20',
  signal: 'bg-signal/10 text-signal border-signal/20',
  violet: 'bg-violet/10 text-violet border-violet/20',
  amber: 'bg-amber/10 text-amber border-amber/20',
  muted: 'bg-surface text-ink-faint border-border-subtle',
}

const sizeMap: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-data-xs',
  md: 'px-2.5 py-1 text-data-sm',
}

export function Badge({ children, variant = 'default', size = 'md', className, style }: BadgeProps) {
  return (
    <span
      style={style}
      className={cn(
        'inline-flex items-center rounded-md border font-mono font-medium',
        variantMap[variant],
        sizeMap[size],
        className
      )}
    >
      {children}
    </span>
  )
}
