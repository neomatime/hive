import { NotificationCenter } from '@/components/notifications/notification-center'
import { GlobalSearchBox } from '@/components/search/global-search-box'
import { UserMenu } from './user-menu'

export function Topbar({
  title,
  userDisplayName,
  userEmail,
  userAvatarUrl,
}: {
  title: string
  userDisplayName: string
  userEmail: string
  userAvatarUrl: string | null
}) {
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
      <h2 className="shrink-0" style={{ margin: 0 }}>
        {title}
      </h2>
      <GlobalSearchBox />
      <div className="flex items-center gap-3">
        <NotificationCenter />
        <UserMenu displayName={userDisplayName} email={userEmail} avatarUrl={userAvatarUrl} />
      </div>
    </header>
  )
}
