'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
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
      updated_at: new Date().toISOString(),
    })
    .eq('id', workspaceId)
  if (!result.error) revalidatePath('/dashboard/settings/workspace')
  return { error: result.error ? 'Could not update workspace. Admin access is required.' : null }
}
export async function updateMemberRoleAction(
  membershipId: string,
  role: Database['public']['Enums']['workspace_role']
) {
  const result = await (
    await createClient()
  )
    .from('workspace_members')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', membershipId)
  if (!result.error) revalidatePath('/dashboard/settings/team')
  return { error: result.error ? 'Could not update role. Admin access is required.' : null }
}
export async function updatePasswordAction(password: string) {
  if (password.length < 12) return { error: 'Password must be at least 12 characters.' }
  const result = await (await createClient()).auth.updateUser({ password })
  return { error: result.error ? 'Could not update password. Sign in again and retry.' : null }
}
