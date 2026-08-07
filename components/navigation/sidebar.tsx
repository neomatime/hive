import Image from 'next/image'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { NAV_ITEMS } from '@/constants/routes'
import { ROLE_LABELS } from '@/constants/roles'
import { SidebarNavItem } from './sidebar-nav-item'
import type { WorkspaceRole } from '@/types/workspace'

export function Sidebar({
  activePath,
  userDisplayName,
  userRole,
  collapsed = false,
  onToggleCollapse,
}: {
  activePath: string
  userDisplayName: string
  userRole: WorkspaceRole
  collapsed?: boolean
  onToggleCollapse?: () => void
}) {
  return (
    <aside
      className="flex flex-col justify-between transition-[width]"
      style={{
        width: collapsed ? 72 : 240,
        background: 'var(--background-sidebar)',
        padding: collapsed ? 'var(--space-5) var(--space-2)' : 'var(--space-5) var(--space-4)',
      }}
    >
      <div className="flex flex-col gap-8">
        <div
          className={
            collapsed
              ? 'flex flex-col items-center gap-4'
              : 'flex items-center justify-between gap-2'
          }
        >
          {collapsed ? (
            <Image
              src="/brand/hive-icon.png"
              alt="Hive"
              width={151}
              height={185}
              priority
              style={{ width: 28, height: 'auto' }}
            />
          ) : (
            <Image
              src="/brand/hive-logo.png"
              alt="Hive"
              width={459}
              height={185}
              priority
              style={{ width: 150, height: 'auto' }}
            />
          )}
          {onToggleCollapse && (
            <button
              type="button"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={onToggleCollapse}
              style={{ color: 'var(--sidebar-nav-text)' }}
            >
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          )}
        </div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              active={activePath.startsWith(item.href)}
              collapsed={collapsed}
            />
          ))}
        </nav>
      </div>
      <div
        className="text-sm"
        style={{
          color: 'var(--sidebar-nav-text-active)',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          paddingTop: 'var(--space-4)',
        }}
      >
        {collapsed ? (
          <div
            aria-label={userDisplayName}
            title={userDisplayName}
            className="mx-auto flex size-8 items-center justify-center rounded-full text-sm font-semibold"
            style={{ background: 'var(--color-ocean-light)', color: 'var(--color-ink-deep)' }}
          >
            {userDisplayName.charAt(0).toUpperCase()}
          </div>
        ) : (
          <>
            <div style={{ fontWeight: 600 }}>{userDisplayName}</div>
            <div className="eyebrow" style={{ color: 'var(--sidebar-nav-text)', marginTop: 2 }}>
              {ROLE_LABELS[userRole]}
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
