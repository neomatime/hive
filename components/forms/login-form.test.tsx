import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './login-form'

vi.mock('@/app/(auth)/login/actions', () => ({
  loginAction: vi.fn(),
}))

import { loginAction } from '@/app/(auth)/login/actions'

describe('LoginForm', () => {
  it('shows validation errors when submitted empty', async () => {
    render(<LoginForm />)
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument()
  })

  it('calls loginAction with the entered credentials on valid submit', async () => {
    vi.mocked(loginAction).mockResolvedValue({ error: null })
    render(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/email/i), 'jane@himark.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'correct-password')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(loginAction).toHaveBeenCalledWith({ email: 'jane@himark.com', password: 'correct-password' })
  })

  it('shows the server error message when loginAction returns one', async () => {
    vi.mocked(loginAction).mockResolvedValue({ error: 'Invalid email or password.' })
    render(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/email/i), 'jane@himark.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong-password')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument()
  })
})
