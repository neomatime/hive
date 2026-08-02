import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type Client = SupabaseClient<Database>
export async function getProfile(client: Client, userId: string) {
  const result = await client
    .from('users')
    .select('id,display_name,first_name,last_name,job_title,department,phone_number,timezone,email')
    .eq('id', userId)
    .single()
  return result.data
}
export async function getWorkspace(client: Client, workspaceId: string) {
  const result = await client
    .from('workspaces')
    .select('id,name,description,timezone,date_format,time_format')
    .eq('id', workspaceId)
    .single()
  return result.data
}
export async function listWorkspaceTeam(client: Client, workspaceId: string) {
  const memberships = await client
    .from('workspace_members')
    .select('id,user_id,role,is_active,joined_at')
    .eq('workspace_id', workspaceId)
    .order('joined_at')
  if (!memberships.data) return []
  const users = await client
    .from('users')
    .select('id,display_name,email,job_title')
    .in(
      'id',
      memberships.data.map((item) => item.user_id)
    )
  return memberships.data.map((item) => ({
    ...item,
    user: users.data?.find((user) => user.id === item.user_id) ?? null,
  }))
}
