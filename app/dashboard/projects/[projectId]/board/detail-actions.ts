'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { addTaskComment, updateTask } from '@/services/tasks/task-detail-service'
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
