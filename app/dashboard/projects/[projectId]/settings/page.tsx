import { createClient } from '@/lib/supabase/server'
import { getProject } from '@/services/projects/project-service'
import { listProjectMembers } from '@/services/projects/project-member-service'
import { ProjectSettingsPanel } from '@/components/projects/project-settings-panel'
import { ProjectMemberList } from '@/components/projects/project-member-list'
export default async function Settings({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const supabase = await createClient()
  const project = await getProject(supabase, projectId)
  if (!project) return null
  const members = await listProjectMembers(supabase, projectId)
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2>Project settings</h2>
        <ProjectSettingsPanel project={project} />
      </section>
      <section className="space-y-4">
        <h2>Team</h2>
        <ProjectMemberList projectId={projectId} members={members} />
      </section>
    </div>
  )
}
