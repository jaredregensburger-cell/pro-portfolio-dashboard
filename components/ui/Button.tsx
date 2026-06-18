import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
}

const variantMap: Record<ButtonVariant, string> = {
  primary:
    'bg-signal text-white hover:bg-signal-dim active:scale-[0.98] shadow-signal/20 shadow-md',
  secondary:
    'bg-surface-elevated text-ink border-border border hover:bg-surface-overlay hover:border-border-strong',
  ghost: 'text-ink-muted hover:text-ink hover:bg-surface-raised',
  danger: 'bg-loss/10 text-loss border-loss/20 border hover:bg-loss/20',
  outline: 'border border-border text-ink hover:bg-surface-raised',
}

const sizeMap: Record<ButtonSize, string> = {
  sm: 'h-7 px-3 text-data-sm gap-1.5',
  md: 'h-9 px-4 text-data-base gap-2',
  lg: 'h-11 px-6 text-data-lg gap-2.5',
  icon: 'h-9 w-9',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium',
          'transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
          variantMap[variant],
          sizeMap[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
