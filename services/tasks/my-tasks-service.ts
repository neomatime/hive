import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { MyTask } from '@/types/my-task'

type Client = SupabaseClient<Database>

export async function listMyTasks(client: Client, userId: string): Promise<MyTask[]> {
  const taskResult = await client
    .from('tasks')
    .select('id,project_id,column_id,title,description,priority,due_date,completed_at')
    .eq('assignee_id', userId)
    .is('deleted_at', null)
  if (taskResult.error || !taskResult.data?.length) return []

  const projectIds = [...new Set(taskResult.data.map((task) => task.project_id))]
  const columnIds = [...new Set(taskResult.data.map((task) => task.column_id))]
  const taskIds = taskResult.data.map((task) => task.id)
  const [projectsResult, columnsResult, linksResult] = await Promise.all([
    client.from('projects').select('id,name,project_code').in('id', projectIds),
    client.from('board_columns').select('id,name,status_type').in('id', columnIds),
    client.from('task_labels').select('task_id,label_id').in('task_id', taskIds),
  ])
  const labelIds = [...new Set((linksResult.data ?? []).map((link) => link.label_id))]
  const labelsResult = labelIds.length
    ? await client.from('labels').select('id,name,color_token').in('id', labelIds)
    : { data: [] }

  return taskResult.data.flatMap((task) => {
    const project = projectsResult.data?.find((item) => item.id === task.project_id)
    const column = columnsResult.data?.find((item) => item.id === task.column_id)
    if (!project || !column) return []
    const ids = new Set(
      (linksResult.data ?? [])
        .filter((link) => link.task_id === task.id)
        .map((link) => link.label_id)
    )
    return [
      {
        id: task.id,
        projectId: task.project_id,
        projectName: project.name,
        projectCode: project.project_code,
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.due_date,
        completedAt: task.completed_at,
        status: column.status_type,
        statusName: column.name,
        labels: (labelsResult.data ?? [])
          .filter((label) => ids.has(label.id))
          .map((label) => ({ id: label.id, name: label.name, colorToken: label.color_token })),
      },
    ]
  })
}
