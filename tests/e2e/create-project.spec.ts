import path from 'node:path'
import { expect, test } from '@playwright/test'
import { createAdminClient } from '../../lib/supabase/admin'

process.loadEnvFile(path.resolve(import.meta.dirname, '../../.env.local'))
const password = 'e2e-project-test-123!'
let email: string, authId: string, publicUserId: string, workspaceId: string

test.beforeAll(async () => {
  const admin = createAdminClient()
  email = `e2e-project-${Date.now()}@example.com`
  const auth = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  authId = auth.data.user!.id
  const profile = await admin.from('users').select('id').eq('auth_user_id', authId).single()
  publicUserId = profile.data!.id
  const workspace = await admin.from('workspaces').select('id').limit(1).single()
  workspaceId = workspace.data!.id
  await admin
    .from('workspace_members')
    .insert({ workspace_id: workspaceId, user_id: publicUserId, role: 'member' })
})

test.afterAll(async () => {
  const admin = createAdminClient()
  const projects = await admin.from('projects').select('id').eq('created_by', publicUserId)
  if (projects.data?.length)
    await admin
      .from('projects')
      .delete()
      .in(
        'id',
        projects.data.map((project) => project.id)
      )
  await admin.auth.admin.deleteUser(authId)
})

test('creates a project and opens its overview', async ({ page }) => {
  const name = `E2E Project ${Date.now()}`
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard\/overview/)
  await page.goto('/dashboard/projects')
  await page.getByRole('button', { name: 'New project' }).click()
  await page.getByLabel('Project name').fill(name)
  await page.getByRole('button', { name: 'Create project' }).click()
  await expect(page.getByText(name)).toBeVisible()
  await page.getByText(name).click()
  await expect(page).toHaveURL(/\/overview$/)
  await expect(page.getByRole('heading', { name })).toBeVisible()
})
