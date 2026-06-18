'use client'

import { useEffect } from 'react'
import { useUIStore } from '@/store'
import { Sidebar } from './Sidebar'
import { cn } from '@/lib/utils'

export function MobileSidebar() {
  const mobileSidebarOpen = useUIStore((s) => s.mobileSidebarOpen)
  const closeMobileSidebar = useUIStore((s) => s.closeMobileSidebar)

  // Lock body scroll while the drawer is open, close on Escape
  useEffect(() => {
    if (!mobileSidebarOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobileSidebar()
    }
    document.addEventListener('keydown', handleKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [mobileSidebarOpen, closeMobileSidebar])

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 lg:hidden',
        mobileSidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'
      )}
      aria-hidden={!mobileSidebarOpen}
    >
      {/* Overlay */}
      <div
        onClick={closeMobileSidebar}
        className={cn(
          'absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200',
          mobileSidebarOpen ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Drawer */}
      <div
        className={cn(
          'absolute left-0 top-0 h-full transition-transform duration-300 ease-in-out',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar variant="mobile" />
      </div>
    </div>
  )
}
