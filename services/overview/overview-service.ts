import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { MyTaskSummary, UpcomingDeadline } from '@/types/overview'
import { listMyTasks } from '../tasks/my-tasks-service'
import { listProjects } from '../projects/project-service'

type Client = SupabaseClient<Database>

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function parseDueDate(dueDate: string) {
  return new Date(`${dueDate}T00:00:00`)
}

export async function getMyTaskSummary(
  client: Client,
  userId: string,
  referenceDate: Date = new Date()
): Promise<MyTaskSummary> {
  const tasks = await listMyTasks(client, userId)
  const open = tasks.filter((task) => !task.completedAt)
  const today = startOfDay(referenceDate)
  const weekEnd = addDays(today, 7)

  let overdue = 0
  let dueToday = 0
  let dueThisWeek = 0
  for (const task of open) {
    if (!task.dueDate) continue
    const due = parseDueDate(task.dueDate)
    if (due < today) overdue++
    else if (due.getTime() === today.getTime()) dueToday++
    else if (due <= weekEnd) dueThisWeek++
  }

  return { overdue, dueToday, dueThisWeek, openTotal: open.length }
}

export async function listUpcomingDeadlines(
  client: Client,
  userId: string,
  workspaceId: string,
  referenceDate: Date = new Date(),
  windowDays = 14
): Promise<UpcomingDeadline[]> {
  const today = startOfDay(referenceDate)
  const windowEnd = addDays(today, windowDays)
  // Overdue items are surfaced too (no lower bound) — they're the most urgent deadlines.
  const inWindow = (dueDate: string) => parseDueDate(dueDate) <= windowEnd

  const [tasks, projects] = await Promise.all([
    listMyTasks(client, userId),
    listProjects(client, workspaceId, { status: 'active' }),
  ])

  const taskDeadlines: UpcomingDeadline[] = tasks
    .filter((task) => !task.completedAt && task.dueDate && inWindow(task.dueDate))
    .map((task) => ({
      id: task.id,
      kind: 'task',
      title: task.title,
      dueDate: task.dueDate!,
      projectId: task.projectId,
      projectName: task.projectName,
      href: '/dashboard/my-tasks',
    }))

  const projectDeadlines: UpcomingDeadline[] = projects
    .filter((project) => project.dueDate && inWindow(project.dueDate))
    .map((project) => ({
      id: project.id,
      kind: 'project',
      title: project.name,
      dueDate: project.dueDate!,
      projectId: project.id,
      projectName: project.name,
      href: `/dashboard/projects/${project.id}/overview`,
    }))

  return [...taskDeadlines, ...projectDeadlines]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 8)
}
