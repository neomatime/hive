import { describe, expect, it, vi } from 'vitest'
import { inviteOrAddWorkspaceMember } from './settings-service'

function supabaseWith(existingUser: { id: string } | null, rpcError: { message: string } | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: existingUser })
  const ilike = vi.fn(() => ({ maybeSingle }))
  const select = vi.fn(() => ({ ilike }))
  const rpc = vi.fn().mockResolvedValue({ error: rpcError })
  return { from: vi.fn(() => ({ select })), rpc, ilike, maybeSingle, select }
}

const input = {
  workspaceId: 'workspace-1',
  email: ' thelma@himark.co.za ',
  role: 'member' as const,
  redirectTo: 'https://hive.example.com/reset-password',
}

describe('inviteOrAddWorkspaceMember', () => {
  it('rejects assigning ownership through an invite without calling anything', async () => {
    const supabase = supabaseWith(null, null)
    const inviteUserByEmail = vi.fn()
    const result = await inviteOrAddWorkspaceMember(
      supabase as never,
      { inviteUserByEmail },
      {
        ...input,
        role: 'owner',
      }
    )
    expect(result.error).toBe('Ownership cannot be assigned through an invite.')
    expect(inviteUserByEmail).not.toHaveBeenCalled()
  })

  it('sends a real invite for an email with no existing account, then adds them', async () => {
    const supabase = supabaseWith(null, null)
    const inviteUserByEmail = vi
      .fn()
      .mockResolvedValue({ data: { user: { id: 'auth-1' } }, error: null })
    const result = await inviteOrAddWorkspaceMember(supabase as never, { inviteUserByEmail }, input)
    expect(supabase.ilike).toHaveBeenCalledWith('email', 'thelma@himark.co.za')
    expect(inviteUserByEmail).toHaveBeenCalledWith('thelma@himark.co.za', {
      redirectTo: input.redirectTo,
    })
    expect(supabase.rpc).toHaveBeenCalledWith('add_workspace_member_by_email', {
      p_workspace_id: 'workspace-1',
      p_email: 'thelma@himark.co.za',
      p_role: 'member',
    })
    expect(result.error).toBeNull()
  })

  it('skips sending an invite when an account already exists', async () => {
    const supabase = supabaseWith({ id: 'user-1' }, null)
    const inviteUserByEmail = vi.fn()
    const result = await inviteOrAddWorkspaceMember(supabase as never, { inviteUserByEmail }, input)
    expect(inviteUserByEmail).not.toHaveBeenCalled()
    expect(supabase.rpc).toHaveBeenCalled()
    expect(result.error).toBeNull()
  })

  it('still adds the member when invite fails because the account already exists elsewhere', async () => {
    const supabase = supabaseWith(null, null)
    const inviteUserByEmail = vi
      .fn()
      .mockResolvedValue({ data: { user: null }, error: { message: 'Email already registered' } })
    const result = await inviteOrAddWorkspaceMember(supabase as never, { inviteUserByEmail }, input)
    expect(supabase.rpc).toHaveBeenCalled()
    expect(result.error).toBeNull()
  })

  it('reports an error when the invite genuinely fails', async () => {
    const supabase = supabaseWith(null, null)
    const inviteUserByEmail = vi
      .fn()
      .mockResolvedValue({ data: { user: null }, error: { message: 'SMTP is not configured' } })
    const result = await inviteOrAddWorkspaceMember(supabase as never, { inviteUserByEmail }, input)
    expect(supabase.rpc).not.toHaveBeenCalled()
    expect(result.error).toBe('Could not send an invite to that email.')
  })

  it('reports an error when adding to the workspace fails', async () => {
    const supabase = supabaseWith({ id: 'user-1' }, { message: 'not admin' })
    const inviteUserByEmail = vi.fn()
    const result = await inviteOrAddWorkspaceMember(supabase as never, { inviteUserByEmail }, input)
    expect(result.error).toBe('Could not add them to this workspace.')
  })
})
