import type { Project } from '@/types/project'

const labels = {
  not_started: 'Not started',
  active: 'Active',
  on_hold: 'On hold',
  completed: 'Completed',
  archived: 'Archived',
} as const
export function ProjectOverviewPanel({ project }: { project: Project }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="space-y-3 rounded-xl border p-5 lg:col-span-2">
        <h2>Overview</h2>
        <p className="text-muted-foreground">
          {project.description || 'No project description yet.'}
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary" style={{ width: `${project.progressPercentage}%` }} />
        </div>
        <p className="text-sm">{project.progressPercentage}% complete</p>
      </section>
      <aside className="space-y-3 rounded-xl border p-5">
        <h2>Details</h2>
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd>{labels[project.status]}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Priority</dt>
            <dd className="capitalize">{project.priority}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Start date</dt>
            <dd>{project.startDate || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Due date</dt>
            <dd>{project.dueDate || 'Not set'}</dd>
          </div>
        </dl>
      </aside>
    </div>
  )
}
