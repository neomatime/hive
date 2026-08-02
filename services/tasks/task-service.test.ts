import { describe, expect, it, vi } from 'vitest'
import { createTask, moveTask } from './task-service'

describe('task service', () => {
  it('creates tasks after the current last position', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { position: 1024 }, error: null })
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'task-1',
        project_id: 'p',
        board_id: 'b',
        column_id: 'c',
        title: 'Task',
        description: null,
        priority: 'medium',
        assignee_id: null,
        due_date: null,
        position: 2048,
        progress_percentage: 0,
        is_blocked: false,
      },
      error: null,
    })
    const insert = vi.fn(() => ({ select: vi.fn(() => ({ single })) }))
    const query = { eq: vi.fn(), is: vi.fn(), order: vi.fn(), limit: vi.fn() }
    query.eq.mockReturnValue(query)
    query.is.mockReturnValue(query)
    query.order.mockReturnValue(query)
    query.limit.mockReturnValue({ maybeSingle })
    const client = { from: vi.fn(() => ({ select: vi.fn(() => query), insert })) } as never
    const result = await createTask(client, {
      projectId: 'p',
      boardId: 'b',
      columnId: 'c',
      title: 'Task',
      priority: 'medium',
      createdBy: 'u',
    })
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ position: 2048, title: 'Task' }))
    expect(result.error).toBeNull()
  })
  it('completes tasks moved into a terminal column', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null }),
      update = vi.fn(() => ({ eq }))
    const result = await moveTask(
      { from: vi.fn(() => ({ update })) } as never,
      'task-1',
      { id: 'done', isTerminal: true },
      1024
    )
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ column_id: 'done', progress_percentage: 100 })
    )
    expect(result.error).toBeNull()
  })
})
