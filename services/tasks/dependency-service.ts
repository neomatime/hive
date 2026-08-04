import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type Client = SupabaseClient<Database>

export interface BlockingTask {
  dependencyId: string
  taskId: string
  title: string
  isComplete: boolean
}

type BlockingTaskRow = {
  id: string
  blocking_task_id: string
  blocking_task: { id: string; title: string; completed_at: string | null }
}

export async function listBlockingTasks(client: Client, taskId: string): Promise<BlockingTask[]> {
  const result = await client
    .from('task_dependencies')
    .select(
      'id,blocking_task_id,blocking_task:tasks!task_dependencies_blocking_task_id_fkey(id,title,completed_at)'
    )
    .eq('blocked_task_id', taskId)
  if (result.error || !result.data) return []
  return (result.data as unknown as BlockingTaskRow[]).map((row) => ({
    dependencyId: row.id,
    taskId: row.blocking_task.id,
    title: row.blocking_task.title,
    isComplete: row.blocking_task.completed_at !== null,
  }))
}

export async function addDependency(
  client: Client,
  blockingTaskId: string,
  blockedTaskId: string
): Promise<{ dependencyId: string | null; error: string | null }> {
  const result = await client
    .from('task_dependencies')
    .insert({ blocking_task_id: blockingTaskId, blocked_task_id: blockedTaskId })
    .select('id')
    .single()
  if (result.error?.code === '23505') {
    return { dependencyId: null, error: 'That task is already listed as a blocker.' }
  }
  if (result.error?.code === '23514') {
    return { dependencyId: null, error: 'A task cannot block itself.' }
  }
  if (result.error || !result.data) {
    return { dependencyId: null, error: 'Could not add the dependency.' }
  }
  return { dependencyId: result.data.id, error: null }
}

export async function removeDependency(client: Client, dependencyId: string) {
  const result = await client.from('task_dependencies').delete().eq('id', dependencyId)
  return { error: result.error ? 'Could not remove the dependency.' : null }
}

export async function listCandidateTasks(
  client: Client,
  projectId: string,
  excludeTaskId: string
): Promise<{ id: string; title: string }[]> {
  const result = await client
    .from('tasks')
    .select('id,title')
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .neq('id', excludeTaskId)
  return result.data ?? []
}
