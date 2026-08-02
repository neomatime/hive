'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createProject } from '@/services/projects/project-service'
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
