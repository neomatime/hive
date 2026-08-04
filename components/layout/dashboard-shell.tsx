'use client'

import { useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/navigation/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { BreadcrumbProvider } from '@/components/layout/breadcrumb-context'
import type { CurrentUserWithMembership } from '@/services/workspace/workspace-service'

const SIDEBAR_COLLAPSED_KEY = 'hive-sidebar-collapsed'

// useSyncExternalStore (not useState + useEffect) so the persisted preference
// reads correctly on the client's very first render with no hydration
// mismatch -- getServerSnapshot below matches the always-expanded server HTML.
const collapseListeners = new Set<() => void>()
function subscribeCollapsed(listener: () => void) {
  collapseListeners.add(listener)
  return () => collapseListeners.delete(listener)
}
function getCollapsedSnapshot() {
  return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
}
function getCollapsedServerSnapshot() {
  return false
}
function setSidebarCollapsed(next: boolean) {
  window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next))
  collapseListeners.forEach((listener) => listener())
}

// This is a client component so it can read the current pathname via `usePathname()`.
// Empirically verified (Task 13): reading the pathname from a Server Component via
// `headers()` does not work on this Next.js version (16.2.12) — a real request to
// `/dashboard/overview` only exposes host/user-agent/accept/x-forwarded-* to `headers()`,
// no `x-invoke-path` or `x-matched-path`. The brief's fallback anticipated this for
// Topbar's breadcrumb trail too, so the fix is applied once here rather than
// duplicated in both children — Sidebar and Topbar keep their existing,
// already-approved `activePath`/`pathname` prop contracts unchanged.
export function DashboardShell({
  user,
  children,
}: {
  user: CurrentUserWithMembership
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot
  )
  function toggleCollapsed() {
    setSidebarCollapsed(!collapsed)
  }

  return (
    <BreadcrumbProvider>
      <div className="flex min-h-screen" style={{ background: 'var(--background-app)' }}>
        <Sidebar
          activePath={pathname}
          userDisplayName={user.displayName}
          userRole={user.role}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
        />
        <div className="flex flex-1 flex-col">
          <Topbar
            pathname={pathname}
            userDisplayName={user.displayName}
            userEmail={user.email}
            userAvatarUrl={user.avatarUrl}
          />
          <main style={{ padding: 'var(--space-8)', maxWidth: 1600 }}>{children}</main>
        </div>
      </div>
    </BreadcrumbProvider>
  )
}
