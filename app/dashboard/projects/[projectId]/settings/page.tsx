import { createClient } from '@/lib/supabase/server'
import { getProject } from '@/services/projects/project-service'
import { listProjectMembers } from '@/services/projects/project-member-service'
import { listWorkspaceTeam } from '@/services/settings/settings-service'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { ProjectSettingsPanel } from '@/components/projects/project-settings-panel'
import { ProjectMemberList } from '@/components/projects/project-member-list'
export default async function Settings({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const supabase = await createClient()
  const project = await getProject(supabase, projectId)
  if (!project) return null
  const [members, current] = await Promise.all([
    listProjectMembers(supabase, projectId),
    getCurrentUserWithMembership(supabase),
  ])
  const team =
    current.status === 'ok' ? await listWorkspaceTeam(supabase, current.user.workspace.id) : []
  const memberUserIds = new Set(members.map((member) => member.userId))
  const availableMembers = team
    .filter((entry) => entry.is_active && entry.user && !memberUserIds.has(entry.user_id))
    .map((entry) => ({
      userId: entry.user_id,
      displayName: entry.user!.display_name,
      email: entry.user!.email,
    }))
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2>Project settings</h2>
        <ProjectSettingsPanel project={project} />
      </section>
      <section className="space-y-4">
        <h2>Team</h2>
        <ProjectMemberList
          projectId={projectId}
          members={members}
          availableMembers={availableMembers}
        />
      </section>
    </div>
  )
}
