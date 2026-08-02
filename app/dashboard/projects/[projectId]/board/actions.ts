'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { createTask, deleteTask, moveTask } from '@/services/tasks/task-service'
import type { TaskPriority } from '@/types/project'

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
