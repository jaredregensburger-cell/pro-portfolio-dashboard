import { cn } from '@/lib/utils'
import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  prefix?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, className, id, ...props }, ref) => {
    const inputId = id ?? props.name

    return (
      <div>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-data-xs font-medium text-ink-muted uppercase tracking-wide mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-data-sm text-ink-faint pointer-events-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-lg border bg-surface-raised text-data-sm text-ink',
              'placeholder:text-ink-faint',
              'focus:outline-none focus:ring-1 transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              prefix ? 'pl-7 pr-3' : 'px-3',
              'py-2.5',
              error
                ? 'border-loss focus:border-loss focus:ring-loss'
                : 'border-border focus:border-signal focus:ring-signal',
              // Number input spinner removal handled via custom class in globals if needed
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-data-xs text-loss mt-1.5">{error}</p>}
        {hint && !error && <p className="text-data-xs text-ink-faint mt-1.5">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
