import path from 'node:path'
import { test, expect } from '@playwright/test'
import { createAdminClient } from '../../lib/supabase/admin'

// Playwright's test-runner process does not inherit Next.js's own `.env.local`
// loading (that only happens inside the `next build`/`next start` child process
// spawned by `webServer`, per playwright.config.ts) -- confirmed empirically the
// same way vitest.integration.setup.ts documents for Vitest: without this,
// `createAdminClient()` throws "supabaseUrl is required." because
// `process.env.NEXT_PUBLIC_SUPABASE_URL` is undefined in this process. Node's
// built-in loader (stable since Node 21.7) does not overwrite already-set vars,
// so this is a no-op if the shell already exports them.
process.loadEnvFile(path.resolve(import.meta.dirname, '../../.env.local'))

const TEST_PASSWORD = 'e2e-test-password-123!'
let testEmail: string
let testUserId: string
// Tracks whether this run created a brand-new workspace (only happens if the
// live project has none yet) so afterAll can remove it -- deleting the auth
// user cascades to `public.users` and `workspace_members` (both declared
// `on delete cascade` in the schema) but NOT to `workspaces`, which has no
// ownership cascade, so a workspace created here would otherwise be
// orphaned permanently in the live project.
let createdWorkspaceId: string | null = null

test.beforeAll(async () => {
  const admin = createAdminClient()
  testEmail = `e2e-login-${Date.now()}@example.com`

  const { data: created } = await admin.auth.admin.createUser({
    email: testEmail,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  testUserId = created!.user!.id

  const { data: userRow } = await admin
    .from('users')
    .select('id')
    .eq('auth_user_id', testUserId)
    .single()
  const { data: workspace } = await admin.from('workspaces').select('id').limit(1).maybeSingle()
  let workspaceId: string
  if (workspace) {
    workspaceId = workspace.id
  } else {
    const { data: newWorkspace } = await admin
      .from('workspaces')
      .insert({
        name: 'E2E Test WS',
        slug: `e2e-test-ws-${Date.now()}`,
        timezone: 'UTC',
        date_format: 'DD/MM/YYYY',
        time_format: '24h',
      })
      .select('id')
      .single()
    workspaceId = newWorkspace!.id
    createdWorkspaceId = workspaceId
  }

  await admin
    .from('workspace_members')
    .insert({ workspace_id: workspaceId, user_id: userRow!.id, role: 'member' })
})

test.afterAll(async () => {
  const admin = createAdminClient()
  await admin.auth.admin.deleteUser(testUserId)
  if (createdWorkspaceId) {
    await admin.from('workspaces').delete().eq('id', createdWorkspaceId)
  }
})

test('login, protected-route redirect, and logout', async ({ page }) => {
  // Protected route redirect: visiting /dashboard/overview while logged out sends to /login
  await page.goto('/dashboard/overview')
  await expect(page).toHaveURL(/\/login/)

  // Login
  await page.getByLabel(/email/i).fill(testEmail)
  await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard\/overview/)
  await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible()

  // Logout. UserMenu's DropdownMenuTrigger sets `aria-label={displayName}`
  // (components/layout/user-menu.tsx), and displayName comes straight from
  // users.display_name with no app-layer fallback (workspace-service.ts).
  // The DB trigger (supabase/migrations/0001_foundation_schema.sql) sets
  // display_name to `coalesce(raw_user_meta_data->>'display_name', new.email)`;
  // this test's createUser() call passes no metadata, so display_name -- and
  // therefore the button's accessible name -- is the full email address, not
  // the local part before '@'.
  await page.getByRole('button', { name: testEmail }).click()
  await page.getByRole('menuitem', { name: /sign out/i }).click()
  await expect(page).toHaveURL(/\/login/)
})

test('shows an error for wrong credentials', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(testEmail)
  await page.getByLabel('Password', { exact: true }).fill('wrong-password')
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await expect(page.getByText('Invalid email or password.')).toBeVisible()
})
