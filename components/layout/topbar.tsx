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
      className="flex items-center justify-between"
      style={{
        height: 72,
        padding: '0 var(--space-8)',
        background: 'var(--background-surface)',
        borderBottom: '1px solid var(--border-default)',
      }}
    >
      <h2 style={{ margin: 0 }}>{title}</h2>
      <UserMenu displayName={userDisplayName} email={userEmail} avatarUrl={userAvatarUrl} />
    </header>
  )
}
