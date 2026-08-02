import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { LoginForm } from '@/components/forms/login-form'
import { ForgotPasswordForm } from '@/components/forms/forgot-password-form'
import { ResetPasswordForm } from '@/components/forms/reset-password-form'

// ResetPasswordForm calls useRouter() from next/navigation unconditionally
// during render (see components/forms/reset-password-form.tsx), not just on
// submit. Outside of a real Next.js App Router tree (as under plain RTL
// render), useRouter() throws "invariant expected app router to be mounted"
// -- so the hook must be mocked here too, the same way
// reset-password-form.test.tsx already does for its own tests of this form.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('Auth forms accessibility', () => {
  it('LoginForm has no axe violations', async () => {
    const { container } = render(<LoginForm />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('ForgotPasswordForm has no axe violations', async () => {
    const { container } = render(<ForgotPasswordForm />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('ResetPasswordForm has no axe violations', async () => {
    const { container } = render(<ResetPasswordForm />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
