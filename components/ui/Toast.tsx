'use client'

import { useToastStore, type ToastVariant } from '@/store/toast.store'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const VARIANT_META: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; iconColor: string; border: string }
> = {
  success: { icon: CheckCircle2, iconColor: 'text-gain', border: 'border-gain/30' },
  error: { icon: XCircle, iconColor: 'text-loss', border: 'border-loss/30' },
  warning: { icon: AlertTriangle, iconColor: 'text-amber', border: 'border-amber/30' },
  info: { icon: Info, iconColor: 'text-signal', border: 'border-signal/30' },
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const dismissToast = useToastStore((s) => s.dismissToast)

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm sm:bottom-6 sm:right-6"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const meta = VARIANT_META[toast.variant]
        const Icon = meta.icon

        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-start gap-3 rounded-xl border bg-surface-elevated p-3.5 shadow-glass-lg',
              'animate-slide-up',
              meta.border
            )}
            role="alert"
          >
            <Icon size={18} strokeWidth={2} className={cn('shrink-0 mt-0.5', meta.iconColor)} />
            <div className="flex-1 min-w-0">
              <p className="text-data-sm font-medium text-ink leading-snug">{toast.title}</p>
              {toast.description && (
                <p className="text-data-xs text-ink-muted mt-0.5 leading-relaxed">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss"
              className="shrink-0 text-ink-faint hover:text-ink transition-colors duration-150 p-0.5"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
