import Link from 'next/link'
import { cn } from '@/utils/cn'
import type { NavItem } from '@/constants/routes'

// Selected state reads as a table-of-contents marker (leading rule + weight),
// not a filled pill -- see design-system.md §21 for the contrast rationale.
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
        'flex items-center gap-3 rounded-md border-l-[3px] px-3 py-2 text-sm transition-standard',
        collapsed && 'justify-center px-0',
        active ? 'font-semibold' : 'border-transparent hover:bg-white/25'
      )}
      style={{
        borderLeftColor: active ? 'var(--color-midnight)' : undefined,
        background: active ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
        color: active ? 'var(--color-midnight)' : 'var(--text-primary)',
      }}
    >
      <Icon size={18} color={active ? 'var(--color-midnight)' : undefined} />
      <span className={collapsed ? 'sr-only' : undefined}>{item.label}</span>
    </Link>
  )
}
