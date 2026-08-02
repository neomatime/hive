import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

const password = 'file-storage-test-123!'
describe('RLS: project files', () => {
  const admin = createAdminClient()
  const authIds: string[] = [],
    userIds: string[] = [],
    emails: string[] = []
  let workspaceId: string, projectId: string, storageKey: string, fileId: string
  const client = () =>
    createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

  beforeAll(async () => {
    const suffix = Date.now()
    const workspace = await admin.from('workspaces').select('id').limit(1).single()
    workspaceId = workspace.data!.id
    for (const role of ['editor', 'viewer']) {
      const email = `file-rls-${role}-${suffix}@example.com`
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
        name: `File RLS ${suffix}`,
        owner_id: userIds[0]!,
        created_by: userIds[0]!,
      })
      .select('id')
      .single()
    projectId = project.data!.id
    await admin.from('project_members').insert([
      { project_id: projectId, user_id: userIds[0]!, role: 'project_owner', added_by: userIds[0]! },
      { project_id: projectId, user_id: userIds[1]!, role: 'viewer', added_by: userIds[0]! },
    ])
    storageKey = `${workspaceId}/${projectId}/${crypto.randomUUID()}-test.pdf`
  })

  afterAll(async () => {
    if (storageKey) await admin.storage.from('project-files').remove([storageKey])
    if (projectId) await admin.from('projects').delete().eq('id', projectId)
    for (const id of authIds) await admin.auth.admin.deleteUser(id)
  })

  it('allows an editor to upload and register a file', async () => {
    const session = client()
    await session.auth.signInWithPassword({ email: emails[0]!, password })
    const upload = await session.storage
      .from('project-files')
      .upload(storageKey, Buffer.from('%PDF test'), { contentType: 'application/pdf' })
    expect(upload.error).toBeNull()
    const metadata = await session
      .from('files')
      .insert({
        workspace_id: workspaceId,
        project_id: projectId,
        uploaded_by: userIds[0]!,
        name: 'test.pdf',
        storage_key: storageKey,
        mime_type: 'application/pdf',
        file_type: 'pdf',
        size_bytes: 9,
      })
      .select('id')
      .single()
    expect(metadata.error).toBeNull()
    fileId = metadata.data!.id
  })

  it('allows a viewer to read and download but not delete', async () => {
    const session = client()
    await session.auth.signInWithPassword({ email: emails[1]!, password })
    const metadata = await session.from('files').select('id').eq('id', fileId)
    expect(metadata.data).toHaveLength(1)
    const download = await session.storage.from('project-files').download(storageKey)
    expect(download.error).toBeNull()
    const remove = await session.storage.from('project-files').remove([storageKey])
    expect(remove.error).toBeNull()
    const stillAvailable = await session.storage.from('project-files').download(storageKey)
    expect(stillAvailable.error).toBeNull()
    const deleted = await session
      .from('files')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', fileId)
      .select()
    expect(deleted.data).toEqual([])
  })
})
