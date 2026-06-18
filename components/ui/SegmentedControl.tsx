import { cn } from '@/lib/utils'

interface SegmentOption<T extends string> {
  label: string
  value: T
  activeClassName?: string
}

interface SegmentedControlProps<T extends string> {
  label?: string
  value: T
  onChange: (value: T) => void
  options: SegmentOption<T>[]
  className?: string
}

export function SegmentedControl<T extends string>({
  label,
  value,
  onChange,
  options,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div>
      {label && (
        <label className="block text-data-xs font-medium text-ink-muted uppercase tracking-wide mb-1.5">
          {label}
        </label>
      )}
      <div className={cn('grid grid-cols-2 gap-2', className)}>
        {options.map((opt) => {
          const isActive = opt.value === value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                'rounded-lg border px-3 py-2.5 text-data-sm font-medium transition-all duration-150',
                isActive
                  ? opt.activeClassName ?? 'bg-signal/10 text-signal border-signal/30'
                  : 'bg-surface-raised text-ink-muted border-border hover:text-ink hover:border-border-strong'
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
