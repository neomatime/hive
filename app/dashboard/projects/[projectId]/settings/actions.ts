'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { archiveProject, restoreProject, updateProject } from '@/services/projects/project-service'
import {
  addProjectMember,
  removeProjectMember,
  updateProjectMemberRole,
} from '@/services/projects/project-member-service'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import type { ProjectMemberRole, ProjectStatus, TaskPriority } from '@/types/project'

function path(id: string) {
  return `/dashboard/projects/${id}`
}
export async function updateProjectAction(
  projectId: string,
  patch: {
    name?: string
    description?: string | null
    status?: ProjectStatus
    priority?: TaskPriority
    startDate?: string | null
    dueDate?: string | null
  }
) {
  const result = await updateProject(await createClient(), projectId, patch)
  if (!result.error) revalidatePath(path(projectId))
  return result
}
export async function archiveProjectAction(projectId: string) {
  const result = await archiveProject(await createClient(), projectId)
  if (!result.error) revalidatePath(path(projectId))
  return result
}
export async function restoreProjectAction(projectId: string) {
  const result = await restoreProject(await createClient(), projectId)
  if (!result.error) revalidatePath(path(projectId))
  return result
}
export async function addProjectMemberAction(
  projectId: string,
  userId: string,
  role: ProjectMemberRole
) {
  const supabase = await createClient()
  const current = await getCurrentUserWithMembership(supabase)
  if (current.status !== 'ok') return { error: 'Could not add member.' }
  const result = await addProjectMember(supabase, projectId, userId, role, current.user.id)
  if (!result.error) revalidatePath(`${path(projectId)}/settings`)
  return result
}
export async function updateProjectMemberRoleAction(
  projectId: string,
  userId: string,
  role: ProjectMemberRole
) {
  const result = await updateProjectMemberRole(await createClient(), projectId, userId, role)
  if (!result.error) revalidatePath(`${path(projectId)}/settings`)
  return result
}
export async function removeProjectMemberAction(projectId: string, userId: string) {
  const result = await removeProjectMember(await createClient(), projectId, userId)
  if (!result.error) revalidatePath(`${path(projectId)}/settings`)
  return result
}
