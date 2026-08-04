import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

const LABELS: Record<string, string> = {
  overview: 'Overview',
  projects: 'Projects',
  board: 'Board',
  'my-tasks': 'My Tasks',
  inbox: 'Inbox',
  calendar: 'Calendar',
  files: 'Files',
  settings: 'Settings',
  activity: 'Activity',
  search: 'Search',
  account: 'Account',
  profile: 'My Profile',
  'my-profile': 'My Profile',
  team: 'Team',
  workspace: 'Workspace',
  notifications: 'Notifications',
  'task-preferences': 'Task Preferences',
  'project-templates': 'Project Templates',
  integrations: 'Integrations',
}

function titleCase(segment: string): string {
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export interface Crumb {
  label: string
  href: string
}

export function buildBreadcrumbTrail(pathname: string, overrides: Record<string, string>): Crumb[] {
  const segments = pathname
    .split('/')
    .filter(Boolean)
    .filter((segment) => segment !== 'dashboard')
  const crumbs: Crumb[] = []
  let href = ''
  segments.forEach((segment, index) => {
    href += `/${segment}`
    const isProjectId = index > 0 && segments[index - 1] === 'projects' && !LABELS[segment]
    const label =
      overrides[segment] ?? LABELS[segment] ?? (isProjectId ? 'Project' : titleCase(segment))
    crumbs.push({ label, href: `/dashboard${href}` })
  })
  return crumbs
}

export function Breadcrumbs({
  pathname,
  overrides,
}: {
  pathname: string
  overrides: Record<string, string>
}) {
  const trail = buildBreadcrumbTrail(pathname, overrides)
  if (trail.length === 0) return null
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      {trail.map((crumb, index) => {
        const isCurrent = index === trail.length - 1
        return (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            )}
            {isCurrent ? (
              <span aria-current="page" className="font-medium">
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.href} className="text-muted-foreground hover:text-foreground">
                {crumb.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
