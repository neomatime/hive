'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import {
  createTask,
  deleteTask,
  moveTask,
  moveTasks,
  updateColumnWipLimit,
} from '@/services/tasks/task-service'
import { deleteFilterPreset, saveFilterPreset } from '@/services/tasks/filter-preset-service'
import type { TaskPriority } from '@/types/project'
import type { BoardFilters } from '@/types/task'

const path = (id: string) => `/dashboard/projects/${id}/board`
export async function createTaskAction(input: {
  projectId: string
  boardId: string
  columnId: string
  title: string
  priority: TaskPriority
  dueDate?: string
}) {
  const client = await createClient()
  const user = await getCurrentUserWithMembership(client)
  if (user.status !== 'ok') return { error: 'Could not create task.' }
  const result = await createTask(client, { ...input, createdBy: user.user.id })
  if (!result.error) revalidatePath(path(input.projectId))
  return { error: result.error }
}
export async function moveTaskAction(
  projectId: string,
  taskId: string,
  columnId: string,
  isTerminal: boolean,
  position: number
) {
  const result = await moveTask(
    await createClient(),
    taskId,
    { id: columnId, isTerminal },
    position
  )
  if (!result.error) revalidatePath(path(projectId))
  return result
}
export async function deleteTaskAction(projectId: string, taskId: string) {
  const result = await deleteTask(await createClient(), taskId)
  if (!result.error) revalidatePath(path(projectId))
  return result
}
export async function moveTasksAction(
  projectId: string,
  taskIds: string[],
  columnId: string,
  isTerminal: boolean
) {
  const result = await moveTasks(await createClient(), taskIds, { id: columnId, isTerminal })
  if (!result.error) revalidatePath(path(projectId))
  return result
}
export async function updateColumnWipLimitAction(
  projectId: string,
  columnId: string,
  wipLimit: number | null
) {
  const result = await updateColumnWipLimit(await createClient(), columnId, wipLimit)
  if (!result.error) revalidatePath(path(projectId))
  return result
}
export async function saveFilterPresetAction(
  projectId: string,
  boardId: string,
  name: string,
  filters: BoardFilters
) {
  const client = await createClient()
  const user = await getCurrentUserWithMembership(client)
  if (user.status !== 'ok') return { preset: null, error: 'Could not save the filter preset.' }
  const result = await saveFilterPreset(client, { boardId, userId: user.user.id, name, filters })
  if (!result.error) revalidatePath(path(projectId))
  return result
}
export async function deleteFilterPresetAction(projectId: string, presetId: string) {
  const result = await deleteFilterPreset(await createClient(), presetId)
  if (!result.error) revalidatePath(path(projectId))
  return result
}
