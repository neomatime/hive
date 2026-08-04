'use client'

import { NotificationCenter } from '@/components/notifications/notification-center'
import { GlobalSearchBox } from '@/components/search/global-search-box'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { useBreadcrumbOverrides } from '@/components/layout/breadcrumb-context'
import { UserMenu } from './user-menu'

export function Topbar({
  pathname,
  userDisplayName,
  userEmail,
  userAvatarUrl,
}: {
  pathname: string
  userDisplayName: string
  userEmail: string
  userAvatarUrl: string | null
}) {
  const overrides = useBreadcrumbOverrides()
  return (
    <header
      className="flex items-center justify-between gap-6"
      style={{
        height: 72,
        padding: '0 var(--space-8)',
        background: 'var(--background-surface)',
        borderBottom: '1px solid var(--border-default)',
      }}
    >
      <div className="min-w-0 shrink-0">
        <Breadcrumbs pathname={pathname} overrides={overrides} />
      </div>
      <GlobalSearchBox />
      <div className="flex items-center gap-3">
        <NotificationCenter />
        <UserMenu displayName={userDisplayName} email={userEmail} avatarUrl={userAvatarUrl} />
      </div>
    </header>
  )
}
