import { createClient } from '@/lib/supabase/server'
import { getProject } from '@/services/projects/project-service'
import { ProjectOverviewPanel } from '@/components/projects/project-overview-panel'
export default async function Overview({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const project = await getProject(await createClient(), projectId)
  return project ? <ProjectOverviewPanel project={project} /> : null
}
