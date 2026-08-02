export type ProjectStatus = 'not_started' | 'active' | 'on_hold' | 'completed' | 'archived'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type ProjectMemberRole = 'project_owner' | 'project_manager' | 'contributor' | 'viewer'

export interface Project {
  id: string
  workspaceId: string
  name: string
  projectCode: string
  description: string | null
  status: ProjectStatus
  priority: TaskPriority
  ownerId: string
  startDate: string | null
  dueDate: string | null
  completedAt: string | null
  progressPercentage: number
  isFavourite: boolean
  archivedAt: string | null
}

export interface ProjectMember {
  id: string
  projectId: string
  userId: string
  role: ProjectMemberRole
  displayName: string
  avatarUrl: string | null
}
