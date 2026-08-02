import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { getTaskPreferences } from '@/services/settings/settings-service'
import { TaskPreferencesForm } from '@/components/settings/task-preferences-form'
import { SettingsHeader } from '@/components/settings/settings-header'

export default async function TaskPreferencesPage() {
  const client = await createClient()
  const current = await getCurrentUserWithMembership(client)
  if (current.status !== 'ok') return null
  const preferences = await getTaskPreferences(client, current.user.id)
  return (
    <>
      <SettingsHeader
        title="Task preferences"
        description="Set sensible defaults for your planning and workday."
      />
      <TaskPreferencesForm preferences={preferences} />
    </>
  )
}
