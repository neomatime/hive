import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'
const password = 'task-rls-test-123!'
describe('RLS: task roles', () => {
  const admin = createAdminClient(),
    authIds: string[] = [],
    userIds: string[] = [],
    emails: string[] = []
  let workspaceId: string,
    projectId: string,
    boardId: string,
    columnId: string,
    taskId: string,
    labelId: string
  beforeAll(async () => {
    const suffix = Date.now(),
      workspace = await admin.from('workspaces').select('id').limit(1).single()
    workspaceId = workspace.data!.id
    for (const role of ['editor', 'viewer']) {
      const email = `task-rls-${role}-${suffix}@example.com`
      emails.push(email)
      const auth = await admin.auth.admin.createUser({ email, password, email_confirm: true })
      authIds.push(auth.data.user!.id)
      const user = await admin
        .from('users')
        .select('id')
        .eq('auth_user_id', auth.data.user!.id)
        .single()
      userIds.push(user.data!.id)
    }
    await admin.from('workspace_members').insert([
      { workspace_id: workspaceId, user_id: userIds[0]!, role: 'member' },
      { workspace_id: workspaceId, user_id: userIds[1]!, role: 'viewer' },
    ])
    const project = await admin
      .from('projects')
      .insert({
        workspace_id: workspaceId,
        name: `Task RLS ${suffix}`,
        owner_id: userIds[0]!,
        created_by: userIds[0]!,
      })
      .select('id')
      .single()
    projectId = project.data!.id
    const label = await admin
      .from('labels')
      .insert({
        workspace_id: workspaceId,
        name: `Task label ${suffix}`,
        color_token: '#2563eb',
        created_by: userIds[0]!,
      })
      .select('id')
      .single()
    labelId = label.data!.id
    await admin.from('project_members').insert([
      { project_id: projectId, user_id: userIds[0]!, role: 'project_owner', added_by: userIds[0]! },
      { project_id: projectId, user_id: userIds[1]!, role: 'viewer', added_by: userIds[0]! },
    ])
    const board = await admin.from('boards').select('id').eq('project_id', projectId).single()
    boardId = board.data!.id
    const column = await admin
      .from('board_columns')
      .select('id')
      .eq('board_id', boardId)
      .eq('status_type', 'backlog')
      .single()
    columnId = column.data!.id
  })
  afterAll(async () => {
    if (projectId) await admin.from('projects').delete().eq('id', projectId)
    if (userIds.length) await admin.from('workspace_members').delete().in('user_id', userIds)
    for (const id of authIds) await admin.auth.admin.deleteUser(id)
  })
  const client = () =>
    createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  it('lets a project owner create a task', async () => {
    const session = client()
    await session.auth.signInWithPassword({ email: emails[0]!, password })
    const result = await session
      .from('tasks')
      .insert({
        project_id: projectId,
        board_id: boardId,
        column_id: columnId,
        title: 'Allowed task',
        created_by: userIds[0]!,
        position: 1024,
      })
      .select('id')
      .single()
    expect(result.error).toBeNull()
    taskId = result.data!.id
  })
  it('lets a task editor assign a workspace label', async () => {
    const session = client()
    await session.auth.signInWithPassword({ email: emails[0]!, password })
    const result = await session.from('task_labels').insert({ task_id: taskId, label_id: labelId })
    expect(result.error).toBeNull()
  })
  it('lets a viewer read but not update, comment, or change labels', async () => {
    const session = client()
    await session.auth.signInWithPassword({ email: emails[1]!, password })
    const read = await session.from('tasks').select('id').eq('id', taskId)
    expect(read.data).toHaveLength(1)
    const update = await session
      .from('tasks')
      .update({ title: 'Forbidden' })
      .eq('id', taskId)
      .select()
    expect(update.data).toEqual([])
    const comment = await session
      .from('task_comments')
      .insert({ task_id: taskId, author_id: userIds[1]!, content: 'Forbidden' })
    expect(comment.error).not.toBeNull()
    const removeLabel = await session
      .from('task_labels')
      .delete()
      .eq('task_id', taskId)
      .eq('label_id', labelId)
      .select()
    expect(removeLabel.data).toEqual([])
  })
})
