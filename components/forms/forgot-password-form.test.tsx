import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ForgotPasswordForm } from './forgot-password-form'

vi.mock('@/app/(auth)/forgot-password/actions', () => ({
  requestPasswordResetAction: vi.fn(),
}))

import { requestPasswordResetAction } from '@/app/(auth)/forgot-password/actions'

describe('ForgotPasswordForm', () => {
  it('shows a validation error for an invalid email', async () => {
    render(<ForgotPasswordForm />)
    await userEvent.type(screen.getByLabelText(/email/i), 'not-an-email')
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument()
  })

  it('shows the same confirmation message regardless of whether the email exists', async () => {
    vi.mocked(requestPasswordResetAction).mockResolvedValue({ submitted: true })
    render(<ForgotPasswordForm />)
    await userEvent.type(screen.getByLabelText(/email/i), 'anyone@himark.com')
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    expect(await screen.findByText(/if that email exists, we've sent a link/i)).toBeInTheDocument()
  })
})
