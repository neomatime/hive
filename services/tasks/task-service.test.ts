import { describe, expect, it, vi } from 'vitest'
import { createTask, moveTask, moveTasks, updateColumnWipLimit } from './task-service'

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
  it('moves every selected task into the target column in one call', async () => {
    const inMock = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn(() => ({ in: inMock }))
    const result = await moveTasks(
      { from: vi.fn(() => ({ update })) } as never,
      ['task-1', 'task-2'],
      { id: 'done', isTerminal: true }
    )
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ column_id: 'done', progress_percentage: 100 })
    )
    expect(inMock).toHaveBeenCalledWith('id', ['task-1', 'task-2'])
    expect(result.error).toBeNull()
  })
  it('does nothing for an empty bulk-move selection', async () => {
    const update = vi.fn()
    const result = await moveTasks({ from: vi.fn(() => ({ update })) } as never, [], {
      id: 'done',
      isTerminal: true,
    })
    expect(update).not.toHaveBeenCalled()
    expect(result.error).toBeNull()
  })
  it('sets a column WIP limit', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null }),
      update = vi.fn(() => ({ eq }))
    const result = await updateColumnWipLimit(
      { from: vi.fn(() => ({ update })) } as never,
      'col-1',
      5
    )
    expect(update).toHaveBeenCalledWith({ wip_limit: 5 })
    expect(result.error).toBeNull()
  })
  it('clears a column WIP limit with null', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null }),
      update = vi.fn(() => ({ eq }))
    const result = await updateColumnWipLimit(
      { from: vi.fn(() => ({ update })) } as never,
      'col-1',
      null
    )
    expect(update).toHaveBeenCalledWith({ wip_limit: null })
    expect(result.error).toBeNull()
  })
})
