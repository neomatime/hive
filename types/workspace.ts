export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface Workspace {
  id: string
  name: string
  slug: string
  timezone: string
}

export interface WorkspaceMembership {
  workspace: Workspace
  role: WorkspaceRole
}
