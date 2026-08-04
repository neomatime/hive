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
import { createSubtask, toggleSubtaskComplete } from '@/services/tasks/subtask-service'
import { watchTask, unwatchTask } from '@/services/tasks/watcher-service'
import { addDependency, removeDependency } from '@/services/tasks/dependency-service'
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

export async function createSubtaskAction(
  projectId: string,
  input: { parentTaskId: string; boardId: string; columnId: string; title: string }
) {
  const client = await createClient()
  const user = await getCurrentUserWithMembership(client)
  if (user.status !== 'ok') return { subtask: null, error: 'Could not create subtask.' }
  const result = await createSubtask(client, {
    parentTaskId: input.parentTaskId,
    projectId,
    boardId: input.boardId,
    columnId: input.columnId,
    title: input.title,
    createdBy: user.user.id,
  })
  if (!result.error) revalidatePath(path(projectId))
  return result
}

export async function toggleSubtaskCompleteAction(
  projectId: string,
  subtaskId: string,
  isComplete: boolean
) {
  const result = await toggleSubtaskComplete(await createClient(), subtaskId, isComplete)
  if (!result.error) revalidatePath(path(projectId))
  return result
}

export async function watchTaskAction(projectId: string, taskId: string) {
  const client = await createClient()
  const user = await getCurrentUserWithMembership(client)
  if (user.status !== 'ok') return { error: 'Could not watch task.' }
  const result = await watchTask(client, taskId, user.user.id)
  if (!result.error) revalidatePath(path(projectId))
  return result
}

export async function unwatchTaskAction(projectId: string, taskId: string) {
  const client = await createClient()
  const user = await getCurrentUserWithMembership(client)
  if (user.status !== 'ok') return { error: 'Could not unwatch task.' }
  const result = await unwatchTask(client, taskId, user.user.id)
  if (!result.error) revalidatePath(path(projectId))
  return result
}

export async function addDependencyAction(
  projectId: string,
  blockingTaskId: string,
  blockedTaskId: string
) {
  const result = await addDependency(await createClient(), blockingTaskId, blockedTaskId)
  if (!result.error) revalidatePath(path(projectId))
  return result
}

export async function removeDependencyAction(projectId: string, dependencyId: string) {
  const result = await removeDependency(await createClient(), dependencyId)
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
