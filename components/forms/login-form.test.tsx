import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './login-form'

vi.mock('@/app/(auth)/login/actions', () => ({
  loginAction: vi.fn(),
}))

const signInWithOAuth = vi.fn().mockResolvedValue({ data: {}, error: null })
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signInWithOAuth } }),
}))

import { loginAction } from '@/app/(auth)/login/actions'

describe('LoginForm', () => {
  it('shows validation errors when submitted empty', async () => {
    render(<LoginForm />)
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument()
  })

  it('calls loginAction with the entered credentials on valid submit', async () => {
    vi.mocked(loginAction).mockResolvedValue({ error: null })
    render(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/email/i), 'jane@himark.com')
    await userEvent.type(screen.getByLabelText('Password'), 'correct-password')
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    expect(loginAction).toHaveBeenCalledWith({
      email: 'jane@himark.com',
      password: 'correct-password',
    })
  })

  it('shows the server error message when loginAction returns one', async () => {
    vi.mocked(loginAction).mockResolvedValue({ error: 'Invalid email or password.' })
    render(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/email/i), 'jane@himark.com')
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password')
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument()
  })

  it('shows a spinner and disables the button while submitting', async () => {
    let resolveLogin!: (value: { error: string | null }) => void
    vi.mocked(loginAction).mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve
      })
    )
    render(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/email/i), 'jane@himark.com')
    await userEvent.type(screen.getByLabelText('Password'), 'correct-password')
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    expect(screen.getByRole('button', { name: 'Signing in…' })).toBeDisabled()
    resolveLogin({ error: null })
  })

  it('toggles password visibility', async () => {
    render(<LoginForm />)
    const password = screen.getByLabelText('Password')
    expect(password).toHaveAttribute('type', 'password')
    await userEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveAttribute('type', 'text')
    await userEvent.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(password).toHaveAttribute('type', 'password')
  })

  it('starts Microsoft sign-in via Supabase OAuth', async () => {
    render(<LoginForm />)
    await userEvent.click(screen.getByRole('button', { name: 'Sign in with Microsoft' }))
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'azure',
      options: { redirectTo: expect.stringContaining('/auth/callback') },
    })
  })
})
