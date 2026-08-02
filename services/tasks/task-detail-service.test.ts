import { describe, expect, it, vi } from 'vitest'
import { addTaskComment, updateTask } from './task-detail-service'
describe('task details', () => {
  it('maps editable fields to the task row', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null }),
      update = vi.fn(() => ({ eq }))
    const result = await updateTask({ from: vi.fn(() => ({ update })) } as never, 'task-1', {
      title: ' Updated ',
      description: null,
      priority: 'high',
      assigneeId: null,
      dueDate: null,
    })
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Updated', priority: 'high' })
    )
    expect(result.error).toBeNull()
  })
  it('adds trimmed comments', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    await addTaskComment(
      { from: vi.fn(() => ({ insert })) } as never,
      'task-1',
      'user-1',
      ' hello '
    )
    expect(insert).toHaveBeenCalledWith({
      task_id: 'task-1',
      author_id: 'user-1',
      content: 'hello',
    })
  })
})
