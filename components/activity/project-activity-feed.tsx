'use client'

import { useMemo, useState } from 'react'
import { FileUp, ListTodo, MessageSquare, MoveRight } from 'lucide-react'
import type { ProjectActivity } from '@/types/activity'

const details = {
  task_created: { label: 'created a task', icon: ListTodo },
  task_moved: { label: 'moved a task', icon: MoveRight },
  comment_added: { label: 'added a comment', icon: MessageSquare },
  file_uploaded: { label: 'uploaded a file', icon: FileUp },
}
export function ProjectActivityFeed({ activity }: { activity: ProjectActivity[] }) {
  const [filter, setFilter] = useState('all')
  const visible = useMemo(
    () => (filter === 'all' ? activity : activity.filter((item) => item.action === filter)),
    [activity, filter]
  )
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1>Activity</h1>
          <p className="text-muted-foreground">An immutable timeline of project changes.</p>
        </div>
        <select
          aria-label="Filter activity"
          className="h-8 rounded-lg border bg-background px-3 text-sm"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="all">All activity</option>
          <option value="task_created">Tasks created</option>
          <option value="task_moved">Tasks moved</option>
          <option value="comment_added">Comments</option>
          <option value="file_uploaded">Files</option>
        </select>
      </div>
      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <h2>No activity yet</h2>
          <p className="text-sm text-muted-foreground">
            Task, comment, and file changes will appear here.
          </p>
        </div>
      ) : (
        <ol className="relative ml-3 border-l">
          {visible.map((item) => {
            const config = details[item.action] ?? details.task_created,
              Icon = config.icon
            const title = String(
              item.metadata.title ?? item.metadata.name ?? item.metadata.content_preview ?? ''
            )
            return (
              <li key={item.id} className="relative pb-7 pl-8">
                <span className="absolute -left-4 grid size-8 place-items-center rounded-full border bg-background">
                  <Icon className="size-4" />
                </span>
                <div className="rounded-xl border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p>
                      <strong>{item.userName}</strong> {config.label}
                    </p>
                    <time className="text-xs text-muted-foreground" dateTime={item.createdAt}>
                      {new Date(item.createdAt).toLocaleString()}
                    </time>
                  </div>
                  {title && <p className="mt-1 text-sm text-muted-foreground">{title}</p>}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
