'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export function OnboardingGate({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const publicPaths = ['/', '/login', '/onboarding', '/auth/callback']
    const isPublicPath = publicPaths.includes(pathname)

    async function checkAuth() {
      const supabase = createSupabaseBrowserClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session && !isPublicPath) {
        router.replace('/')
        return
      }

      setChecked(true)
    }

    checkAuth()
  }, [pathname, router])

  if (!checked) {
    return <div className="min-h-screen bg-void" />
  }

  return <>{children}</>
}
