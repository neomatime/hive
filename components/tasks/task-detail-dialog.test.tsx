import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskDetailDialog } from './task-detail-dialog'
import type { Task } from '@/types/task'

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'auth-1' } } }) },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { id: 'user-1' } }),
        })),
      })),
    })),
  }),
}))

vi.mock('@/services/tasks/task-detail-service', () => ({
  listTaskComments: vi.fn().mockResolvedValue([]),
  listProjectLabels: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/services/tasks/subtask-service', () => ({
  listSubtasks: vi.fn().mockResolvedValue([
    {
      id: 'sub-1',
      parentTaskId: 'task-1',
      title: 'Write copy',
      isComplete: false,
      position: 1024,
    },
  ]),
}))

vi.mock('@/services/tasks/watcher-service', () => ({
  listTaskWatcherIds: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/services/tasks/dependency-service', () => ({
  listBlockingTasks: vi.fn().mockResolvedValue([]),
  listCandidateTasks: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/app/dashboard/projects/[projectId]/board/detail-actions', () => ({
  addTaskCommentAction: vi.fn(),
  createTaskLabelAction: vi.fn(),
  setTaskLabelAction: vi.fn(),
  updateTaskAction: vi.fn(),
  createSubtaskAction: vi.fn().mockResolvedValue({
    subtask: {
      id: 'sub-2',
      parentTaskId: 'task-1',
      title: 'Review',
      isComplete: false,
      position: 2048,
    },
    error: null,
  }),
  toggleSubtaskCompleteAction: vi.fn().mockResolvedValue({ error: null }),
  watchTaskAction: vi.fn().mockResolvedValue({ error: null }),
  unwatchTaskAction: vi.fn().mockResolvedValue({ error: null }),
  addDependencyAction: vi.fn().mockResolvedValue({ dependencyId: 'dep-2', error: null }),
  removeDependencyAction: vi.fn().mockResolvedValue({ error: null }),
}))

import {
  addDependencyAction,
  createSubtaskAction,
  removeDependencyAction,
  toggleSubtaskCompleteAction,
  watchTaskAction,
  unwatchTaskAction,
} from '@/app/dashboard/projects/[projectId]/board/detail-actions'
import { listTaskWatcherIds } from '@/services/tasks/watcher-service'
import { listBlockingTasks, listCandidateTasks } from '@/services/tasks/dependency-service'

const task: Task = {
  id: 'task-1',
  projectId: 'project-1',
  boardId: 'board-1',
  columnId: 'col-1',
  title: 'Design homepage',
  description: null,
  priority: 'high',
  assigneeId: null,
  dueDate: null,
  position: 1024,
  progressPercentage: 0,
  isBlocked: false,
  labels: [],
}

describe('TaskDetailDialog subtasks', () => {
  it('lists existing subtasks with completion progress', async () => {
    render(<TaskDetailDialog task={task} onClose={vi.fn()} />)
    expect(await screen.findByText('Write copy')).toBeInTheDocument()
    expect(screen.getByText('0/1 complete')).toBeInTheDocument()
  })

  it('adds a subtask', async () => {
    render(<TaskDetailDialog task={task} onClose={vi.fn()} />)
    await screen.findByText('Write copy')
    await userEvent.type(screen.getByLabelText('Add subtask'), 'Review')
    await userEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(createSubtaskAction).toHaveBeenCalledWith('project-1', {
      parentTaskId: 'task-1',
      boardId: 'board-1',
      columnId: 'col-1',
      title: 'Review',
    })
    expect(await screen.findByText('Review')).toBeInTheDocument()
  })

  it('toggles a subtask complete', async () => {
    render(<TaskDetailDialog task={task} onClose={vi.fn()} />)
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Mark Write copy complete' }))
    expect(toggleSubtaskCompleteAction).toHaveBeenCalledWith('project-1', 'sub-1', true)
  })
})

describe('TaskDetailDialog watchers', () => {
  it('shows Watch and switches to Watching when clicked', async () => {
    render(<TaskDetailDialog task={task} onClose={vi.fn()} />)
    const button = await screen.findByRole('button', { name: 'Watch' })
    await userEvent.click(button)
    expect(watchTaskAction).toHaveBeenCalledWith('project-1', 'task-1')
    expect(await screen.findByRole('button', { name: 'Watching' })).toBeInTheDocument()
  })

  it('shows Watching when the current user already watches the task', async () => {
    vi.mocked(listTaskWatcherIds).mockResolvedValueOnce(['user-1'])
    render(<TaskDetailDialog task={task} onClose={vi.fn()} />)
    const button = await screen.findByRole('button', { name: 'Watching' })
    await userEvent.click(button)
    expect(unwatchTaskAction).toHaveBeenCalledWith('project-1', 'task-1')
    expect(await screen.findByRole('button', { name: 'Watch' })).toBeInTheDocument()
  })
})

describe('TaskDetailDialog dependencies', () => {
  it('lists blocking tasks with a completion indicator', async () => {
    vi.mocked(listBlockingTasks).mockResolvedValueOnce([
      { dependencyId: 'dep-1', taskId: 'task-2', title: 'Design API', isComplete: false },
    ])
    render(<TaskDetailDialog task={task} onClose={vi.fn()} />)
    expect(await screen.findByText('Design API')).toBeInTheDocument()
  })

  it('shows an empty state with no blockers', async () => {
    render(<TaskDetailDialog task={task} onClose={vi.fn()} />)
    expect(await screen.findByText('Not blocked by any other task.')).toBeInTheDocument()
  })

  it('adds a blocking task from the candidate list', async () => {
    vi.mocked(listCandidateTasks).mockResolvedValueOnce([{ id: 'task-2', title: 'Design API' }])
    render(<TaskDetailDialog task={task} onClose={vi.fn()} />)
    await userEvent.selectOptions(
      await screen.findByRole('combobox', { name: 'Add blocking task' }),
      'task-2'
    )
    await userEvent.click(screen.getByRole('button', { name: 'Add blocker' }))
    expect(addDependencyAction).toHaveBeenCalledWith('project-1', 'task-2', 'task-1')
    expect(await screen.findByText('Design API')).toBeInTheDocument()
  })

  it('removes a blocking task', async () => {
    vi.mocked(listBlockingTasks).mockResolvedValueOnce([
      { dependencyId: 'dep-1', taskId: 'task-2', title: 'Design API', isComplete: false },
    ])
    render(<TaskDetailDialog task={task} onClose={vi.fn()} />)
    await userEvent.click(
      await screen.findByRole('button', { name: 'Remove Design API as a blocker' })
    )
    expect(removeDependencyAction).toHaveBeenCalledWith('project-1', 'dep-1')
  })
})
