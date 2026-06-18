'use client'

/**
 * /features/onboarding/OnboardingGate.tsx
 *
 * Wraps AppShell's content. On first load, checks whether the persisted
 * onboarding state (zustand + localStorage) says the user has completed
 * — or explicitly skipped — onboarding. If not, redirects to /onboarding
 * before rendering anything else.
 *
 * Onboarding state lives client-side only, so this check happens after
 * mount rather than in a server component — to avoid a flash of the full
 * dashboard before redirecting, we render nothing (just the void background)
 * until the check resolves.
 */

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useOnboardingStore } from '@/store'

export function OnboardingGate({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const hasCompletedOnboarding = useOnboardingStore((s) => s.hasCompletedOnboarding)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Zustand's persist middleware rehydrates synchronously on the client
    // by the time this effect runs, so a single check after mount is enough.
    if (!hasCompletedOnboarding && pathname !== '/onboarding') {
      router.replace('/onboarding')
      return
    }
    setChecked(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCompletedOnboarding, pathname])

  if (!checked) {
    return <div className="min-h-screen bg-void" />
  }

  return <>{children}</>
}
