export interface ProjectActivity {
  id: string
  action:
    | 'project_created'
    | 'project_updated'
    | 'member_added'
    | 'member_removed'
    | 'member_role_changed'
    | 'task_created'
    | 'task_updated'
    | 'task_completed'
    | 'task_moved'
    | 'comment_added'
    | 'file_uploaded'
  entityType: string
  entityId: string
  userId: string | null
  userName: string
  metadata: Record<string, unknown>
  createdAt: string
}

export interface WorkspaceActivity extends ProjectActivity {
  projectId: string | null
  projectName: string | null
}
