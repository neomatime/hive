import { describe, it, expect, vi } from 'vitest'
import { signIn, signOut, requestPasswordReset, updatePassword } from './auth-service'

function mockSupabase(overrides: Record<string, unknown> = {}) {
  return {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
      ...overrides,
    },
  } as never
}

describe('signIn', () => {
  it('returns no error on success', async () => {
    const supabase = mockSupabase()
    const result = await signIn(supabase, 'a@himark.com', 'password123')
    expect(result.error).toBeNull()
  })

  it('returns a generic error message on failure, not the raw Supabase error', async () => {
    const supabase = mockSupabase({
      signInWithPassword: vi.fn().mockResolvedValue({ error: { message: 'Invalid login credentials' } }),
    })
    const result = await signIn(supabase, 'a@himark.com', 'wrong')
    expect(result.error).toBe('Invalid email or password.')
  })
})

describe('signOut', () => {
  it('calls supabase.auth.signOut', async () => {
    const supabase = mockSupabase()
    await signOut(supabase)
    expect(supabase.auth.signOut).toHaveBeenCalled()
  })
})

describe('requestPasswordReset', () => {
  it('resolves without throwing even if the underlying call errors (never reveal whether the email exists)', async () => {
    const supabase = mockSupabase({
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: { message: 'User not found' } }),
    })
    await expect(requestPasswordReset(supabase, 'nobody@himark.com', 'http://x/reset')).resolves.toBeUndefined()
  })
})

describe('updatePassword', () => {
  it('returns a generic error message on failure', async () => {
    const supabase = mockSupabase({
      updateUser: vi.fn().mockResolvedValue({ error: { message: 'Token expired' } }),
    })
    const result = await updatePassword(supabase, 'newpassword123')
    expect(result.error).toBe('Could not update password. Please try requesting a new reset link.')
  })
})
