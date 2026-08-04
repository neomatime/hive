import type { TaskPriority } from './project'

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
export interface TaskLabel {
  id: string
  name: string
  colorToken: string
}
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
  labels: TaskLabel[]
}
export interface BoardColumn {
  id: string
  boardId: string
  name: string
  status: TaskStatus
  position: number
  isTerminal: boolean
  wipLimit: number | null
  tasks: Task[]
}
export interface ProjectBoard {
  id: string
  projectId: string
  name: string
  columns: BoardColumn[]
}
export interface Subtask {
  id: string
  parentTaskId: string
  title: string
  isComplete: boolean
  position: number
}
