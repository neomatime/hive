import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { ProjectDirectory } from '@/components/projects/project-directory'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { listProjectTemplates } from '@/services/settings/template-service'

export default async function ProjectsPage() {
  const client = await createClient()
  const result = await getCurrentUserWithMembership(client)
  if (result.status !== 'ok') return null
  const templates = await listProjectTemplates(client, result.user.workspace.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Projects</h1>
          <p className="text-muted-foreground">Plan, organise, and track your team&apos;s work.</p>
        </div>
        <CreateProjectDialog
          workspaceId={result.user.workspace.id}
          currentUserId={result.user.id}
          templates={templates.filter((template) => template.is_active)}
        />
      </div>
      <ProjectDirectory workspaceId={result.user.workspace.id} />
    </div>
  )
}
