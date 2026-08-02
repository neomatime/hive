import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { BoardColumn, ProjectBoard, Task } from '@/types/task'
import type { TaskPriority } from '@/types/project'

type Client = SupabaseClient<Database>
function mapTask(row: Database['public']['Tables']['tasks']['Row']): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    boardId: row.board_id,
    columnId: row.column_id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    assigneeId: row.assignee_id,
    dueDate: row.due_date,
    position: row.position,
    progressPercentage: row.progress_percentage,
    isBlocked: row.is_blocked,
    labels: [],
  }
}

export async function getProjectBoard(
  client: Client,
  projectId: string
): Promise<ProjectBoard | null> {
  const boardResult = await client
    .from('boards')
    .select('id,project_id,name')
    .eq('project_id', projectId)
    .eq('is_default', true)
    .maybeSingle()
  if (boardResult.error || !boardResult.data) return null
  const [columnsResult, tasksResult] = await Promise.all([
    client.from('board_columns').select('*').eq('board_id', boardResult.data.id).order('position'),
    client
      .from('tasks')
      .select('*')
      .eq('board_id', boardResult.data.id)
      .is('deleted_at', null)
      .order('position'),
  ])
  if (columnsResult.error || tasksResult.error) return null
  const tasks = (tasksResult.data ?? []).map(mapTask)
  if (tasks.length) {
    const links = await client
      .from('task_labels')
      .select('task_id,label_id')
      .in(
        'task_id',
        tasks.map((task) => task.id)
      )
    const labelIds = [...new Set((links.data ?? []).map((link) => link.label_id))]
    if (labelIds.length) {
      const labels = await client.from('labels').select('id,name,color_token').in('id', labelIds)
      for (const task of tasks) {
        const ids = new Set(
          (links.data ?? []).filter((link) => link.task_id === task.id).map((link) => link.label_id)
        )
        task.labels = (labels.data ?? [])
          .filter((label) => ids.has(label.id))
          .map((label) => ({ id: label.id, name: label.name, colorToken: label.color_token }))
      }
    }
  }
  const columns: BoardColumn[] = (columnsResult.data ?? []).map((column) => ({
    id: column.id,
    boardId: column.board_id,
    name: column.name,
    status: column.status_type,
    position: column.position,
    isTerminal: column.is_terminal,
    tasks: tasks.filter((task) => task.columnId === column.id),
  }))
  return {
    id: boardResult.data.id,
    projectId: boardResult.data.project_id,
    name: boardResult.data.name,
    columns,
  }
}

export interface CreateTaskInput {
  projectId: string
  boardId: string
  columnId: string
  title: string
  description?: string | null
  priority: TaskPriority
  assigneeId?: string | null
  dueDate?: string | null
  createdBy: string
}
export async function createTask(
  client: Client,
  input: CreateTaskInput
): Promise<{ task: Task | null; error: string | null }> {
  const last = await client
    .from('tasks')
    .select('position')
    .eq('column_id', input.columnId)
    .is('deleted_at', null)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()
  const position = (last.data?.position ?? 0) + 1024
  const result = await client
    .from('tasks')
    .insert({
      project_id: input.projectId,
      board_id: input.boardId,
      column_id: input.columnId,
      title: input.title.trim(),
      description: input.description || null,
      priority: input.priority,
      assignee_id: input.assigneeId || null,
      due_date: input.dueDate || null,
      created_by: input.createdBy,
      position,
    })
    .select()
    .single()
  if (result.error || !result.data) return { task: null, error: 'Could not create task.' }
  return { task: mapTask(result.data), error: null }
}
export async function moveTask(
  client: Client,
  taskId: string,
  column: Pick<BoardColumn, 'id' | 'isTerminal'>,
  position: number
) {
  const result = await client
    .from('tasks')
    .update({
      column_id: column.id,
      position,
      completed_at: column.isTerminal ? new Date().toISOString() : null,
      progress_percentage: column.isTerminal ? 100 : 0,
    })
    .eq('id', taskId)
  return { error: result.error ? 'Could not move task.' : null }
}
export async function deleteTask(client: Client, taskId: string) {
  const result = await client
    .from('tasks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', taskId)
  return { error: result.error ? 'Could not delete task.' : null }
}
