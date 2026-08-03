import type { SupabaseClient } from '@supabase/supabase-js'
import type { CalendarEvent } from '@/types/calendar'

type Client = SupabaseClient

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
  const customEvents = projectIds.length
    ? await client.from('calendar_events').select('*').in('project_id', projectIds)
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
  const scheduledEvents: CalendarEvent[] = (customEvents.data ?? []).flatMap((event) => {
    const project = projectMap.get(event.project_id)
    if (!project) return []
    const startsAt = new Date(event.starts_at)
    return [
      {
        id: 'calendar-' + event.id,
        type: event.type as 'meeting' | 'milestone',
        title: event.title,
        date: event.starts_at.slice(0, 10),
        time: startsAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        projectId: event.project_id,
        projectName: project.name,
        projectCode: project.project_code,
        completed: false,
      },
    ]
  })
  return [...projectEvents, ...taskEvents, ...scheduledEvents].sort((a, b) =>
    a.date.localeCompare(b.date)
  )
}
