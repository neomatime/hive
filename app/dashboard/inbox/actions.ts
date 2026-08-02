'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
export async function markNotificationReadAction(id: string) {
  const result = await (
    await createClient()
  )
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id)
  if (!result.error) revalidatePath('/dashboard/inbox')
  return { error: result.error ? 'Could not update notification.' : null }
}
export async function markAllNotificationsReadAction() {
  const result = await (
    await createClient()
  )
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('is_read', false)
  if (!result.error) revalidatePath('/dashboard/inbox')
  return { error: result.error ? 'Could not update notifications.' : null }
}
