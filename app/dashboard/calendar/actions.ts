'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
export async function createCalendarEventAction(input: {
  workspaceId: string
  projectId: string
  userId: string
  type: 'meeting' | 'milestone'
  title: string
  startsAt: string
  endsAt: string
}) {
  if (!input.title.trim() || !input.startsAt) return { error: 'Title and start time are required.' }
  if (input.endsAt && input.endsAt < input.startsAt)
    return { error: 'End time cannot be before start time.' }
  const result = await (
    await createClient()
  )
    .from('calendar_events')
    .insert({
      workspace_id: input.workspaceId,
      project_id: input.projectId,
      created_by: input.userId,
      type: input.type,
      title: input.title.trim(),
      starts_at: new Date(input.startsAt).toISOString(),
      ends_at: input.endsAt ? new Date(input.endsAt).toISOString() : null,
    })
  if (!result.error) {
    revalidatePath('/dashboard/calendar')
    revalidatePath(`/dashboard/projects/${input.projectId}/calendar`)
  }
  return { error: result.error ? 'Could not create calendar event.' : null }
}
