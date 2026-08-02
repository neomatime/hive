import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { listProjectTemplates } from '@/services/settings/template-service'
import { ProjectTemplatesManager } from '@/components/settings/project-templates-manager'
import { SettingsHeader } from '@/components/settings/settings-header'
export default async function ProjectTemplatesPage() {
  const client = await createClient(),
    current = await getCurrentUserWithMembership(client)
  if (current.status !== 'ok') return null
  const templates = await listProjectTemplates(client, current.user.workspace.id)
  return (
    <>
      <SettingsHeader
        title="Project templates"
        description="Create reusable starting points for consistent project delivery."
      />
      <ProjectTemplatesManager
        templates={templates}
        canEdit={['owner', 'admin'].includes(current.user.role)}
      />
    </>
  )
}
