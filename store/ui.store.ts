import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'
type SidebarState = 'expanded' | 'collapsed'

interface UIState {
  theme: Theme
  sidebar: SidebarState
  currency: string
  /** Mobile-only: whether the sidebar drawer is open. Never persisted. */
  mobileSidebarOpen: boolean

  // Actions
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setSidebar: (state: SidebarState) => void
  toggleSidebar: () => void
  setCurrency: (currency: string) => void
  openMobileSidebar: () => void
  closeMobileSidebar: () => void
  toggleMobileSidebar: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      sidebar: 'expanded',
      currency: 'USD',
      mobileSidebarOpen: false,

      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),

      setSidebar: (sidebar) => set({ sidebar }),
      toggleSidebar: () =>
        set({ sidebar: get().sidebar === 'expanded' ? 'collapsed' : 'expanded' }),

      setCurrency: (currency) => set({ currency }),

      openMobileSidebar: () => set({ mobileSidebarOpen: true }),
      closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
      toggleMobileSidebar: () => set({ mobileSidebarOpen: !get().mobileSidebarOpen }),
    }),
    {
      name: 'ui-preferences',
      partialize: (state) => ({
        theme: state.theme,
        sidebar: state.sidebar,
        currency: state.currency,
        // mobileSidebarOpen is intentionally excluded — always starts closed
      }),
    }
  )
)
