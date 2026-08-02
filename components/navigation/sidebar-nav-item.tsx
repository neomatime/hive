import Link from 'next/link'
import { cn } from '@/utils/cn'
import type { NavItem } from '@/constants/routes'

export function SidebarNavItem({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-standard',
        active ? 'font-semibold' : 'hover:bg-white/20'
      )}
      style={{
        background: active ? 'var(--color-midnight)' : 'transparent',
        color: active ? 'var(--text-on-dark)' : 'var(--text-primary)',
      }}
    >
      <Icon size={18} color={active ? 'var(--color-white)' : undefined} />
      {item.label}
    </Link>
  )
}
