import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { TaskPriority } from '@/types/project'
import type { TaskLabel } from '@/types/task'

type Client = SupabaseClient<Database>
export interface TaskComment {
  id: string
  authorId: string
  content: string
  createdAt: string
}
export async function updateTask(
  client: Client,
  taskId: string,
  patch: {
    title: string
    description: string | null
    priority: TaskPriority
    assigneeId: string | null
    dueDate: string | null
  }
) {
  const result = await client
    .from('tasks')
    .update({
      title: patch.title.trim(),
      description: patch.description,
      priority: patch.priority,
      assignee_id: patch.assigneeId,
      due_date: patch.dueDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
  return { error: result.error ? 'Could not update task.' : null }
}
export async function listTaskComments(client: Client, taskId: string): Promise<TaskComment[]> {
  const result = await client
    .from('task_comments')
    .select('id,author_id,content,created_at')
    .eq('task_id', taskId)
    .is('deleted_at', null)
    .order('created_at')
  if (result.error) return []
  return (result.data ?? []).map((row) => ({
    id: row.id,
    authorId: row.author_id,
    content: row.content,
    createdAt: row.created_at,
  }))
}
export async function addTaskComment(
  client: Client,
  taskId: string,
  authorId: string,
  content: string
) {
  const result = await client
    .from('task_comments')
    .insert({ task_id: taskId, author_id: authorId, content: content.trim() })
  return { error: result.error ? 'Could not add comment.' : null }
}
export async function listProjectLabels(client: Client, projectId: string): Promise<TaskLabel[]> {
  const project = await client.from('projects').select('workspace_id').eq('id', projectId).single()
  if (project.error || !project.data) return []
  const labels = await client
    .from('labels')
    .select('id,name,color_token')
    .eq('workspace_id', project.data.workspace_id)
    .order('name')
  return (labels.data ?? []).map((label) => ({
    id: label.id,
    name: label.name,
    colorToken: label.color_token,
  }))
}

export async function addTaskLabel(client: Client, taskId: string, labelId: string) {
  const result = await client.from('task_labels').upsert({ task_id: taskId, label_id: labelId })
  return { error: result.error ? 'Could not add label.' : null }
}

export async function removeTaskLabel(client: Client, taskId: string, labelId: string) {
  const result = await client
    .from('task_labels')
    .delete()
    .eq('task_id', taskId)
    .eq('label_id', labelId)
  return { error: result.error ? 'Could not remove label.' : null }
}

export async function createLabel(
  client: Client,
  input: { workspaceId: string; name: string; colorToken: string; createdBy: string }
) {
  const result = await client
    .from('labels')
    .insert({
      workspace_id: input.workspaceId,
      name: input.name.trim(),
      color_token: input.colorToken,
      created_by: input.createdBy,
    })
    .select('id,name,color_token')
    .single()
  return {
    label: result.data
      ? { id: result.data.id, name: result.data.name, colorToken: result.data.color_token }
      : null,
    error: result.error ? 'Could not create label. Admin access may be required.' : null,
  }
}
