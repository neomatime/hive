'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import {
  addTaskComment,
  addTaskLabel,
  createLabel,
  removeTaskLabel,
  updateTask,
} from '@/services/tasks/task-detail-service'
import type { TaskPriority } from '@/types/project'
const path = (id: string) => `/dashboard/projects/${id}/board`
export async function updateTaskAction(
  projectId: string,
  taskId: string,
  input: {
    title: string
    description: string
    priority: TaskPriority
    assigneeId: string
    dueDate: string
  }
) {
  const result = await updateTask(await createClient(), taskId, {
    title: input.title,
    description: input.description || null,
    priority: input.priority,
    assigneeId: input.assigneeId || null,
    dueDate: input.dueDate || null,
  })
  if (!result.error) revalidatePath(path(projectId))
  return result
}
export async function addTaskCommentAction(projectId: string, taskId: string, content: string) {
  const client = await createClient(),
    user = await getCurrentUserWithMembership(client)
  if (user.status !== 'ok') return { error: 'Could not add comment.' }
  const result = await addTaskComment(client, taskId, user.user.id, content)
  if (!result.error) revalidatePath(path(projectId))
  return result
}
export async function setTaskLabelAction(
  projectId: string,
  taskId: string,
  labelId: string,
  selected: boolean
) {
  const client = await createClient()
  const result = selected
    ? await addTaskLabel(client, taskId, labelId)
    : await removeTaskLabel(client, taskId, labelId)
  if (!result.error) revalidatePath(path(projectId))
  return result
}

export async function createTaskLabelAction(projectId: string, name: string, colorToken: string) {
  const client = await createClient()
  const user = await getCurrentUserWithMembership(client)
  if (user.status !== 'ok') return { label: null, error: 'Could not create label.' }
  const result = await createLabel(client, {
    workspaceId: user.user.workspace.id,
    createdBy: user.user.id,
    name,
    colorToken,
  })
  if (!result.error) revalidatePath(path(projectId))
  return result
}
