import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { getWorkspace } from '@/services/settings/settings-service'
import { WorkspaceForm } from '@/components/settings/settings-forms'
import { SettingsHeader } from '@/components/settings/settings-header'
export default async function WorkspacePage() {
  const client = await createClient()
  const current = await getCurrentUserWithMembership(client)
  if (current.status !== 'ok') return null
  const workspace = await getWorkspace(client, current.user.workspace.id)
  if (!workspace) return null
  return (
    <>
      <SettingsHeader title="Workspace" description="Configure organization-wide defaults." />
      <WorkspaceForm
        workspace={workspace}
        canEdit={current.user.role === 'owner' || current.user.role === 'admin'}
      />
    </>
  )
}
