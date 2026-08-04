import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KanbanBoard } from './kanban-board'
import type { ProjectBoard, Task } from '@/types/task'

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

vi.mock('@/app/dashboard/projects/[projectId]/board/actions', () => ({
  moveTaskAction: vi.fn().mockResolvedValue({ error: null }),
  moveTasksAction: vi.fn().mockResolvedValue({ error: null }),
  updateColumnWipLimitAction: vi.fn().mockResolvedValue({ error: null }),
}))

import {
  moveTasksAction,
  updateColumnWipLimitAction,
} from '@/app/dashboard/projects/[projectId]/board/actions'

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    projectId: 'project-1',
    boardId: 'board-1',
    columnId: 'col-todo',
    title: 'Design homepage',
    description: null,
    priority: 'high',
    assigneeId: null,
    dueDate: null,
    position: 1024,
    progressPercentage: 0,
    isBlocked: false,
    labels: [],
    ...overrides,
  }
}

function board(): ProjectBoard {
  return {
    id: 'board-1',
    projectId: 'project-1',
    name: 'Main board',
    columns: [
      {
        id: 'col-todo',
        boardId: 'board-1',
        name: 'To Do',
        status: 'todo',
        position: 0,
        isTerminal: false,
        wipLimit: 2,
        tasks: [task(), task({ id: 'task-2', title: 'Build API' })],
      },
      {
        id: 'col-done',
        boardId: 'board-1',
        name: 'Done',
        status: 'done',
        position: 1,
        isTerminal: true,
        wipLimit: null,
        tasks: [],
      },
    ],
  }
}

describe('KanbanBoard WIP limits', () => {
  it('shows the task count against the configured limit', () => {
    render(<KanbanBoard board={board()} />)
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
  })
  it('flags a column at its WIP limit', () => {
    render(<KanbanBoard board={board()} />)
    expect(screen.getByTestId('wip-count-col-todo')).toHaveAttribute('data-at-limit', 'true')
  })
  it('does not flag a column under its limit', () => {
    render(<KanbanBoard board={board()} />)
    expect(screen.getByTestId('wip-count-col-done')).toHaveAttribute('data-at-limit', 'false')
  })
  it('edits a column WIP limit', async () => {
    render(<KanbanBoard board={board()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Edit WIP limit for Done' }))
    const input = screen.getByRole('spinbutton', { name: 'WIP limit for Done' })
    await userEvent.type(input, '3')
    await userEvent.keyboard('{Enter}')
    expect(updateColumnWipLimitAction).toHaveBeenCalledWith('project-1', 'col-done', 3)
  })
})

describe('KanbanBoard bulk task movement', () => {
  it('moves selected tasks to a chosen column', async () => {
    render(<KanbanBoard board={board()} />)
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Design homepage' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Build API' }))
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Move selected to' }),
      'Done'
    )
    await userEvent.click(screen.getByRole('button', { name: 'Move 2 tasks' }))
    expect(moveTasksAction).toHaveBeenCalledWith(
      'project-1',
      expect.arrayContaining(['task-1', 'task-2']),
      'col-done',
      true
    )
  })
  it('does not show the bulk action bar with nothing selected', () => {
    render(<KanbanBoard board={board()} />)
    expect(screen.queryByRole('button', { name: /Move \d+ tasks/ })).not.toBeInTheDocument()
  })
})
