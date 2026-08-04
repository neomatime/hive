import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

const password = 'sec-remediation-test-123!'

describe('Security remediation: RLS regression coverage', () => {
  const admin = createAdminClient()
  const authIds: string[] = []
  let workspaceAId: string
  let workspaceBId: string
  let memberUserId: string
  let memberEmail: string
  let memberMembershipId: string
  let projectId: string
  let boardId: string
  let columnId: string
  let taskId: string

  function client() {
    return createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  beforeAll(async () => {
    const suffix = Date.now()
    memberEmail = `sec-remediation-member-${suffix}@example.com`

    const wsA = await admin
      .from('workspaces')
      .insert({
        name: `Sec Remediation WS A ${suffix}`,
        slug: `sec-remediation-ws-a-${suffix}`,
        timezone: 'UTC',
        date_format: 'DD/MM/YYYY',
        time_format: '24h',
      })
      .select('id')
      .single()
    workspaceAId = wsA.data!.id

    const wsB = await admin
      .from('workspaces')
      .insert({
        name: `Sec Remediation WS B ${suffix}`,
        slug: `sec-remediation-ws-b-${suffix}`,
        timezone: 'UTC',
        date_format: 'DD/MM/YYYY',
        time_format: '24h',
      })
      .select('id')
      .single()
    workspaceBId = wsB.data!.id

    const authMember = await admin.auth.admin.createUser({
      email: memberEmail,
      password,
      email_confirm: true,
    })
    authIds.push(authMember.data.user!.id)
    const memberProfile = await admin
      .from('users')
      .select('id')
      .eq('auth_user_id', authMember.data.user!.id)
      .single()
    memberUserId = memberProfile.data!.id

    const membership = await admin
      .from('workspace_members')
      .insert({ workspace_id: workspaceAId, user_id: memberUserId, role: 'admin', is_active: true })
      .select('id')
      .single()
    memberMembershipId = membership.data!.id

    const project = await admin
      .from('projects')
      .insert({
        workspace_id: workspaceAId,
        name: `Sec Remediation Project ${suffix}`,
        owner_id: memberUserId,
        created_by: memberUserId,
      })
      .select('id')
      .single()
    projectId = project.data!.id

    await admin.from('project_members').insert({
      project_id: projectId,
      user_id: memberUserId,
      role: 'project_owner',
      added_by: memberUserId,
    })

    const board = await admin
      .from('boards')
      .select('id')
      .eq('project_id', projectId)
      .limit(1)
      .single()
    boardId = board.data!.id
    const column = await admin
      .from('board_columns')
      .select('id')
      .eq('board_id', boardId)
      .limit(1)
      .single()
    columnId = column.data!.id

    const task = await admin
      .from('tasks')
      .insert({
        project_id: projectId,
        board_id: boardId,
        column_id: columnId,
        title: 'Sec remediation test task',
        position: 0,
        created_by: memberUserId,
      })
      .select('id')
      .single()
    taskId = task.data!.id
  })

  afterAll(async () => {
    if (projectId) await admin.from('projects').delete().eq('id', projectId)
    for (const id of authIds) await admin.auth.admin.deleteUser(id)
    if (workspaceAId) await admin.from('workspaces').delete().eq('id', workspaceAId)
    if (workspaceBId) await admin.from('workspaces').delete().eq('id', workspaceBId)
  })

  it('C-1: deactivating workspace membership revokes project access, not just workspace access', async () => {
    const session = client()
    await session.auth.signInWithPassword({ email: memberEmail, password })

    const before = await session.from('projects').select('id').eq('id', projectId)
    expect(before.data).toHaveLength(1)

    await admin.from('workspace_members').update({ is_active: false }).eq('id', memberMembershipId)

    const after = await session.from('projects').select('id').eq('id', projectId)
    expect(after.data).toEqual([])

    await admin.from('workspace_members').update({ is_active: true }).eq('id', memberMembershipId)
  })

  it('C-2: a project admin cannot move a project into a different workspace, but can still rename it', async () => {
    const session = client()
    await session.auth.signInWithPassword({ email: memberEmail, password })

    const moveAttempt = await session
      .from('projects')
      .update({ workspace_id: workspaceBId })
      .eq('id', projectId)
    expect(moveAttempt.error).not.toBeNull()

    const renameAttempt = await session
      .from('projects')
      .update({ name: 'Renamed by regression test' })
      .eq('id', projectId)
      .select()
    expect(renameAttempt.error).toBeNull()
    expect(renameAttempt.data).toHaveLength(1)

    const unchanged = await admin
      .from('projects')
      .select('workspace_id')
      .eq('id', projectId)
      .single()
    expect(unchanged.data!.workspace_id).toBe(workspaceAId)
  })

  it('I-6: a direct insert into projects is rejected regardless of caller role', async () => {
    const session = client()
    await session.auth.signInWithPassword({ email: memberEmail, password })

    const result = await session.from('projects').insert({
      workspace_id: workspaceAId,
      name: 'Should never exist',
      owner_id: memberUserId,
      created_by: memberUserId,
    })
    expect(result.error).not.toBeNull()
  })

  it('I-7: a task cannot be assigned to someone outside the project', async () => {
    const outsider = await admin.auth.admin.createUser({
      email: `sec-remediation-outsider-${Date.now()}@example.com`,
      password,
      email_confirm: true,
    })
    authIds.push(outsider.data.user!.id)
    const outsiderProfile = await admin
      .from('users')
      .select('id')
      .eq('auth_user_id', outsider.data.user!.id)
      .single()

    const session = client()
    await session.auth.signInWithPassword({ email: memberEmail, password })

    const result = await session
      .from('tasks')
      .update({ assignee_id: outsiderProfile.data!.id })
      .eq('id', taskId)
    expect(result.error).not.toBeNull()
  })
})
