import Image from 'next/image'
import { NAV_ITEMS } from '@/constants/routes'
import { ROLE_LABELS } from '@/constants/roles'
import { SidebarNavItem } from './sidebar-nav-item'
import type { WorkspaceRole } from '@/types/workspace'

export function Sidebar({
  activePath,
  userDisplayName,
  userRole,
}: {
  activePath: string
  userDisplayName: string
  userRole: WorkspaceRole
}) {
  return (
    <aside
      className="flex flex-col justify-between"
      style={{ width: 240, background: 'var(--background-sidebar)', padding: 'var(--space-4)' }}
    >
      <div className="flex flex-col gap-6">
        <Image
          src="/brand/hive-logo.png"
          alt="Hive"
          width={459}
          height={185}
          priority
          style={{ width: 150, height: 'auto' }}
        />
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem key={item.href} item={item} active={activePath.startsWith(item.href)} />
          ))}
        </nav>
      </div>
      <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
        <div style={{ fontWeight: 600 }}>{userDisplayName}</div>
        <div style={{ color: 'var(--text-secondary)' }}>{ROLE_LABELS[userRole]}</div>
      </div>
    </aside>
  )
}
