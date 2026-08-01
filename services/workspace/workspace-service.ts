import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { WorkspaceRole } from '@/types/workspace'

export interface CurrentUserWithMembership {
  id: string
  authUserId: string
  displayName: string
  email: string
  avatarUrl: string | null
  workspace: { id: string; name: string }
  role: WorkspaceRole
}

export type CurrentUserResult =
  | { status: 'unauthenticated' }
  | { status: 'no-active-membership' }
  | { status: 'ok'; user: CurrentUserWithMembership }

export async function getCurrentUserWithMembership(
  supabase: SupabaseClient<Database>
): Promise<CurrentUserResult> {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return { status: 'unauthenticated' }

  // `workspace_members` has two FKs to `users` (user_id and invited_by), so the
  // embed must be disambiguated with a hint — otherwise PostgREST returns a
  // PGRST201 "more than one relationship was found" error at request time, and
  // every authenticated user would incorrectly fall through to `unauthenticated`.
  // `!user_id` picks the FK we actually want (the membership row belongs to this
  // user), not `invited_by` (memberships this user facilitated for someone else).
  const { data, error } = await supabase
    .from('users')
    .select(
      `
      id,
      auth_user_id,
      display_name,
      email,
      avatar_url,
      workspace_members!user_id ( role, workspace:workspaces ( id, name ) )
    `
    )
    .eq('auth_user_id', authUser.id)
    .single()

  if (error || !data) return { status: 'unauthenticated' }

  const membership = data.workspace_members[0]
  if (!membership) return { status: 'no-active-membership' }

  return {
    status: 'ok',
    user: {
      id: data.id,
      authUserId: data.auth_user_id,
      displayName: data.display_name,
      email: data.email,
      avatarUrl: data.avatar_url,
      workspace: membership.workspace,
      role: membership.role,
    },
  }
}
