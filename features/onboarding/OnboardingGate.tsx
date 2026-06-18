'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useOnboardingStore } from '@/store'

export function OnboardingGate({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const hasCompletedOnboarding = useOnboardingStore((s) => s.hasCompletedOnboarding)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const publicPaths = ['/', '/login', '/onboarding']
    const isPublicPath = publicPaths.includes(pathname)

    if (!hasCompletedOnboarding && !isPublicPath) {
      router.replace('/' as any)
      return
    }

    setChecked(true)
  }, [hasCompletedOnboarding, pathname, router])

  if (!checked) {
    return <div className="min-h-screen bg-void" />
  }

  return <>{children}</>
}
