import type { TaskPriority } from './project'
import type { TaskLabel, TaskStatus } from './task'

export interface MyTask {
  id: string
  projectId: string
  projectName: string
  projectCode: string
  title: string
  description: string | null
  priority: TaskPriority
  dueDate: string | null
  completedAt: string | null
  status: TaskStatus
  statusName: string
  labels: TaskLabel[]
}
