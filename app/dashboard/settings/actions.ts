'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { inviteOrAddWorkspaceMember } from '@/services/settings/settings-service'
import type { Database } from '@/types/database'

export async function updateProfileAction(
  userId: string,
  input: {
    displayName: string
    firstName: string
    lastName: string
    jobTitle: string
    department: string
    phoneNumber: string
    timezone: string
  }
) {
  const result = await (
    await createClient()
  )
    .from('users')
    .update({
      display_name: input.displayName.trim(),
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      job_title: input.jobTitle || null,
      department: input.department || null,
      phone_number: input.phoneNumber || null,
      timezone: input.timezone,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
  if (!result.error) revalidatePath('/dashboard/settings/profile')
  return { error: result.error ? 'Could not update profile.' : null }
}
export async function updateWorkspaceAction(
  workspaceId: string,
  input: {
    name: string
    description: string
    timezone: string
    dateFormat: string
    timeFormat: string
    logoUrl: string | null
  }
) {
  const result = await (
    await createClient()
  )
    .from('workspaces')
    .update({
      name: input.name.trim(),
      description: input.description || null,
      timezone: input.timezone,
      date_format: input.dateFormat,
      time_format: input.timeFormat,
      logo_url: input.logoUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', workspaceId)
  if (!result.error) revalidatePath('/dashboard/settings/workspace')
  return { error: result.error ? 'Could not update workspace. Admin access is required.' : null }
}
export async function addWorkspaceMemberAction(
  workspaceId: string,
  email: string,
  role: Database['public']['Enums']['workspace_role']
) {
  const client = await createClient()
  const current = await getCurrentUserWithMembership(client)
  if (current.status !== 'ok' || (current.user.role !== 'owner' && current.user.role !== 'admin')) {
    return { error: 'Admin access is required to add members.' }
  }
  // Auth admin API (createAdminClient) bypasses RLS entirely, so the
  // permission check above -- not RLS -- is what stops a non-admin from
  // inviting arbitrary people. inviteOrAddWorkspaceMember's own
  // add_workspace_member_by_email call re-checks admin access anyway (it
  // runs as the caller, not the admin client), but that check alone would
  // be too late: the invite email already went out by that point.
  const result = await inviteOrAddWorkspaceMember(client, createAdminClient().auth.admin, {
    workspaceId,
    email,
    role,
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  })
  if (!result.error) revalidatePath('/dashboard/settings/team')
  return result
}
export async function removeWorkspaceMemberAction(membershipId: string) {
  const client = await createClient()
  const current = await getCurrentUserWithMembership(client)
  if (current.status !== 'ok' || (current.user.role !== 'owner' && current.user.role !== 'admin')) {
    return { error: 'Admin access is required to remove members.' }
  }
  const result = await client
    .from('workspace_members')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', membershipId)
    .neq('role', 'owner')
  if (!result.error) revalidatePath('/dashboard/settings/team')
  return { error: result.error ? 'Could not remove member.' : null }
}
export async function updateMemberRoleAction(
  membershipId: string,
  role: Database['public']['Enums']['workspace_role']
) {
  const client = await createClient()
  const current = await getCurrentUserWithMembership(client)
  if (current.status !== 'ok' || (current.user.role !== 'owner' && current.user.role !== 'admin')) {
    return { error: 'Admin access is required to change roles.' }
  }
  const result = await client
    .from('workspace_members')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', membershipId)
  if (!result.error) revalidatePath('/dashboard/settings/team')
  return { error: result.error ? 'Could not update role.' : null }
}
export async function updateEmailAction(email: string) {
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Enter a valid email address.' }
  const result = await (await createClient()).auth.updateUser({ email })
  return { error: result.error ? 'Could not update email. Sign in again and retry.' : null }
}
export async function signOutOtherSessionsAction() {
  const result = await (await createClient()).auth.signOut({ scope: 'others' })
  return { error: result.error ? 'Could not sign out other sessions.' : null }
}
export async function updatePasswordAction(password: string) {
  if (password.length < 12) return { error: 'Password must be at least 12 characters.' }
  const result = await (await createClient()).auth.updateUser({ password })
  return { error: result.error ? 'Could not update password. Sign in again and retry.' : null }
}
export async function setIntegrationConnectionAction(
  workspaceId: string,
  userId: string,
  provider: 'slack' | 'microsoft_teams' | 'google_calendar' | 'dropbox',
  connected: boolean
) {
  const client = await createClient()
  const result = connected
    ? await client.from('workspace_integrations').upsert(
        {
          workspace_id: workspaceId,
          provider,
          connected_by: userId,
          is_connected: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'workspace_id,provider' }
      )
    : await client
        .from('workspace_integrations')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('provider', provider)
  if (!result.error) revalidatePath('/dashboard/settings/integrations')
  return { error: result.error ? 'Could not update integration. Admin access is required.' : null }
}
export async function updateNotificationPreferencesAction(
  userId: string,
  input: {
    inAppEnabled: boolean
    emailEnabled: boolean
    browserEnabled: boolean
    assignedTask: boolean
    mention: boolean
    dueToday: boolean
    overdue: boolean
    reviewRequested: boolean
    taskCompleted: boolean
  }
) {
  const result = await (await createClient()).from('notification_preferences').upsert({
    user_id: userId,
    in_app_enabled: input.inAppEnabled,
    email_enabled: input.emailEnabled,
    browser_enabled: input.browserEnabled,
    assigned_task: input.assignedTask,
    mention: input.mention,
    due_today: input.dueToday,
    overdue: input.overdue,
    review_requested: input.reviewRequested,
    task_completed: input.taskCompleted,
    updated_at: new Date().toISOString(),
  })
  if (!result.error) revalidatePath('/dashboard/settings/notifications')
  return { error: result.error ? 'Could not update notification preferences.' : null }
}
export async function updateTaskPreferencesAction(
  userId: string,
  input: {
    defaultPriority: Database['public']['Enums']['task_priority']
    defaultStatus: Database['public']['Enums']['task_status_type']
    weekStartsOn: number
    workingHoursStart: string
    workingHoursEnd: string
    showCompletedTasks: boolean
  }
) {
  if (![0, 1].includes(input.weekStartsOn) || input.workingHoursStart >= input.workingHoursEnd)
    return { error: 'Check your week start and working hours.' }
  const result = await (await createClient()).from('user_preferences').upsert({
    user_id: userId,
    default_task_priority: input.defaultPriority,
    default_task_status: input.defaultStatus,
    week_starts_on: input.weekStartsOn,
    working_hours_start: input.workingHoursStart,
    working_hours_end: input.workingHoursEnd,
    show_completed_tasks: input.showCompletedTasks,
    updated_at: new Date().toISOString(),
  })
  if (!result.error) revalidatePath('/dashboard/settings/task-preferences')
  return { error: result.error ? 'Could not update task preferences.' : null }
}
