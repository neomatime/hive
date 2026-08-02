import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { DashboardShell } from '@/components/layout/dashboard-shell'

// DashboardShell reads the active route via usePathname() (see
// components/layout/dashboard-shell.tsx) to highlight the active sidebar
// item and derive the top bar title -- it no longer takes `activePath` /
// `pageTitle` props (removed in Task 13). Outside of a real Next.js App
// Router tree, usePathname() throws the same "invariant expected app router
// to be mounted" error that useRouter() does elsewhere in this codebase
// (see components/forms/reset-password-form.test.tsx), so it must be
// mocked here.
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/overview',
}))

describe('DashboardShell accessibility', () => {
  it('has no axe violations', async () => {
    const { container } = render(
      <DashboardShell
        user={{
          id: '1',
          authUserId: 'a1',
          displayName: 'Jane Doe',
          email: 'jane@himark.com',
          avatarUrl: null,
          workspace: { id: 'w1', name: 'HIMARK' },
          role: 'admin',
        }}
      >
        <p>Page content</p>
      </DashboardShell>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
