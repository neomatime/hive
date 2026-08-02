export interface ProjectActivity {
  id: string
  action: 'task_created' | 'task_moved' | 'comment_added' | 'file_uploaded'
  entityType: string
  entityId: string
  userId: string | null
  userName: string
  metadata: Record<string, unknown>
  createdAt: string
}
