import { describe, expect, it, vi } from 'vitest'
import {
  addProjectMember,
  listProjectMembers,
  removeProjectMember,
  updateProjectMemberRole,
} from './project-member-service'

describe('project member service', () => {
  it('maps joined member rows', async () => {
    const eq = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'member-1',
          project_id: 'project-1',
          user_id: 'user-1',
          role: 'project_owner',
          user: { display_name: 'Jane Doe', avatar_url: null },
        },
      ],
      error: null,
    })
    const supabase = { from: vi.fn(() => ({ select: vi.fn(() => ({ eq })) })) } as never
    await expect(listProjectMembers(supabase, 'project-1')).resolves.toEqual([
      {
        id: 'member-1',
        projectId: 'project-1',
        userId: 'user-1',
        role: 'project_owner',
        displayName: 'Jane Doe',
        avatarUrl: null,
      },
    ])
  })

  it('adds a member with the caller attribution', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    const result = await addProjectMember(
      { from: vi.fn(() => ({ insert })) } as never,
      'project-1',
      'user-2',
      'contributor',
      'user-1'
    )
    expect(insert).toHaveBeenCalledWith({
      project_id: 'project-1',
      user_id: 'user-2',
      role: 'contributor',
      added_by: 'user-1',
    })
    expect(result.error).toBeNull()
  })

  it('uses the ownership RPC when promoting an owner', async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null })
    await updateProjectMemberRole({ rpc } as never, 'project-1', 'user-2', 'project_owner')
    expect(rpc).toHaveBeenCalledWith('reassign_project_owner', {
      p_project_id: 'project-1',
      p_new_owner_user_id: 'user-2',
    })
  })

  it('updates ordinary roles directly', async () => {
    const secondEq = vi.fn().mockResolvedValue({ error: null })
    const firstEq = vi.fn(() => ({ eq: secondEq }))
    const update = vi.fn(() => ({ eq: firstEq }))
    await updateProjectMemberRole(
      { from: vi.fn(() => ({ update })) } as never,
      'project-1',
      'user-2',
      'viewer'
    )
    expect(update).toHaveBeenCalledWith({ role: 'viewer' })
  })

  it('sanitizes removal failures', async () => {
    const secondEq = vi.fn().mockResolvedValue({ error: { message: 'raw error' } })
    const firstEq = vi.fn(() => ({ eq: secondEq }))
    const remove = vi.fn(() => ({ eq: firstEq }))
    const result = await removeProjectMember(
      { from: vi.fn(() => ({ delete: remove })) } as never,
      'project-1',
      'user-2'
    )
    expect(result.error).toBe('Could not remove member.')
  })
})
