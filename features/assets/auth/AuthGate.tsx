'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from './AuthStore'

const PUBLIC_PATHS = ['/login', '/onboarding']

export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const user = useAuthStore((s) => s.user)
  const initialized = useAuthStore((s) => s.initialized)
  const initAuth = useAuthStore((s) => s.initAuth)

  useEffect(() => {
    if (!initialized) {
      initAuth()
    }
  }, [initialized, initAuth])

  useEffect(() => {
    if (!initialized) return

    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

    if (!user && !isPublic) {
      router.replace('/login')
      return
    }

    if (user && (pathname === '/login' || pathname === '/')) {
      router.replace('/dashboard')
    }
  }, [initialized, user, pathname, router])

  if (!initialized) {
    return <div className="min-h-screen bg-void" />
  }

  return <>{children}</>
}
