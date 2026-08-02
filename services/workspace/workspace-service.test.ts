import { describe, it, expect, vi } from 'vitest'
import { getCurrentUserWithMembership } from './workspace-service'

describe('getCurrentUserWithMembership', () => {
  it('returns unauthenticated when there is no auth session', async () => {
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as never

    const result = await getCurrentUserWithMembership(supabase)
    expect(result).toEqual({ status: 'unauthenticated' })
  })

  it('returns no-active-membership when the user has no workspace_members row', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'user-1',
        auth_user_id: 'auth-1',
        display_name: 'Jane Doe',
        email: 'jane@himark.com',
        avatar_url: null,
        workspace_members: [],
      },
      error: null,
    })

    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'auth-1' } } }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ single }),
        }),
      }),
    } as never

    const result = await getCurrentUserWithMembership(supabase)
    expect(result).toEqual({ status: 'no-active-membership' })
  })

  it('returns ok with the user, workspace, and role when authenticated with active membership', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'user-1',
        auth_user_id: 'auth-1',
        display_name: 'Jane Doe',
        email: 'jane@himark.com',
        avatar_url: null,
        workspace_members: [{ role: 'admin', workspace: { id: 'ws-1', name: 'HIMARK' } }],
      },
      error: null,
    })

    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'auth-1' } } }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ single }),
        }),
      }),
    } as never

    const result = await getCurrentUserWithMembership(supabase)
    expect(result).toEqual({
      status: 'ok',
      user: {
        id: 'user-1',
        authUserId: 'auth-1',
        displayName: 'Jane Doe',
        email: 'jane@himark.com',
        avatarUrl: null,
        workspace: { id: 'ws-1', name: 'HIMARK' },
        role: 'admin',
      },
    })
  })
})
