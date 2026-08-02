import path from 'node:path'
import { test, expect } from '@playwright/test'
import { createAdminClient } from '../../lib/supabase/admin'

// See tests/e2e/login.spec.ts for why this is needed: Playwright's
// test-runner process doesn't inherit Next.js's own .env.local loading.
process.loadEnvFile(path.resolve(import.meta.dirname, '../../.env.local'))

const TEST_PASSWORD = 'e2e-test-password-123!'

test.describe('invite flow (fragment-based session establishment)', () => {
  test('accepting a real invite link establishes a session and reaches the dashboard', async ({
    page,
  }) => {
    const admin = createAdminClient()
    const email = `e2e-invite-${Date.now()}@mailinator.com`

    // inviteUserByEmail cannot use PKCE (see scripts/bootstrap-owner.ts's
    // comment), so its emailed link -- like generateLink's here -- resolves
    // to a redirect carrying `#access_token=...&refresh_token=...
    // &type=invite` in the URL fragment. generateLink lets this test trigger
    // the exact same GoTrue code path without needing a real inbox.
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: { redirectTo: 'http://localhost:3000/reset-password' },
    })
    expect(error).toBeNull()
    const userId = data.user!.id

    try {
      // Follow the real invite link, exactly as a real invitee's browser
      // would: GoTrue's /verify endpoint 303s to
      // /reset-password#access_token=...&refresh_token=...&type=invite.
      await page.goto(data.properties!.action_link)

      // SessionGate must land on the real form, not stay stuck on its
      // loading state and not fall into its error state.
      await expect(page).toHaveURL(/\/reset-password/)
      await expect(page.getByRole('heading', { name: /set a new password/i })).toBeVisible()
      await expect(page.getByLabel(/new password/i)).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText(/invalid or has expired/i)).not.toBeVisible()

      // The tokens must be stripped from the URL/history, not left sitting
      // in the address bar.
      expect(new URL(page.url()).hash).toBe('')

      // A real Supabase session cookie must have been set client-side.
      const cookies = await page.context().cookies()
      expect(cookies.some((c) => c.name.includes('auth-token'))).toBe(true)

      // The session must be real enough to authenticate a protected route,
      // not just cosmetically present.
      await page.goto('/dashboard/overview')
      await expect(page).toHaveURL(/\/dashboard\/overview/)
    } finally {
      await admin.auth.admin.deleteUser(userId)
    }
  })

  test('a tampered fragment shows an error state, not the form', async ({ page }) => {
    await page.goto('/reset-password#access_token=bogus&refresh_token=bogus&type=invite')
    await expect(page.getByText(/invalid or has expired/i)).toBeVisible()
    await expect(page.getByLabel(/new password/i)).not.toBeVisible()
  })

  test('an existing session with no fragment renders the form directly (password-reset arrival)', async ({
    page,
  }) => {
    // /auth/confirm's PKCE exchange (unchanged by this fix, verified
    // separately) lands here with a session cookie already set and no URL
    // fragment. A normal password sign-in reproduces that exact situation
    // for SessionGate -- it doesn't know or care how the cookie got there,
    // only whether one exists -- without re-deriving a PKCE code exchange.
    const admin = createAdminClient()
    const email = `e2e-reset-arrival-${Date.now()}@example.com`
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
    })
    expect(error).toBeNull()
    const userId = data!.user!.id

    try {
      await page.goto('/login')
      await page.getByLabel(/email/i).fill(email)
      await page.getByLabel(/password/i).fill(TEST_PASSWORD)
      await page.getByRole('button', { name: /sign in/i }).click()
      await expect(page).toHaveURL(/\/dashboard\/overview/)

      // Now, with a valid session cookie already present and no fragment,
      // navigate straight to /reset-password.
      await page.goto('/reset-password')
      await expect(page.getByLabel(/new password/i)).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText(/invalid or has expired/i)).not.toBeVisible()
    } finally {
      await admin.auth.admin.deleteUser(userId)
    }
  })
})
