import { StrictMode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SessionGate } from './session-gate'

const setSession = vi.fn()
const getSession = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      setSession,
      getSession,
    },
  }),
}))

function goTo(path: string) {
  window.history.pushState(null, '', path)
}

describe('SessionGate', () => {
  beforeEach(() => {
    setSession.mockReset()
    getSession.mockReset()
    goTo('/reset-password')
  })

  it('shows a loading state before the session check resolves', () => {
    getSession.mockReturnValue(new Promise(() => {}))
    render(
      <SessionGate>
        <p>the form</p>
      </SessionGate>
    )
    expect(screen.getByText(/verifying your link/i)).toBeInTheDocument()
    expect(screen.queryByText('the form')).not.toBeInTheDocument()
  })

  it('establishes a session from an invite fragment and renders children', async () => {
    goTo('/reset-password#access_token=abc123&refresh_token=def456&expires_in=3600&type=invite')
    setSession.mockResolvedValue({ error: null })
    render(
      <SessionGate>
        <p>the form</p>
      </SessionGate>
    )
    expect(await screen.findByText('the form')).toBeInTheDocument()
    expect(setSession).toHaveBeenCalledWith({
      access_token: 'abc123',
      refresh_token: 'def456',
    })
  })

  it('strips the fragment from the URL after processing it', async () => {
    goTo('/reset-password#access_token=abc123&refresh_token=def456&type=invite')
    setSession.mockResolvedValue({ error: null })
    render(
      <SessionGate>
        <p>the form</p>
      </SessionGate>
    )
    await screen.findByText('the form')
    expect(window.location.hash).toBe('')
    expect(window.location.pathname).toBe('/reset-password')
  })

  it('shows an error state when setSession rejects the fragment tokens', async () => {
    goTo('/reset-password#access_token=abc123&refresh_token=def456&type=invite')
    setSession.mockResolvedValue({ error: { message: 'invalid token' } })
    render(
      <SessionGate>
        <p>the form</p>
      </SessionGate>
    )
    expect(await screen.findByText(/invalid or has expired/i)).toBeInTheDocument()
    expect(screen.queryByText('the form')).not.toBeInTheDocument()
  })

  it('shows an error state for a fragment carrying an error param, without calling setSession', async () => {
    goTo('/reset-password#error=access_denied&error_description=Link+expired')
    render(
      <SessionGate>
        <p>the form</p>
      </SessionGate>
    )
    expect(await screen.findByText(/invalid or has expired/i)).toBeInTheDocument()
    expect(setSession).not.toHaveBeenCalled()
  })

  it('renders children directly when a session cookie already exists and there is no fragment', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'existing' } } })
    render(
      <SessionGate>
        <p>the form</p>
      </SessionGate>
    )
    expect(await screen.findByText('the form')).toBeInTheDocument()
    expect(setSession).not.toHaveBeenCalled()
  })

  it('shows an error state when there is no fragment and no existing session', async () => {
    getSession.mockResolvedValue({ data: { session: null } })
    render(
      <SessionGate>
        <p>the form</p>
      </SessionGate>
    )
    expect(await screen.findByText(/invalid or has expired/i)).toBeInTheDocument()
  })

  it('shows an error state instead of hanging when setSession rejects unexpectedly', async () => {
    goTo('/reset-password#access_token=abc123&refresh_token=def456&type=invite')
    setSession.mockRejectedValue(new Error('unexpected network failure'))
    render(
      <SessionGate>
        <p>the form</p>
      </SessionGate>
    )
    expect(await screen.findByText(/invalid or has expired/i)).toBeInTheDocument()
  })

  it('shows an error state instead of hanging when getSession rejects unexpectedly', async () => {
    getSession.mockRejectedValue(new Error('unexpected network failure'))
    render(
      <SessionGate>
        <p>the form</p>
      </SessionGate>
    )
    expect(await screen.findByText(/invalid or has expired/i)).toBeInTheDocument()
  })

  it('does not race setSession when the effect body runs twice on one mount (StrictMode double-invoke safety)', async () => {
    goTo('/reset-password#access_token=abc123&refresh_token=def456&type=invite')
    let resolveSetSession: (value: { error: null }) => void = () => {}
    setSession.mockImplementation(
      () =>
        new Promise<{ error: null }>((resolve) => {
          resolveSetSession = resolve
        })
    )
    // If the effect's guard against double-invocation ever regressed, a
    // second run would see the (already-stripped) empty hash and fall
    // through to getSession() -- give it a fast, real answer so a
    // regression here is caught by "getSession was called at all" rather
    // than relying on which setState call happens to land last.
    getSession.mockResolvedValue({ data: { session: null } })

    render(
      <StrictMode>
        <SessionGate>
          <p>the form</p>
        </SessionGate>
      </StrictMode>
    )

    // Let any second (StrictMode) invocation of the effect run to
    // completion -- including a real getSession() round-trip, if the guard
    // failed to stop it -- before the first invocation's in-flight
    // setSession call resolves.
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()

    resolveSetSession({ error: null })

    expect(await screen.findByText('the form')).toBeInTheDocument()
    expect(setSession).toHaveBeenCalledTimes(1)
    expect(getSession).not.toHaveBeenCalled()
  })
})
