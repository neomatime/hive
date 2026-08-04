'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

type Overrides = Record<string, string>

const BreadcrumbContext = createContext<{
  overrides: Overrides
  setOverride: (segment: string, label: string) => void
} | null>(null)

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<Overrides>({})
  const setOverride = useCallback((segment: string, label: string) => {
    setOverrides((current) =>
      current[segment] === label ? current : { ...current, [segment]: label }
    )
  }, [])
  return (
    <BreadcrumbContext.Provider value={{ overrides, setOverride }}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export function useBreadcrumbOverrides(): Overrides {
  return useContext(BreadcrumbContext)?.overrides ?? {}
}

// Lets a deeply-nested page (e.g. a project's layout, which already fetched
// the project's name server-side) tell the Topbar's breadcrumb trail what a
// dynamic route segment (a project id) should actually display, without
// re-fetching that data or prop-drilling it back up through the shell.
export function RegisterBreadcrumbLabel({ segment, label }: { segment: string; label: string }) {
  const ctx = useContext(BreadcrumbContext)
  useEffect(() => {
    ctx?.setOverride(segment, label)
  }, [ctx, segment, label])
  return null
}
