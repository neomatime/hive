import { describe, expect, it, vi } from 'vitest'
import {
  addDependency,
  listBlockingTasks,
  listCandidateTasks,
  removeDependency,
} from './dependency-service'

describe('listBlockingTasks', () => {
  it('maps blocking tasks with their completion state', async () => {
    const eq = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'dep-1',
          blocking_task_id: 'task-2',
          blocking_task: { id: 'task-2', title: 'Design API', completed_at: null },
        },
        {
          id: 'dep-2',
          blocking_task_id: 'task-3',
          blocking_task: {
            id: 'task-3',
            title: 'Write spec',
            completed_at: '2026-08-01T00:00:00Z',
          },
        },
      ],
      error: null,
    })
    const supabase = { from: vi.fn(() => ({ select: vi.fn(() => ({ eq })) })) }
    const result = await listBlockingTasks(supabase as never, 'task-1')
    expect(result).toEqual([
      { dependencyId: 'dep-1', taskId: 'task-2', title: 'Design API', isComplete: false },
      { dependencyId: 'dep-2', taskId: 'task-3', title: 'Write spec', isComplete: true },
    ])
  })

  it('returns an empty array on error', async () => {
    const eq = vi.fn().mockResolvedValue({ data: null, error: { message: 'x' } })
    const supabase = { from: vi.fn(() => ({ select: vi.fn(() => ({ eq })) })) }
    await expect(listBlockingTasks(supabase as never, 'task-1')).resolves.toEqual([])
  })
})

describe('addDependency', () => {
  it('inserts a dependency row and returns its id', async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: 'dep-1' }, error: null })
    const select = vi.fn(() => ({ single }))
    const insert = vi.fn(() => ({ select }))
    const supabase = { from: vi.fn(() => ({ insert })) }
    const result = await addDependency(supabase as never, 'task-2', 'task-1')
    expect(insert).toHaveBeenCalledWith({ blocking_task_id: 'task-2', blocked_task_id: 'task-1' })
    expect(result.error).toBeNull()
    expect(result.dependencyId).toBe('dep-1')
  })

  it('reports a friendly error for a duplicate link', async () => {
    const single = vi
      .fn()
      .mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate' } })
    const select = vi.fn(() => ({ single }))
    const insert = vi.fn(() => ({ select }))
    const supabase = { from: vi.fn(() => ({ insert })) }
    const result = await addDependency(supabase as never, 'task-2', 'task-1')
    expect(result.error).toBe('That task is already listed as a blocker.')
  })

  it('reports a friendly error for a self-dependency', async () => {
    const single = vi
      .fn()
      .mockResolvedValue({ data: null, error: { code: '23514', message: 'check violation' } })
    const select = vi.fn(() => ({ single }))
    const insert = vi.fn(() => ({ select }))
    const supabase = { from: vi.fn(() => ({ insert })) }
    const result = await addDependency(supabase as never, 'task-1', 'task-1')
    expect(result.error).toBe('A task cannot block itself.')
  })
})

describe('removeDependency', () => {
  it('deletes a dependency by id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn(() => ({ eq }))
    const supabase = { from: vi.fn(() => ({ delete: del })) }
    const result = await removeDependency(supabase as never, 'dep-1')
    expect(eq).toHaveBeenCalledWith('id', 'dep-1')
    expect(result.error).toBeNull()
  })
})

describe('listCandidateTasks', () => {
  it('lists other open tasks in the project, excluding the given task', async () => {
    const neq = vi.fn().mockResolvedValue({
      data: [{ id: 'task-2', title: 'Design API' }],
      error: null,
    })
    const is = vi.fn(() => ({ neq }))
    const eq = vi.fn(() => ({ is }))
    const supabase = { from: vi.fn(() => ({ select: vi.fn(() => ({ eq })) })) }
    const result = await listCandidateTasks(supabase as never, 'project-1', 'task-1')
    expect(eq).toHaveBeenCalledWith('project_id', 'project-1')
    expect(is).toHaveBeenCalledWith('deleted_at', null)
    expect(neq).toHaveBeenCalledWith('id', 'task-1')
    expect(result).toEqual([{ id: 'task-2', title: 'Design API' }])
  })
})
