import path from 'node:path'
import { expect, test } from '@playwright/test'
import { createAdminClient } from '../../lib/supabase/admin'

process.loadEnvFile(path.resolve(import.meta.dirname, '../../.env.local'))

const password = 'e2e-board-test-123!'
let email: string
let authId: string
let publicUserId: string
let projectId: string
let labelId: string

test.beforeAll(async () => {
  const admin = createAdminClient()
  const suffix = Date.now()
  email = `e2e-board-${suffix}@example.com`
  const auth = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  authId = auth.data.user!.id
  const user = await admin.from('users').select('id').eq('auth_user_id', authId).single()
  publicUserId = user.data!.id
  const workspace = await admin.from('workspaces').select('id').limit(1).single()
  await admin
    .from('workspace_members')
    .insert({ workspace_id: workspace.data!.id, user_id: publicUserId, role: 'member' })
  const project = await admin
    .from('projects')
    .insert({
      workspace_id: workspace.data!.id,
      name: `E2E Board ${suffix}`,
      owner_id: publicUserId,
      created_by: publicUserId,
    })
    .select('id')
    .single()
  projectId = project.data!.id
  await admin.from('project_members').insert({
    project_id: projectId,
    user_id: publicUserId,
    role: 'project_owner',
    added_by: publicUserId,
  })
  const label = await admin
    .from('labels')
    .insert({
      workspace_id: workspace.data!.id,
      name: `Client review ${suffix}`,
      color_token: '#2563eb',
      created_by: publicUserId,
    })
    .select('id')
    .single()
  labelId = label.data!.id
})

test.afterAll(async () => {
  const admin = createAdminClient()
  if (projectId) await admin.from('projects').delete().eq('id', projectId)
  if (labelId) await admin.from('labels').delete().eq('id', labelId)
  if (authId) await admin.auth.admin.deleteUser(authId)
})

test('creates, labels, comments on, and moves a task', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard\/overview/)
  await page.goto(`/dashboard/projects/${projectId}/board`)

  const backlog = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Backlog' }) })
  await backlog.getByRole('button', { name: '+ Add task' }).click()
  await backlog.getByLabel('Task title').fill('Prepare client pack')
  await backlog.getByRole('button', { name: 'Add task' }).click()
  const task = page.getByText('Prepare client pack')
  await expect(task).toBeVisible()

  await task.click()
  const dialog = page.getByRole('dialog', { name: 'Task details' })
  await dialog.getByLabel(/Client review/).check()
  await dialog.getByLabel('Add comment').fill('Ready for the first review.')
  await dialog.getByRole('button', { name: 'Comment' }).click()
  await expect(dialog.getByText('Ready for the first review.')).toBeVisible()
  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(page.getByText(/Client review/)).toBeVisible()

  const todo = page.locator('section').filter({ has: page.getByRole('heading', { name: 'To do' }) })
  await task.dragTo(todo)
  await expect(todo.getByText('Prepare client pack')).toBeVisible()
})
