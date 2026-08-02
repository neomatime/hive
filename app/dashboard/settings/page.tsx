import Link from 'next/link'
import {
  Bell,
  Building2,
  KeyRound,
  Plug,
  SlidersHorizontal,
  UserRound,
  UsersRound,
} from 'lucide-react'

const sections = [
  {
    title: 'My profile',
    description: 'Name, role details, contact information, and timezone.',
    href: '/dashboard/settings/profile',
    icon: UserRound,
    live: true,
  },
  {
    title: 'Account',
    description: 'Password and authentication settings.',
    href: '/dashboard/settings/account',
    icon: KeyRound,
    live: true,
  },
  {
    title: 'Workspace',
    description: 'Organization name, timezone, and date defaults.',
    href: '/dashboard/settings/workspace',
    icon: Building2,
    live: true,
  },
  {
    title: 'Team',
    description: 'Workspace members, access, and roles.',
    href: '/dashboard/settings/team',
    icon: UsersRound,
    live: true,
  },
  {
    title: 'Notifications',
    description: 'Email and in-app notification preferences.',
    href: '/dashboard/settings/notifications',
    icon: Bell,
    live: true,
  },
  {
    title: 'Task preferences',
    description: 'Default priority, status, week start, and working hours.',
    href: '/dashboard/settings/task-preferences',
    icon: SlidersHorizontal,
    live: true,
  },
  {
    title: 'Integrations',
    description: 'Connect HIVE to external services.',
    href: '#',
    icon: Plug,
    live: false,
  },
]
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1>Settings</h1>
        <p className="text-muted-foreground">Manage your account and workspace configuration.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sections.map(({ title, description, href, icon: Icon, live }) =>
          live ? (
            <Link
              key={title}
              href={href}
              className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-sm"
            >
              <Icon className="mb-4 size-5 text-primary" />
              <h2 className="text-base font-medium">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </Link>
          ) : (
            <div key={title} className="rounded-xl border bg-muted/30 p-5 opacity-70">
              <Icon className="mb-4 size-5" />
              <div className="flex items-center gap-2">
                <h2 className="text-base font-medium">{title}</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">Next</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
