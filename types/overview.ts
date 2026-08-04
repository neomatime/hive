export interface MyTaskSummary {
  overdue: number
  dueToday: number
  dueThisWeek: number
  openTotal: number
}

export interface UpcomingDeadline {
  id: string
  kind: 'task' | 'project'
  title: string
  dueDate: string
  projectId: string
  projectName: string | null
  href: string
}
