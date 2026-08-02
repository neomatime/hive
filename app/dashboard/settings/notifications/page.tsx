import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { getNotificationPreferences } from '@/services/settings/settings-service'
import { NotificationPreferencesForm } from '@/components/settings/notification-preferences-form'
import { SettingsHeader } from '@/components/settings/settings-header'

export default async function NotificationsPage() {
  const client = await createClient()
  const current = await getCurrentUserWithMembership(client)
  if (current.status !== 'ok') return null
  const preferences = await getNotificationPreferences(client, current.user.id)
  return (
    <>
      <SettingsHeader
        title="Notifications"
        description="Choose where HIVE contacts you and which activity matters."
      />
      <NotificationPreferencesForm preferences={preferences} />
    </>
  )
}
