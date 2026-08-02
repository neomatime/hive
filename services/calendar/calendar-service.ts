import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { CalendarEvent } from '@/types/calendar'

type Client = SupabaseClient<Database>

export async function listCalendarEvents(
  client: Client,
  workspaceId: string
): Promise<CalendarEvent[]> {
  const projects = await client
    .from('projects')
    .select('id,name,project_code,due_date,completed_at')
    .eq('workspace_id', workspaceId)
    .is('archived_at', null)
  if (projects.error || !projects.data) return []
  const projectIds = projects.data.map((project) => project.id)
  const tasks = projectIds.length
    ? await client
        .from('tasks')
        .select('id,project_id,title,due_date,completed_at')
        .in('project_id', projectIds)
        .is('deleted_at', null)
        .not('due_date', 'is', null)
    : { data: [], error: null }
  const projectMap = new Map(projects.data.map((project) => [project.id, project]))
  const projectEvents: CalendarEvent[] = projects.data
    .filter((project) => project.due_date)
    .map((project) => ({
      id: `project-${project.id}`,
      type: 'project',
      title: `${project.name} deadline`,
      date: project.due_date!,
      projectId: project.id,
      projectName: project.name,
      projectCode: project.project_code,
      completed: !!project.completed_at,
    }))
  const taskEvents: CalendarEvent[] = (tasks.data ?? []).flatMap((task) => {
    const project = projectMap.get(task.project_id)
    if (!project || !task.due_date) return []
    return [
      {
        id: `task-${task.id}`,
        type: 'task' as const,
        title: task.title,
        date: task.due_date,
        projectId: task.project_id,
        projectName: project.name,
        projectCode: project.project_code,
        completed: !!task.completed_at,
      },
    ]
  })
  return [...projectEvents, ...taskEvents].sort((a, b) => a.date.localeCompare(b.date))
}
