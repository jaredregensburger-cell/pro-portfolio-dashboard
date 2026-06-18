import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { InvestorProfile, InvestorType } from '@/types/simulation'

interface OnboardingState {
  hasCompletedOnboarding: boolean
  profile: InvestorProfile | null

  completeOnboarding: (input: {
    investorType: InvestorType
    primaryGoal: string
    experienceLevel: InvestorProfile['experienceLevel']
  }) => void
  skipOnboarding: () => void
  resetOnboarding: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      profile: null,

      completeOnboarding: (input) =>
        set({
          hasCompletedOnboarding: true,
          profile: { ...input, completedAt: new Date().toISOString() },
        }),

      skipOnboarding: () => set({ hasCompletedOnboarding: true, profile: null }),

      resetOnboarding: () => set({ hasCompletedOnboarding: false, profile: null }),
    }),
    { name: 'folio-onboarding', version: 1 }
  )
)
