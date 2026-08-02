'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, CheckCircle2, CircleAlert, Search } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { MyTask } from '@/types/my-task'

type View = 'all' | 'today' | 'overdue' | 'completed'
type Sort = 'due_date' | 'priority' | 'project' | 'status'
const priorityRank = { urgent: 0, high: 1, medium: 2, low: 3 }

function localDate() {
  const now = new Date()
  const part = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${part(now.getMonth() + 1)}-${part(now.getDate())}`
}

export function MyTasksDashboard({ tasks }: { tasks: MyTask[] }) {
  const [view, setView] = useState<View>('all')
  const [sort, setSort] = useState<Sort>('due_date')
  const [search, setSearch] = useState('')
  const today = localDate()
  const counts = {
    all: tasks.filter((task) => !task.completedAt).length,
    today: tasks.filter((task) => !task.completedAt && task.dueDate === today).length,
    overdue: tasks.filter((task) => !task.completedAt && !!task.dueDate && task.dueDate < today)
      .length,
    completed: tasks.filter((task) => !!task.completedAt).length,
  }
  const visible = useMemo(() => {
    const filtered = tasks.filter((task) => {
      const matchesSearch = `${task.title} ${task.projectName}`
        .toLowerCase()
        .includes(search.toLowerCase())
      if (!matchesSearch) return false
      if (view === 'today') return !task.completedAt && task.dueDate === today
      if (view === 'overdue') return !task.completedAt && !!task.dueDate && task.dueDate < today
      if (view === 'completed') return !!task.completedAt
      return !task.completedAt
    })
    return [...filtered].sort((a, b) => {
      if (sort === 'priority') return priorityRank[a.priority] - priorityRank[b.priority]
      if (sort === 'project') return a.projectName.localeCompare(b.projectName)
      if (sort === 'status') return a.statusName.localeCompare(b.statusName)
      return (a.dueDate ?? '9999-12-31').localeCompare(b.dueDate ?? '9999-12-31')
    })
  }, [tasks, search, sort, today, view])

  return (
    <div className="space-y-6">
      <div>
        <h1>My Tasks</h1>
        <p className="text-muted-foreground">Your assigned work across every project.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <span className="text-sm text-muted-foreground">Due today</span>
          <strong className="text-2xl">{counts.today}</strong>
        </Card>
        <Card className="p-4">
          <span className="text-sm text-muted-foreground">Overdue</span>
          <strong className="text-2xl text-destructive">{counts.overdue}</strong>
        </Card>
        <Card className="p-4">
          <span className="text-sm text-muted-foreground">Completed</span>
          <strong className="text-2xl">{counts.completed}</strong>
        </Card>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b pb-3">
        {(['all', 'today', 'overdue', 'completed'] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setView(item)}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm capitalize',
              view === item
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {item} <span className="ml-1 opacity-75">{counts[item]}</span>
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
        <label className="relative">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            aria-label="Search my tasks"
            className="pl-9"
            placeholder="Search tasks or projects…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <select
          aria-label="Sort my tasks"
          value={sort}
          onChange={(event) => setSort(event.target.value as Sort)}
          className="h-8 rounded-lg border bg-background px-3 text-sm"
        >
          <option value="due_date">Due date</option>
          <option value="priority">Priority</option>
          <option value="project">Project</option>
          <option value="status">Status</option>
        </select>
      </div>
      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <CheckCircle2 className="mx-auto mb-3 size-8 text-muted-foreground" />
          <h2>No tasks here</h2>
          <p className="text-sm text-muted-foreground">
            Your assigned tasks will appear in this list.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((task) => {
            const overdue = !task.completedAt && !!task.dueDate && task.dueDate < today
            return (
              <Link
                key={task.id}
                href={`/dashboard/projects/${task.projectId}/board`}
                className="block rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-base font-medium">{task.title}</h2>
                    <p className="text-xs text-muted-foreground">
                      {task.projectCode} · {task.projectName}
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs">
                    {task.statusName}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="capitalize">{task.priority} priority</span>
                  {task.dueDate && (
                    <span
                      className={cn(
                        'flex items-center gap-1',
                        overdue && 'font-medium text-destructive'
                      )}
                    >
                      {overdue ? (
                        <CircleAlert className="size-3.5" />
                      ) : (
                        <CalendarDays className="size-3.5" />
                      )}
                      {task.dueDate}
                    </span>
                  )}
                  {task.labels.map((label) => (
                    <span
                      key={label.id}
                      className="rounded-full px-2 py-0.5 text-white"
                      style={{ backgroundColor: label.colorToken }}
                    >
                      {label.name}
                    </span>
                  ))}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
