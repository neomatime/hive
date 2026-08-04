import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type Client = SupabaseClient<Database>
type WorkspaceRole = Database['public']['Enums']['workspace_role']
interface InviteCapableAdmin {
  inviteUserByEmail: (
    email: string,
    options: { redirectTo: string }
  ) => Promise<{ data: { user: { id: string } | null }; error: { message: string } | null }>
}
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
    .select('id,name,description,logo_url,timezone,date_format,time_format')
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
// The workspace's own "Add member" form previously only worked for emails
// that already had a Hive account -- add_workspace_member_by_email() raises
// when it can't find one -- with no way for a workspace owner to actually
// onboard someone new short of running the bootstrap CLI script for them.
// This sends a real invite (same mechanism as scripts/bootstrap-owner.ts)
// first when no account is found, then adds them via the existing
// RLS-gated RPC, which already enforces the caller is a workspace admin.
export async function inviteOrAddWorkspaceMember(
  client: Client,
  admin: InviteCapableAdmin,
  input: { workspaceId: string; email: string; role: WorkspaceRole; redirectTo: string }
): Promise<{ error: string | null }> {
  if (input.role === 'owner') {
    return { error: 'Ownership cannot be assigned through an invite.' }
  }
  const email = input.email.trim()

  const existing = await client.from('users').select('id').ilike('email', email).maybeSingle()
  if (!existing.data) {
    const invited = await admin.inviteUserByEmail(email, { redirectTo: input.redirectTo })
    if (invited.error && !/already (registered|exists)/i.test(invited.error.message)) {
      return { error: 'Could not send an invite to that email.' }
    }
  }

  const result = await client.rpc('add_workspace_member_by_email', {
    p_workspace_id: input.workspaceId,
    p_email: email,
    p_role: input.role,
  } as never)
  return { error: result.error ? 'Could not add them to this workspace.' : null }
}

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  in_app_enabled: true,
  email_enabled: true,
  browser_enabled: false,
  assigned_task: true,
  mention: true,
  due_today: true,
  overdue: true,
  review_requested: true,
  task_completed: true,
}
export async function getNotificationPreferences(client: Client, userId: string) {
  const result = await client
    .from('notification_preferences')
    .select(
      'user_id,in_app_enabled,email_enabled,browser_enabled,assigned_task,mention,due_today,overdue,review_requested,task_completed'
    )
    .eq('user_id', userId)
    .maybeSingle()
  return result.data ?? { user_id: userId, ...DEFAULT_NOTIFICATION_PREFERENCES }
}
export const DEFAULT_TASK_PREFERENCES = {
  default_task_priority: 'medium' as const,
  default_task_status: 'todo' as const,
  week_starts_on: 1,
  working_hours_start: '08:00:00',
  working_hours_end: '17:00:00',
  show_completed_tasks: false,
}
export async function getTaskPreferences(client: Client, userId: string) {
  const result = await client
    .from('user_preferences')
    .select(
      'user_id,default_task_priority,default_task_status,week_starts_on,working_hours_start,working_hours_end,show_completed_tasks'
    )
    .eq('user_id', userId)
    .maybeSingle()
  return result.data ?? { user_id: userId, ...DEFAULT_TASK_PREFERENCES }
}
