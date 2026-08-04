import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/database'
import type { ProjectActivity, WorkspaceActivity } from '@/types/activity'

type Client = SupabaseClient<Database>
function object(value: Json): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}
export async function listProjectActivity(
  client: Client,
  projectId: string
): Promise<ProjectActivity[]> {
  const result = await client
    .from('activity_logs')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (result.error || !result.data) return []
  const userIds = [...new Set(result.data.flatMap((item) => (item.user_id ? [item.user_id] : [])))]
  const users = userIds.length
    ? await client.from('users').select('id,display_name').in('id', userIds)
    : { data: [] }
  return result.data.map((item) => ({
    id: item.id,
    action: item.action as ProjectActivity['action'],
    entityType: item.entity_type,
    entityId: item.entity_id,
    userId: item.user_id,
    userName: users.data?.find((user) => user.id === item.user_id)?.display_name ?? 'System',
    metadata: object(item.metadata),
    createdAt: item.created_at,
  }))
}

export async function listWorkspaceActivity(
  client: Client,
  workspaceId: string,
  limit: number
): Promise<WorkspaceActivity[]> {
  const result = await client
    .from('activity_logs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (result.error || !result.data) return []

  const userIds = [...new Set(result.data.flatMap((item) => (item.user_id ? [item.user_id] : [])))]
  const projectIds = [
    ...new Set(result.data.flatMap((item) => (item.project_id ? [item.project_id] : []))),
  ]
  const [users, projects] = await Promise.all([
    userIds.length
      ? client.from('users').select('id,display_name').in('id', userIds)
      : Promise.resolve({ data: [] }),
    projectIds.length
      ? client.from('projects').select('id,name').in('id', projectIds)
      : Promise.resolve({ data: [] }),
  ])

  return result.data.map((item) => ({
    id: item.id,
    action: item.action as ProjectActivity['action'],
    entityType: item.entity_type,
    entityId: item.entity_id,
    userId: item.user_id,
    userName: users.data?.find((user) => user.id === item.user_id)?.display_name ?? 'System',
    projectId: item.project_id,
    projectName: projects.data?.find((project) => project.id === item.project_id)?.name ?? null,
    metadata: object(item.metadata),
    createdAt: item.created_at,
  }))
}
