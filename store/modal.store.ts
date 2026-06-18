import { create } from 'zustand'

export type ModalType =
  | 'add-asset'
  | 'add-transaction'
  | 'add-portfolio'
  | 'add-watchlist-item'
  | null

interface ModalContext {
  /** Pre-select an asset when opening the Add Transaction modal */
  assetId?: string
  /** Pre-select buy/sell when opening the Add Transaction modal */
  type?: 'buy' | 'sell'
  /** Pre-fill ticker/name when converting a watchlist item into a tracked asset */
  ticker?: string
  name?: string
}

interface ModalState {
  activeModal: ModalType
  context: ModalContext
  openModal: (modal: ModalType, context?: ModalContext) => void
  closeModal: () => void
}

export const useModalStore = create<ModalState>((set) => ({
  activeModal: null,
  context: {},

  openModal: (modal, context = {}) => set({ activeModal: modal, context }),

  closeModal: () => set({ activeModal: null, context: {} }),
}))
