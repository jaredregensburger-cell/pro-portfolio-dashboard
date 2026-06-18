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
  syncDemoUser: () => void
  resetUser: () => void
  openMobileSidebar: () => void
  closeMobileSidebar: () => void
  toggleMobileSidebar: () => void
}

function getStoredDemoUser(): { name?: string; displayName?: string; email?: string } | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem('folio-demo-user')
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      sidebar: 'expanded',
      currency: 'USD',
      displayName: 'Investor',
      email: '',
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
          displayName: displayName?.trim() || state.displayName,
          email: email?.trim() || state.email,
        })),

      syncDemoUser: () => {
        const user = getStoredDemoUser()
        if (!user) return

        const name = user.displayName || user.name

        set((state) => ({
          displayName: name?.trim() || state.displayName || 'Investor',
          email: user.email?.trim() || state.email,
        }))
      },

      resetUser: () =>
        set({
          displayName: 'Investor',
          email: '',
          currency: 'USD',
          sidebar: 'expanded',
          theme: 'dark',
          mobileSidebarOpen: false,
        }),

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
