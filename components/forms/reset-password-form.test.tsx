import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResetPasswordForm } from './reset-password-form'

// ResetPasswordForm calls useRouter() from next/navigation to redirect to
// /login after a successful update. Outside of a real Next.js App Router
// tree (as under plain RTL render), useRouter() throws "invariant expected
// app router to be mounted" -- so the hook must be mocked for these
// component tests, the same way the Server Action module below is mocked.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/app/(auth)/reset-password/actions', () => ({
  updatePasswordAction: vi.fn(),
}))

import { updatePasswordAction } from '@/app/(auth)/reset-password/actions'

describe('ResetPasswordForm', () => {
  it('requires a minimum password length', async () => {
    render(<ResetPasswordForm />)
    await userEvent.type(screen.getByLabelText(/new password/i), 'short')
    await userEvent.click(screen.getByRole('button', { name: /update password/i }))
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument()
  })

  it('shows the server error when updatePasswordAction fails', async () => {
    vi.mocked(updatePasswordAction).mockResolvedValue({
      error: 'Could not update password. Please try requesting a new reset link.',
    })
    render(<ResetPasswordForm />)
    await userEvent.type(screen.getByLabelText(/new password/i), 'longenoughpassword')
    await userEvent.click(screen.getByRole('button', { name: /update password/i }))
    expect(
      await screen.findByText('Could not update password. Please try requesting a new reset link.')
    ).toBeInTheDocument()
  })
})
