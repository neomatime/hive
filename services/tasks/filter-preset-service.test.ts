import { describe, expect, it, vi } from 'vitest'
import { deleteFilterPreset, listFilterPresets, saveFilterPreset } from './filter-preset-service'

describe('listFilterPresets', () => {
  it('maps preset rows to FilterPreset', async () => {
    const eq2 = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'preset-1',
          board_id: 'board-1',
          name: 'My urgent tasks',
          filters: { search: '', priority: 'urgent', assigneeId: 'all' },
        },
      ],
      error: null,
    })
    const eq1 = vi.fn(() => ({ eq: eq2 }))
    const supabase = { from: vi.fn(() => ({ select: vi.fn(() => ({ eq: eq1 })) })) }
    const result = await listFilterPresets(supabase as never, 'board-1', 'user-1')
    expect(eq1).toHaveBeenCalledWith('board_id', 'board-1')
    expect(eq2).toHaveBeenCalledWith('user_id', 'user-1')
    expect(result).toEqual([
      {
        id: 'preset-1',
        boardId: 'board-1',
        name: 'My urgent tasks',
        filters: { search: '', priority: 'urgent', assigneeId: 'all' },
      },
    ])
  })

  it('returns an empty array on error', async () => {
    const eq2 = vi.fn().mockResolvedValue({ data: null, error: { message: 'x' } })
    const supabase = {
      from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: eq2 })) })) })),
    }
    await expect(listFilterPresets(supabase as never, 'board-1', 'user-1')).resolves.toEqual([])
  })
})

describe('saveFilterPreset', () => {
  it('inserts a named preset for the current user and returns it', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'preset-1',
        board_id: 'board-1',
        name: 'My urgent tasks',
        filters: { search: '', priority: 'urgent', assigneeId: 'all' },
      },
      error: null,
    })
    const select = vi.fn(() => ({ single }))
    const insert = vi.fn(() => ({ select }))
    const supabase = { from: vi.fn(() => ({ insert })) }
    const result = await saveFilterPreset(supabase as never, {
      boardId: 'board-1',
      userId: 'user-1',
      name: 'My urgent tasks',
      filters: { search: '', priority: 'urgent', assigneeId: 'all' },
    })
    expect(insert).toHaveBeenCalledWith({
      board_id: 'board-1',
      user_id: 'user-1',
      name: 'My urgent tasks',
      filters: { search: '', priority: 'urgent', assigneeId: 'all' },
    })
    expect(result.error).toBeNull()
    expect(result.preset).toEqual({
      id: 'preset-1',
      boardId: 'board-1',
      name: 'My urgent tasks',
      filters: { search: '', priority: 'urgent', assigneeId: 'all' },
    })
  })

  it('reports a friendly error when the name is already taken', async () => {
    const single = vi.fn().mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate' },
    })
    const select = vi.fn(() => ({ single }))
    const insert = vi.fn(() => ({ select }))
    const supabase = { from: vi.fn(() => ({ insert })) }
    const result = await saveFilterPreset(supabase as never, {
      boardId: 'board-1',
      userId: 'user-1',
      name: 'My urgent tasks',
      filters: { search: '', priority: 'all', assigneeId: 'all' },
    })
    expect(result.error).toBe('You already have a preset with that name.')
    expect(result.preset).toBeNull()
  })
})

describe('deleteFilterPreset', () => {
  it('deletes a preset by id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn(() => ({ eq }))
    const supabase = { from: vi.fn(() => ({ delete: del })) }
    const result = await deleteFilterPreset(supabase as never, 'preset-1')
    expect(eq).toHaveBeenCalledWith('id', 'preset-1')
    expect(result.error).toBeNull()
  })
})
