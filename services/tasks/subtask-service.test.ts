import { describe, expect, it, vi } from 'vitest'
import { createSubtask, listSubtasks, toggleSubtaskComplete } from './subtask-service'

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'subtask-1',
    parent_task_id: 'task-1',
    title: 'Write copy',
    completed_at: null,
    position: 1024,
    ...overrides,
  }
}

describe('listSubtasks', () => {
  it('maps rows and marks completion from completed_at', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        row(),
        row({ id: 'subtask-2', title: 'Review', completed_at: '2026-08-01T00:00:00Z' }),
      ],
      error: null,
    })
    const chain = { eq: vi.fn(), is: vi.fn(), order }
    chain.eq.mockReturnValue(chain)
    chain.is.mockReturnValue(chain)
    const supabase = { from: vi.fn(() => ({ select: vi.fn(() => chain) })) } as never

    const subtasks = await listSubtasks(supabase, 'task-1')

    expect(subtasks).toEqual([
      {
        id: 'subtask-1',
        parentTaskId: 'task-1',
        title: 'Write copy',
        isComplete: false,
        position: 1024,
      },
      {
        id: 'subtask-2',
        parentTaskId: 'task-1',
        title: 'Review',
        isComplete: true,
        position: 1024,
      },
    ])
  })

  it('returns an empty array on error', async () => {
    const chain = {
      eq: vi.fn(),
      is: vi.fn(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'x' } }),
    }
    chain.eq.mockReturnValue(chain)
    chain.is.mockReturnValue(chain)
    const supabase = { from: vi.fn(() => ({ select: vi.fn(() => chain) })) } as never
    await expect(listSubtasks(supabase, 'task-1')).resolves.toEqual([])
  })
})

describe('createSubtask', () => {
  it('positions the new subtask after the current last one and inserts it', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { position: 1024 }, error: null })
    const single = vi.fn().mockResolvedValue({ data: row({ position: 2048 }), error: null })
    const selectChain = { eq: vi.fn(), order: vi.fn(), limit: vi.fn() }
    selectChain.eq.mockReturnValue(selectChain)
    selectChain.order.mockReturnValue(selectChain)
    selectChain.limit.mockReturnValue({ maybeSingle })
    const insert = vi.fn(() => ({ select: vi.fn(() => ({ single })) }))
    const supabase = {
      from: vi.fn(() => ({ select: vi.fn(() => selectChain), insert })),
    } as never

    const result = await createSubtask(supabase, {
      parentTaskId: 'task-1',
      projectId: 'project-1',
      boardId: 'board-1',
      columnId: 'col-1',
      title: 'Write copy',
      createdBy: 'user-1',
    })

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ parent_task_id: 'task-1', title: 'Write copy', position: 2048 })
    )
    expect(result.subtask?.title).toBe('Write copy')
    expect(result.error).toBeNull()
  })

  it('returns a generic error on failure', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } })
    const selectChain = { eq: vi.fn(), order: vi.fn(), limit: vi.fn() }
    selectChain.eq.mockReturnValue(selectChain)
    selectChain.order.mockReturnValue(selectChain)
    selectChain.limit.mockReturnValue({ maybeSingle })
    const insert = vi.fn(() => ({ select: vi.fn(() => ({ single })) }))
    const supabase = {
      from: vi.fn(() => ({ select: vi.fn(() => selectChain), insert })),
    } as never

    const result = await createSubtask(supabase, {
      parentTaskId: 'task-1',
      projectId: 'project-1',
      boardId: 'board-1',
      columnId: 'col-1',
      title: 'Write copy',
      createdBy: 'user-1',
    })

    expect(result.subtask).toBeNull()
    expect(result.error).toBe('Could not create subtask.')
  })
})

describe('toggleSubtaskComplete', () => {
  it('sets completed_at when marking complete', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn(() => ({ eq }))
    const supabase = { from: vi.fn(() => ({ update })) } as never
    const result = await toggleSubtaskComplete(supabase, 'subtask-1', true)
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ completed_at: expect.any(String), progress_percentage: 100 })
    )
    expect(result.error).toBeNull()
  })

  it('clears completed_at when marking incomplete', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn(() => ({ eq }))
    const supabase = { from: vi.fn(() => ({ update })) } as never
    const result = await toggleSubtaskComplete(supabase, 'subtask-1', false)
    expect(update).toHaveBeenCalledWith({ completed_at: null, progress_percentage: 0 })
    expect(result.error).toBeNull()
  })
})
