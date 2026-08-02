import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { Project, ProjectStatus, TaskPriority } from '@/types/project'

export interface ListProjectsFilters {
  search?: string
  status?: ProjectStatus
  ownerId?: string
  favouritesOnly?: boolean
  sortBy?: 'name' | 'due_date' | 'created_at' | 'priority'
  sortDirection?: 'asc' | 'desc'
}

export interface CreateProjectInput {
  workspaceId: string
  name: string
  description: string | null
  status: ProjectStatus
  priority: TaskPriority
  ownerId: string
  startDate: string | null
  dueDate: string | null
  memberIds: string[]
  templateId?: string | null
}

type ProjectRow = {
  id: string
  workspace_id: string
  name: string
  project_code: string
  description: string | null
  status: string
  priority: string
  owner_id: string
  start_date: string | null
  due_date: string | null
  completed_at: string | null
  progress_percentage: number
  is_favourite: boolean
  archived_at: string | null
}

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    projectCode: row.project_code,
    description: row.description,
    status: row.status as ProjectStatus,
    priority: row.priority as TaskPriority,
    ownerId: row.owner_id,
    startDate: row.start_date,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    progressPercentage: row.progress_percentage,
    isFavourite: row.is_favourite,
    archivedAt: row.archived_at,
  }
}

export async function listProjects(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  filters: ListProjectsFilters
): Promise<Project[]> {
  let query = supabase.from('projects').select('*').eq('workspace_id', workspaceId)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.ownerId) query = query.eq('owner_id', filters.ownerId)
  if (filters.favouritesOnly) query = query.eq('is_favourite', true)
  if (filters.search) query = query.ilike('name', `%${filters.search}%`)

  const { data, error } = await query.order(filters.sortBy ?? 'created_at', {
    ascending: filters.sortDirection !== 'desc',
  })
  if (error || !data) return []
  return (data as ProjectRow[]).map(mapProject)
}

export async function getProject(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<Project | null> {
  const { data, error } = await supabase.from('projects').select('*').eq('id', projectId).single()
  if (error || !data) return null
  return mapProject(data as ProjectRow)
}

export async function createProject(
  supabase: SupabaseClient<Database>,
  input: CreateProjectInput
): Promise<{ project: Project | null; error: string | null }> {
  const { data, error } = await supabase.rpc('create_project_with_owner', {
    p_workspace_id: input.workspaceId,
    p_name: input.name,
    p_description: input.description,
    p_status: input.status,
    p_priority: input.priority,
    p_owner_id: input.ownerId,
    p_start_date: input.startDate,
    p_due_date: input.dueDate,
    p_member_ids: input.memberIds,
    p_template_id: input.templateId ?? null,
  } as never)
  if (error || !data) {
    return {
      project: null,
      error:
        'Could not create project. You may not have permission to create projects in this workspace.',
    }
  }
  return { project: mapProject(data as ProjectRow), error: null }
}

export async function updateProject(
  supabase: SupabaseClient<Database>,
  projectId: string,
  patch: Partial<
    Pick<Project, 'name' | 'description' | 'status' | 'priority' | 'startDate' | 'dueDate'>
  >
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('projects')
    .update({
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.description !== undefined && { description: patch.description }),
      ...(patch.status !== undefined && { status: patch.status }),
      ...(patch.priority !== undefined && { priority: patch.priority }),
      ...(patch.startDate !== undefined && { start_date: patch.startDate }),
      ...(patch.dueDate !== undefined && { due_date: patch.dueDate }),
    })
    .eq('id', projectId)
  return { error: error ? 'Could not update project.' : null }
}

export async function archiveProject(supabase: SupabaseClient<Database>, projectId: string) {
  const { error } = await supabase
    .from('projects')
    .update({ status: 'archived', archived_at: new Date().toISOString() })
    .eq('id', projectId)
  return { error: error ? 'Could not archive project.' : null }
}

export async function restoreProject(supabase: SupabaseClient<Database>, projectId: string) {
  const { error } = await supabase
    .from('projects')
    .update({ status: 'active', archived_at: null })
    .eq('id', projectId)
  return { error: error ? 'Could not restore project.' : null }
}

export async function toggleFavourite(
  supabase: SupabaseClient<Database>,
  projectId: string,
  isFavourite: boolean
) {
  const { error } = await supabase
    .from('projects')
    .update({ is_favourite: isFavourite })
    .eq('id', projectId)
  return { error: error ? 'Could not update favourite.' : null }
}
