import Link from 'next/link'
import { CalendarClock, CheckCircle2, CircleAlert, FolderKanban, ListTodo } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { listWorkspaceActivity } from '@/services/activity/activity-service'
import { getMyTaskSummary, listUpcomingDeadlines } from '@/services/overview/overview-service'
import { ROLE_LABELS } from '@/constants/roles'

const actionLabels: Record<string, string> = {
  project_created: 'created the project',
  project_updated: 'updated the project',
  member_added: 'added a project member',
  member_removed: 'removed a project member',
  member_role_changed: 'changed a member role',
  task_created: 'created a task',
  task_updated: 'updated a task',
  task_completed: 'completed a task',
  task_moved: 'moved a task',
  comment_added: 'added a comment',
  file_uploaded: 'uploaded a file',
}

export default async function OverviewPage() {
  const supabase = await createClient()
  const result = await getCurrentUserWithMembership(supabase)

  // Unreachable in the 'unauthenticated'/'no-active-membership' cases —
  // app/dashboard/layout.tsx (Task 13) already handles both before this page renders.
  if (result.status !== 'ok') return null

  const { user } = result
  const [summary, deadlines, activity] = await Promise.all([
    getMyTaskSummary(supabase, user.id),
    listUpcomingDeadlines(supabase, user.id, user.workspace.id),
    listWorkspaceActivity(supabase, user.workspace.id, 10),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1>Welcome, {user.displayName.split(' ')[0]}</h1>
        <p className="text-muted-foreground">
          You&apos;re signed in to the {user.workspace.name} workspace as {ROLE_LABELS[user.role]}.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleAlert className="size-4" />
            Overdue
          </div>
          <strong className="text-2xl text-destructive">{summary.overdue}</strong>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="size-4" />
            Due this week
          </div>
          <strong className="text-2xl">{summary.dueToday + summary.dueThisWeek}</strong>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ListTodo className="size-4" />
            Open tasks
          </div>
          <strong className="text-2xl">{summary.openTotal}</strong>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="upcoming-deadlines-title" className="space-y-3">
          <h2 id="upcoming-deadlines-title">Upcoming deadlines</h2>
          {deadlines.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing due in the next two weeks. Enjoy the calm.
            </p>
          ) : (
            <ul className="space-y-2">
              {deadlines.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 text-sm hover:bg-muted"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {item.kind === 'project' ? (
                        <FolderKanban className="size-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ListTodo className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="min-w-0">
                        <span className="block truncate">{item.title}</span>
                        {item.kind === 'task' && item.projectName && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {item.projectName}
                          </span>
                        )}
                      </span>
                    </span>
                    <time
                      className="shrink-0 text-xs text-muted-foreground"
                      dateTime={item.dueDate}
                    >
                      {new Date(`${item.dueDate}T00:00:00`).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="recent-activity-title" className="space-y-3">
          <h2 id="recent-activity-title">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Project, task, and file changes across the workspace will appear here.
            </p>
          ) : (
            <ul className="space-y-2">
              {activity.map((item) => (
                <li key={item.id} className="rounded-lg border bg-card p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p>
                      <strong>{item.userName}</strong>{' '}
                      {actionLabels[item.action] ?? 'made a change'}
                      {item.projectName && (
                        <>
                          {' '}
                          in <span className="font-medium">{item.projectName}</span>
                        </>
                      )}
                    </p>
                    <time
                      className="shrink-0 text-xs text-muted-foreground"
                      dateTime={item.createdAt}
                    >
                      {new Date(item.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/projects"
          className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm hover:bg-muted"
        >
          <FolderKanban className="size-4" />
          View all projects
        </Link>
        <Link
          href="/dashboard/my-tasks"
          className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm hover:bg-muted"
        >
          <CheckCircle2 className="size-4" />
          View my tasks
        </Link>
      </div>
    </div>
  )
}
