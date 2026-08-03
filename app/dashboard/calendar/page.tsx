import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { listCalendarEvents } from '@/services/calendar/calendar-service'
import { CalendarView } from '@/components/calendar/calendar-view'
import { CreateCalendarEvent } from '@/components/calendar/create-calendar-event'
export default async function CalendarPage() {
  const client = await createClient()
  const result = await getCurrentUserWithMembership(client)
  if (result.status !== 'ok') return null
  const [events, projects] = await Promise.all([
    listCalendarEvents(client, result.user.workspace.id),
    client
      .from('projects')
      .select('id,name')
      .eq('workspace_id', result.user.workspace.id)
      .is('archived_at', null)
      .order('name'),
  ])
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateCalendarEvent
          workspaceId={result.user.workspace.id}
          userId={result.user.id}
          projects={projects.data ?? []}
        />
      </div>
      <CalendarView events={events} />
    </div>
  )
}
