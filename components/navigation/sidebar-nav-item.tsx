import Link from 'next/link'
import { cn } from '@/utils/cn'
import type { NavItem } from '@/constants/routes'

// Active state reads as a soft tinted pill against the permanently-dark
// sidebar (see docs/superpowers/specs/2026-08-06-hive-design-upgrade-
// foundation-design.md §7) -- supersedes the old left-border-plus-lightened-
// background treatment from design-system.md §21, which was tuned for the
// old medium-teal Ocean Light sidebar background.
export function SidebarNavItem({
  item,
  active,
  collapsed,
}: {
  item: NavItem
  active: boolean
  collapsed?: boolean
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-standard',
        collapsed && 'justify-center px-0',
        active ? 'font-semibold' : 'hover:bg-white/5'
      )}
      style={{
        background: active ? 'var(--sidebar-nav-active-bg)' : 'transparent',
        color: active ? 'var(--sidebar-nav-text-active)' : 'var(--sidebar-nav-text)',
      }}
    >
      <Icon size={18} />
      <span className={collapsed ? 'sr-only' : undefined}>{item.label}</span>
    </Link>
  )
}
