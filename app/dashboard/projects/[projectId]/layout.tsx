import { createClient } from '@/lib/supabase/server'
import { getProject } from '@/services/projects/project-service'
import { ProjectNotFound } from '@/components/empty-states/project-not-found'
import { ProjectShell } from '@/components/projects/project-shell'

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const project = await getProject(await createClient(), projectId)
  if (!project) return <ProjectNotFound />
  return <ProjectShell project={project}>{children}</ProjectShell>
}
