import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { IntegrationsManager } from '@/components/settings/integrations-manager'
import { SettingsHeader } from '@/components/settings/settings-header'
export default async function IntegrationsPage() {
  const client = await createClient()
  const current = await getCurrentUserWithMembership(client)
  if (current.status !== 'ok') return null
  const result = await client
    .from('workspace_integrations')
    .select('provider,is_connected')
    .eq('workspace_id', current.user.workspace.id)
  return (
    <>
      <SettingsHeader
        title="Integrations"
        description="Manage external service connections for this workspace."
      />
      <IntegrationsManager
        workspaceId={current.user.workspace.id}
        userId={current.user.id}
        connected={result.data ?? []}
        canEdit={current.user.role === 'owner' || current.user.role === 'admin'}
      />
    </>
  )
}
