import { create } from 'zustand'

export type ToastVariant = 'error' | 'success' | 'info' | 'warning'

export interface Toast {
  id: string
  variant: ToastVariant
  title: string
  description?: string
  /** Auto-dismiss after this many ms. Defaults to 5000. Pass 0 to require manual dismissal. */
  duration?: number
}

interface ToastState {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => string
  dismissToast: (id: string) => void
}

let counter = 0
function nextId(): string {
  counter += 1
  return `toast-${Date.now()}-${counter}`
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  showToast: (toast) => {
    const id = nextId()
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))

    const duration = toast.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => get().dismissToast(id), duration)
    }

    return id
  },

  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
}))

/**
 * Convenience helpers so call sites don't need to spell out the variant
 * every time — e.g. showErrorToast('Verkauf fehlgeschlagen', 'Nicht genug Bestand').
 */
export function showErrorToast(title: string, description?: string) {
  return useToastStore.getState().showToast({ variant: 'error', title, description })
}

export function showSuccessToast(title: string, description?: string) {
  return useToastStore.getState().showToast({ variant: 'success', title, description })
}

export function showInfoToast(title: string, description?: string) {
  return useToastStore.getState().showToast({ variant: 'info', title, description })
}

export function showWarningToast(title: string, description?: string) {
  return useToastStore.getState().showToast({ variant: 'warning', title, description })
}
