import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

const TEST_PASSWORD = 'test-password-123!'

describe('RLS: workspace isolation', () => {
  const admin = createAdminClient()
  let workspaceAId: string
  let workspaceBId: string
  let userAEmail: string
  let userBEmail: string

  beforeAll(async () => {
    const suffix = Date.now()
    userAEmail = `rls-test-a-${suffix}@example.com`
    userBEmail = `rls-test-b-${suffix}@example.com`

    const { data: wsA } = await admin
      .from('workspaces')
      .insert({
        name: `Test WS A ${suffix}`,
        slug: `test-ws-a-${suffix}`,
        timezone: 'UTC',
        date_format: 'DD/MM/YYYY',
        time_format: '24h',
      })
      .select('id')
      .single()
    const { data: wsB } = await admin
      .from('workspaces')
      .insert({
        name: `Test WS B ${suffix}`,
        slug: `test-ws-b-${suffix}`,
        timezone: 'UTC',
        date_format: 'DD/MM/YYYY',
        time_format: '24h',
      })
      .select('id')
      .single()
    workspaceAId = wsA!.id
    workspaceBId = wsB!.id

    const { data: authA } = await admin.auth.admin.createUser({
      email: userAEmail,
      password: TEST_PASSWORD,
      email_confirm: true,
    })
    const { data: authB } = await admin.auth.admin.createUser({
      email: userBEmail,
      password: TEST_PASSWORD,
      email_confirm: true,
    })

    const { data: userA } = await admin
      .from('users')
      .select('id')
      .eq('auth_user_id', authA!.user!.id)
      .single()
    const { data: userB } = await admin
      .from('users')
      .select('id')
      .eq('auth_user_id', authB!.user!.id)
      .single()

    await admin
      .from('workspace_members')
      .insert({ workspace_id: workspaceAId, user_id: userA!.id, role: 'member' })
    await admin
      .from('workspace_members')
      .insert({ workspace_id: workspaceBId, user_id: userB!.id, role: 'member' })
  })

  afterAll(async () => {
    await admin.from('workspaces').delete().in('id', [workspaceAId, workspaceBId])
    const { data } = await admin.auth.admin.listUsers()
    const testUsers = data.users.filter((u) => u.email === userAEmail || u.email === userBEmail)
    for (const u of testUsers) {
      await admin.auth.admin.deleteUser(u.id)
    }
  })

  it("user A cannot read user B's workspace", async () => {
    const clientA = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await clientA.auth.signInWithPassword({ email: userAEmail, password: TEST_PASSWORD })

    const { data, error } = await clientA.from('workspaces').select('id').eq('id', workspaceBId)

    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it("user A cannot read user B's workspace_members row", async () => {
    const clientA = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await clientA.auth.signInWithPassword({ email: userAEmail, password: TEST_PASSWORD })

    const { data } = await clientA
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceBId)

    expect(data).toEqual([])
  })
})
