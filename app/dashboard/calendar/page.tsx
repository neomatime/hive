import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { listCalendarEvents } from '@/services/calendar/calendar-service'
import { CalendarView } from '@/components/calendar/calendar-view'

export default async function CalendarPage() {
  const client = await createClient()
  const result = await getCurrentUserWithMembership(client)
  if (result.status !== 'ok') return null
  const events = await listCalendarEvents(client, result.user.workspace.id)
  return <CalendarView events={events} />
}
