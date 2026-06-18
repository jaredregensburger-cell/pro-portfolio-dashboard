import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import { type SelectHTMLAttributes, forwardRef } from 'react'

interface SelectOption {
  label: string
  value: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, className, id, ...props }, ref) => {
    const selectId = id ?? props.name

    return (
      <div>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-data-xs font-medium text-ink-muted uppercase tracking-wide mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full rounded-lg border bg-surface-raised px-3 py-2.5 pr-9 text-data-sm text-ink',
              'appearance-none cursor-pointer',
              'focus:outline-none focus:ring-1 transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error
                ? 'border-loss focus:border-loss focus:ring-loss'
                : 'border-border focus:border-signal focus:ring-signal',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
          />
        </div>
        {error && <p className="text-data-xs text-loss mt-1.5">{error}</p>}
        {hint && !error && <p className="text-data-xs text-ink-faint mt-1.5">{hint}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
