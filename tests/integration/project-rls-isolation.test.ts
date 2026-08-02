import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

const password = 'project-rls-test-123!'
describe('RLS: project isolation', () => {
  const admin = createAdminClient()
  const authIds: string[] = [],
    userIds: string[] = [],
    emails: string[] = [],
    projectIds: string[] = []
  let workspaceId: string
  beforeAll(async () => {
    const suffix = Date.now()
    const workspace = await admin.from('workspaces').select('id').limit(1).single()
    workspaceId = workspace.data!.id
    for (const label of ['a', 'b', 'viewer']) {
      const email = `project-rls-${label}-${suffix}@example.com`
      emails.push(email)
      const created = await admin.auth.admin.createUser({ email, password, email_confirm: true })
      authIds.push(created.data.user!.id)
      const profile = await admin
        .from('users')
        .select('id')
        .eq('auth_user_id', created.data.user!.id)
        .single()
      userIds.push(profile.data!.id)
    }
    await admin.from('workspace_members').insert([
      { workspace_id: workspaceId, user_id: userIds[0]!, role: 'member' },
      { workspace_id: workspaceId, user_id: userIds[1]!, role: 'member' },
      { workspace_id: workspaceId, user_id: userIds[2]!, role: 'viewer' },
    ])
    for (const index of [0, 1]) {
      const project = await admin
        .from('projects')
        .insert({
          workspace_id: workspaceId,
          name: `RLS project ${index}-${suffix}`,
          owner_id: userIds[index]!,
          created_by: userIds[index]!,
        })
        .select('id')
        .single()
      projectIds.push(project.data!.id)
      await admin
        .from('project_members')
        .insert({
          project_id: project.data!.id,
          user_id: userIds[index]!,
          role: 'project_owner',
          added_by: userIds[index]!,
        })
    }
  })
  afterAll(async () => {
    if (projectIds.length) await admin.from('projects').delete().in('id', projectIds)
    if (userIds.length) await admin.from('workspace_members').delete().in('user_id', userIds)
    for (const id of authIds) await admin.auth.admin.deleteUser(id)
  })
  function client() {
    return createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  it('hides another project from a project member', async () => {
    const session = client()
    await session.auth.signInWithPassword({ email: emails[0]!, password })
    const result = await session.from('projects').select('id').eq('id', projectIds[1]!)
    expect(result.error).toBeNull()
    expect(result.data).toEqual([])
  })
  it('rejects project creation by a workspace viewer', async () => {
    const session = client()
    await session.auth.signInWithPassword({ email: emails[2]!, password })
    const result = await session.rpc('create_project_with_owner', {
      p_workspace_id: workspaceId,
      p_name: 'Forbidden project',
      p_description: null as never,
      p_status: 'not_started',
      p_priority: 'medium',
      p_owner_id: userIds[2]!,
      p_start_date: null as never,
      p_due_date: null as never,
      p_member_ids: [],
    })
    expect(result.error).not.toBeNull()
  })
  it('prevents a contributor from archiving a project', async () => {
    await admin
      .from('project_members')
      .insert({
        project_id: projectIds[0]!,
        user_id: userIds[1]!,
        role: 'contributor',
        added_by: userIds[0]!,
      })
    const session = client()
    await session.auth.signInWithPassword({ email: emails[1]!, password })
    const result = await session
      .from('projects')
      .update({ status: 'archived' })
      .eq('id', projectIds[0]!)
      .select()
    expect(result.data).toEqual([])
  })
})
