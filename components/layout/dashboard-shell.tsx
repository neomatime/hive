'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/navigation/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { NAV_ITEMS } from '@/constants/routes'
import type { CurrentUserWithMembership } from '@/services/workspace/workspace-service'

// This is a client component so it can read the current pathname via `usePathname()`.
// Empirically verified (Task 13): reading the pathname from a Server Component via
// `headers()` does not work on this Next.js version (16.2.12) — a real request to
// `/dashboard/overview` only exposes host/user-agent/accept/x-forwarded-* to `headers()`,
// no `x-invoke-path` or `x-matched-path`. The brief's fallback anticipated this for
// Topbar's title only, but Sidebar's `activePath` prop (for `aria-current` highlighting)
// has the identical dependency on the current pathname, so the fix is applied once here
// rather than duplicated in both children — Sidebar and Topbar keep their existing,
// already-approved prop contracts (`activePath` / `title`) unchanged.
export function DashboardShell({
  user,
  children,
}: {
  user: CurrentUserWithMembership
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const activeItem = NAV_ITEMS.find((item) => pathname.startsWith(item.href))

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--background-app)' }}>
      <Sidebar activePath={pathname} userDisplayName={user.displayName} userRole={user.role} />
      <div className="flex flex-1 flex-col">
        <Topbar
          title={activeItem?.label ?? 'HIVE'}
          userDisplayName={user.displayName}
          userEmail={user.email}
          userAvatarUrl={user.avatarUrl}
        />
        <main style={{ padding: 'var(--space-8)', maxWidth: 1600 }}>{children}</main>
      </div>
    </div>
  )
}
