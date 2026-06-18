import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'
type SidebarState = 'expanded' | 'collapsed'

interface UIState {
  theme: Theme
  sidebar: SidebarState
  currency: string
  displayName: string
  email: string
  mobileSidebarOpen: boolean

  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setSidebar: (state: SidebarState) => void
  toggleSidebar: () => void
  setCurrency: (currency: string) => void
  setProfile: (input: { displayName?: string; email?: string }) => void
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
      displayName: 'Alex Investor',
      email: 'alex@folio.app',
      mobileSidebarOpen: false,

      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),

      setSidebar: (sidebar) => set({ sidebar }),
      toggleSidebar: () =>
        set({ sidebar: get().sidebar === 'expanded' ? 'collapsed' : 'expanded' }),

      setCurrency: (currency) => set({ currency }),

      setProfile: ({ displayName, email }) =>
        set((state) => ({
          displayName: displayName ?? state.displayName,
          email: email ?? state.email,
        })),

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
        displayName: state.displayName,
        email: state.email,
      }),
    }
  )
)
