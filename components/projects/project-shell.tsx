import Link from 'next/link'
import { RegisterBreadcrumbLabel } from '@/components/layout/breadcrumb-context'
import type { Project } from '@/types/project'

const tabs = ['overview', 'board', 'files', 'calendar', 'activity', 'settings'] as const
export function ProjectShell({
  project,
  children,
}: {
  project: Project
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <RegisterBreadcrumbLabel segment={project.id} label={project.name} />
      <header className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">{project.projectCode}</p>
          <h1>{project.name}</h1>
        </div>
        <nav aria-label="Project navigation" className="flex gap-5 overflow-x-auto border-b pb-2">
          {tabs.map((tab) => (
            <Link
              key={tab}
              href={`/dashboard/projects/${project.id}/${tab}`}
              className="whitespace-nowrap text-sm capitalize text-muted-foreground hover:text-foreground"
            >
              {tab}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </div>
  )
}
