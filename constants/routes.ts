import {
  LayoutDashboard,
  FolderKanban,
  Kanban,
  ListTodo,
  Calendar,
  FileText,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/dashboard/overview', icon: LayoutDashboard },
  { label: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { label: 'Board', href: '/dashboard/board', icon: Kanban },
  { label: 'My Tasks', href: '/dashboard/my-tasks', icon: ListTodo },
  { label: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { label: 'Files', href: '/dashboard/files', icon: FileText },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]
