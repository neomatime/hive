import { describe, expect, it, vi } from 'vitest'
import { listTaskWatcherIds, unwatchTask, watchTask } from './watcher-service'

describe('listTaskWatcherIds', () => {
  it('returns the watching user ids', async () => {
    const eq = vi
      .fn()
      .mockResolvedValue({ data: [{ user_id: 'user-1' }, { user_id: 'user-2' }], error: null })
    const supabase = { from: vi.fn(() => ({ select: vi.fn(() => ({ eq })) })) } as never
    await expect(listTaskWatcherIds(supabase, 'task-1')).resolves.toEqual(['user-1', 'user-2'])
  })

  it('returns an empty array on error', async () => {
    const eq = vi.fn().mockResolvedValue({ data: null, error: { message: 'x' } })
    const supabase = { from: vi.fn(() => ({ select: vi.fn(() => ({ eq })) })) } as never
    await expect(listTaskWatcherIds(supabase, 'task-1')).resolves.toEqual([])
  })
})

describe('watchTask', () => {
  it('inserts a watcher row', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    const supabase = { from: vi.fn(() => ({ insert })) } as never
    const result = await watchTask(supabase, 'task-1', 'user-1')
    expect(insert).toHaveBeenCalledWith({ task_id: 'task-1', user_id: 'user-1' })
    expect(result.error).toBeNull()
  })
})

describe('unwatchTask', () => {
  it('deletes the watcher row', async () => {
    const eq2 = vi.fn().mockResolvedValue({ error: null })
    const eq1 = vi.fn(() => ({ eq: eq2 }))
    const del = vi.fn(() => ({ eq: eq1 }))
    const supabase = { from: vi.fn(() => ({ delete: del })) } as never
    const result = await unwatchTask(supabase, 'task-1', 'user-1')
    expect(eq1).toHaveBeenCalledWith('task_id', 'task-1')
    expect(eq2).toHaveBeenCalledWith('user_id', 'user-1')
    expect(result.error).toBeNull()
  })
})
