import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { listProjects } from '@/services/projects/project-service'
import { listFiles } from '@/services/files/file-service'
import { FilesDashboard } from '@/components/files/files-dashboard'

export default async function FilesPage() {
  const client = await createClient()
  const result = await getCurrentUserWithMembership(client)
  if (result.status !== 'ok') return null
  const [files, projects] = await Promise.all([
    listFiles(client, result.user.workspace.id),
    listProjects(client, result.user.workspace.id, { sortBy: 'name', sortDirection: 'asc' }),
  ])
  return (
    <FilesDashboard
      initialFiles={files}
      projects={projects}
      workspaceId={result.user.workspace.id}
      userId={result.user.id}
    />
  )
}
