import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { listWorkspaceTeam } from '@/services/settings/settings-service'
import { TeamTable } from '@/components/settings/settings-forms'
import { SettingsHeader } from '@/components/settings/settings-header'
export default async function TeamPage() {
  const client = await createClient()
  const current = await getCurrentUserWithMembership(client)
  if (current.status !== 'ok') return null
  const members = await listWorkspaceTeam(client, current.user.workspace.id)
  return (
    <>
      <SettingsHeader title="Team" description="Review workspace access and roles." />
      <TeamTable
        members={members}
        canEdit={current.user.role === 'owner' || current.user.role === 'admin'}
        workspaceId={current.user.workspace.id}
      />
    </>
  )
}
