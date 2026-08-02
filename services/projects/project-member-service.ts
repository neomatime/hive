import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { ProjectMember, ProjectMemberRole } from '@/types/project'

type MemberRow = {
  id: string
  project_id: string
  user_id: string
  role: ProjectMemberRole
  user: { display_name: string; avatar_url: string | null }
}

export async function listProjectMembers(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<ProjectMember[]> {
  const { data, error } = await supabase
    .from('project_members')
    .select(
      'id, project_id, user_id, role, user:users!project_members_user_id_fkey(display_name, avatar_url)'
    )
    .eq('project_id', projectId)
  if (error || !data) return []
  return (data as unknown as MemberRow[]).map((row) => ({
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    role: row.role,
    displayName: row.user.display_name,
    avatarUrl: row.user.avatar_url,
  }))
}

export async function addProjectMember(
  supabase: SupabaseClient<Database>,
  projectId: string,
  userId: string,
  role: ProjectMemberRole,
  addedBy: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('project_members').insert({
    project_id: projectId,
    user_id: userId,
    role,
    added_by: addedBy,
  })
  return { error: error ? 'Could not add member. They may already be on this project.' : null }
}

export async function updateProjectMemberRole(
  supabase: SupabaseClient<Database>,
  projectId: string,
  userId: string,
  newRole: ProjectMemberRole
): Promise<{ error: string | null }> {
  if (newRole === 'project_owner') {
    const { error } = await supabase.rpc('reassign_project_owner', {
      p_project_id: projectId,
      p_new_owner_user_id: userId,
    })
    return { error: error ? 'Could not reassign project owner.' : null }
  }
  const { error } = await supabase
    .from('project_members')
    .update({ role: newRole })
    .eq('project_id', projectId)
    .eq('user_id', userId)
  return { error: error ? 'Could not update member role.' : null }
}

export async function removeProjectMember(
  supabase: SupabaseClient<Database>,
  projectId: string,
  userId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId)
  return { error: error ? 'Could not remove member.' : null }
}
