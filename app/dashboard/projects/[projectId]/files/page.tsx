import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { getProject } from '@/services/projects/project-service'
import { listFiles } from '@/services/files/file-service'
import { FilesDashboard } from '@/components/files/files-dashboard'

export default async function ProjectFilesPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const client = await createClient()
  const result = await getCurrentUserWithMembership(client)
  if (result.status !== 'ok') return null
  const project = await getProject(client, projectId)
  if (!project) return null
  const files = await listFiles(client, result.user.workspace.id, projectId)
  return (
    <FilesDashboard
      initialFiles={files}
      projects={[project]}
      workspaceId={result.user.workspace.id}
      userId={result.user.id}
      fixedProjectId={projectId}
    />
  )
}
