import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { TaskPriority } from '@/types/project'

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
