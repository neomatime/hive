import type { TaskPriority } from './project'

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
export interface Task {
  id: string
  projectId: string
  boardId: string
  columnId: string
  title: string
  description: string | null
  priority: TaskPriority
  assigneeId: string | null
  dueDate: string | null
  position: number
  progressPercentage: number
  isBlocked: boolean
}
export interface BoardColumn {
  id: string
  boardId: string
  name: string
  status: TaskStatus
  position: number
  isTerminal: boolean
  tasks: Task[]
}
export interface ProjectBoard {
  id: string
  projectId: string
  name: string
  columns: BoardColumn[]
}
