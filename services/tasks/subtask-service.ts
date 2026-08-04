import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { Subtask } from '@/types/task'

type Client = SupabaseClient<Database>

function mapSubtask(row: {
  id: string
  parent_task_id: string | null
  title: string
  completed_at: string | null
  position: number
}): Subtask {
  return {
    id: row.id,
    parentTaskId: row.parent_task_id!,
    title: row.title,
    isComplete: row.completed_at !== null,
    position: row.position,
  }
}

export async function listSubtasks(client: Client, parentTaskId: string): Promise<Subtask[]> {
  const result = await client
    .from('tasks')
    .select('id, parent_task_id, title, completed_at, position')
    .eq('parent_task_id', parentTaskId)
    .is('deleted_at', null)
    .order('position')
  if (result.error || !result.data) return []
  return result.data.map(mapSubtask)
}

export interface CreateSubtaskInput {
  parentTaskId: string
  projectId: string
  boardId: string
  columnId: string
  title: string
  createdBy: string
}

export async function createSubtask(
  client: Client,
  input: CreateSubtaskInput
): Promise<{ subtask: Subtask | null; error: string | null }> {
  const last = await client
    .from('tasks')
    .select('position')
    .eq('parent_task_id', input.parentTaskId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()
  const position = (last.data?.position ?? 0) + 1024

  const result = await client
    .from('tasks')
    .insert({
      parent_task_id: input.parentTaskId,
      project_id: input.projectId,
      board_id: input.boardId,
      column_id: input.columnId,
      title: input.title.trim(),
      created_by: input.createdBy,
      position,
    })
    .select('id, parent_task_id, title, completed_at, position')
    .single()
  if (result.error || !result.data) return { subtask: null, error: 'Could not create subtask.' }
  return { subtask: mapSubtask(result.data), error: null }
}

export async function toggleSubtaskComplete(
  client: Client,
  subtaskId: string,
  isComplete: boolean
) {
  const result = await client
    .from('tasks')
    .update(
      isComplete
        ? { completed_at: new Date().toISOString(), progress_percentage: 100 }
        : { completed_at: null, progress_percentage: 0 }
    )
    .eq('id', subtaskId)
  return { error: result.error ? 'Could not update subtask.' : null }
}
