import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { listCalendarEvents } from '@/services/calendar/calendar-service'
import { CalendarView } from '@/components/calendar/calendar-view'
import { CreateCalendarEvent } from '@/components/calendar/create-calendar-event'
export default async function ProjectCalendarPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const client = await createClient()
  const current = await getCurrentUserWithMembership(client)
  if (current.status !== 'ok') return null
  const project = await client.from('projects').select('id,name').eq('id', projectId).single()
  if (!project.data) return null
  const events = (await listCalendarEvents(client, current.user.workspace.id)).filter(
    (event) => event.projectId === projectId
  )
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateCalendarEvent
          workspaceId={current.user.workspace.id}
          userId={current.user.id}
          projects={[project.data]}
          defaultProjectId={projectId}
        />
      </div>
      <CalendarView events={events} />
    </div>
  )
}
