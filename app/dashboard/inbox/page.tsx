import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { listNotifications } from '@/services/notifications/notification-service'
import { NotificationInbox } from '@/components/notifications/notification-inbox'
export default async function InboxPage() {
  const client = await createClient(),
    current = await getCurrentUserWithMembership(client)
  if (current.status !== 'ok') return null
  await client.rpc('refresh_my_task_notifications')
  return <NotificationInbox notifications={await listNotifications(client, current.user.id)} />
}
