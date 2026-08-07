import { cn } from '@/lib/utils'

export type BadgeVariant = 'neutral' | 'danger' | 'warning' | 'success' | 'info'

// Semantic variants use inline style (CSS custom properties), not Tailwind
// utility classes -- these colors aren't registered in the @theme block, and
// the *-bg tokens already carry the correct light/dark tint (see
// styles/theme.css's :root and .dark blocks, shipped in Phase 1a).
const variantStyle: Record<BadgeVariant, React.CSSProperties> = {
  neutral: {},
  danger: { color: 'var(--danger)', background: 'var(--danger-bg)' },
  warning: { color: 'var(--warning)', background: 'var(--warning-bg)' },
  success: { color: 'var(--success)', background: 'var(--success-bg)' },
  info: { color: 'var(--info)', background: 'var(--info-bg)' },
}

export function Badge({
  variant = 'neutral',
  className,
  children,
}: {
  variant?: BadgeVariant
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        variant === 'neutral' && 'bg-muted text-muted-foreground',
        className
      )}
      style={variantStyle[variant]}
    >
      {children}
    </span>
  )
}
