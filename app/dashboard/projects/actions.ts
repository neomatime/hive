'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  archiveProjects,
  createProject,
  duplicateProject,
  restoreProjects,
} from '@/services/projects/project-service'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import type { ProjectStatus, TaskPriority } from '@/types/project'

export interface CreateProjectFormInput {
  workspaceId: string
  name: string
  description: string
  status: ProjectStatus
  priority: TaskPriority
  ownerId: string
  startDate: string
  dueDate: string
  memberIds: string[]
  templateId?: string | null
}
export async function createProjectAction(
  input: CreateProjectFormInput
): Promise<{ error: string | null }> {
  const result = await createProject(await createClient(), {
    ...input,
    description: input.description || null,
    startDate: input.startDate || null,
    dueDate: input.dueDate || null,
  })
  if (!result.error) revalidatePath('/dashboard/projects')
  return { error: result.error }
}

export async function duplicateProjectAction(projectId: string): Promise<{ error: string | null }> {
  const client = await createClient()
  const current = await getCurrentUserWithMembership(client)
  if (current.status !== 'ok') return { error: 'Could not duplicate project.' }

  const result = await duplicateProject(client, projectId, current.user.id)
  if (!result.error) revalidatePath('/dashboard/projects')
  return { error: result.error }
}

export async function bulkArchiveProjectsAction(
  projectIds: string[]
): Promise<{ error: string | null }> {
  const result = await archiveProjects(await createClient(), projectIds)
  if (!result.error) revalidatePath('/dashboard/projects')
  return { error: result.error }
}

export async function bulkRestoreProjectsAction(
  projectIds: string[]
): Promise<{ error: string | null }> {
  const result = await restoreProjects(await createClient(), projectIds)
  if (!result.error) revalidatePath('/dashboard/projects')
  return { error: result.error }
}
