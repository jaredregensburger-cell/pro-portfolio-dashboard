'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function OnboardingGate({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const publicPaths = ['/', '/login', '/onboarding']
    const isPublicPath = publicPaths.includes(pathname)

    const session =
      typeof window !== 'undefined'
        ? localStorage.getItem('folio-demo-session')
        : null

    if (!session && !isPublicPath) {
      router.replace('/' as any)
      return
    }

    setChecked(true)
  }, [pathname, router])

  if (!checked) {
    return <div className="min-h-screen bg-void" />
  }

  return <>{children}</>
}
