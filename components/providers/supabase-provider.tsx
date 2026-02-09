'use client'

import { useEffect } from 'react'
import { useInitialHydration } from '@/hooks/admin/useInitialHydration'

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const { isHydrated, hydrate } = useInitialHydration()

  useEffect(() => {
    if (!isHydrated) {
      void hydrate()
    }
  }, [hydrate, isHydrated])

  return <>{children}</>
}
