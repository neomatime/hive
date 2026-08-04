import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KanbanBoard } from './kanban-board'
import type { ProjectBoard, Task } from '@/types/task'

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

vi.mock('@/app/dashboard/projects/[projectId]/board/actions', () => ({
  moveTaskAction: vi.fn().mockResolvedValue({ error: null }),
  moveTasksAction: vi.fn().mockResolvedValue({ error: null }),
  updateColumnWipLimitAction: vi.fn().mockResolvedValue({ error: null }),
  saveFilterPresetAction: vi
    .fn()
    .mockResolvedValue({
      preset: {
        id: 'preset-2',
        boardId: 'board-1',
        name: 'Highs',
        filters: { search: '', priority: 'high', assigneeId: 'all' },
      },
      error: null,
    }),
  deleteFilterPresetAction: vi.fn().mockResolvedValue({ error: null }),
}))

import {
  deleteFilterPresetAction,
  moveTasksAction,
  saveFilterPresetAction,
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

function filterableBoard(): ProjectBoard {
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
        wipLimit: null,
        tasks: [
          task({ id: 'task-1', title: 'Design homepage', priority: 'high', assigneeId: 'user-1' }),
          task({ id: 'task-2', title: 'Build API', priority: 'low', assigneeId: null }),
          task({ id: 'task-3', title: 'Write copy', priority: 'high', assigneeId: 'user-2' }),
        ],
      },
    ],
  }
}

const members = [
  {
    id: 'm-1',
    projectId: 'project-1',
    userId: 'user-1',
    role: 'contributor' as const,
    displayName: 'Ada Lovelace',
    avatarUrl: null,
  },
  {
    id: 'm-2',
    projectId: 'project-1',
    userId: 'user-2',
    role: 'contributor' as const,
    displayName: 'Grace Hopper',
    avatarUrl: null,
  },
]

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

describe('KanbanBoard filters', () => {
  it('filters tasks by search text', async () => {
    render(<KanbanBoard board={filterableBoard()} members={members} />)
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search tasks' }), 'design')
    expect(screen.getByText('Design homepage')).toBeInTheDocument()
    expect(screen.queryByText('Build API')).not.toBeInTheDocument()
    expect(screen.queryByText('Write copy')).not.toBeInTheDocument()
  })

  it('filters tasks by priority', async () => {
    render(<KanbanBoard board={filterableBoard()} members={members} />)
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Filter by priority' }),
      'low'
    )
    expect(screen.getByText('Build API')).toBeInTheDocument()
    expect(screen.queryByText('Design homepage')).not.toBeInTheDocument()
  })

  it('filters tasks by assignee, including unassigned', async () => {
    render(<KanbanBoard board={filterableBoard()} members={members} />)
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Filter by assignee' }),
      'Ada Lovelace'
    )
    expect(screen.getByText('Design homepage')).toBeInTheDocument()
    expect(screen.queryByText('Build API')).not.toBeInTheDocument()
    expect(screen.queryByText('Write copy')).not.toBeInTheDocument()

    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Filter by assignee' }),
      'Unassigned'
    )
    expect(screen.getByText('Build API')).toBeInTheDocument()
    expect(screen.queryByText('Design homepage')).not.toBeInTheDocument()
  })
})

describe('KanbanBoard swimlanes', () => {
  it('shows no swimlane headers by default', () => {
    render(<KanbanBoard board={filterableBoard()} members={members} />)
    expect(screen.queryByLabelText(/^Swimlane:/)).not.toBeInTheDocument()
  })

  it('groups tasks into swimlanes by assignee', async () => {
    render(<KanbanBoard board={filterableBoard()} members={members} />)
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Group by' }), 'Assignee')
    const adaLane = screen.getByLabelText('Swimlane: Ada Lovelace')
    expect(within(adaLane).getByText('Design homepage')).toBeInTheDocument()
    const graceLane = screen.getByLabelText('Swimlane: Grace Hopper')
    expect(within(graceLane).getByText('Write copy')).toBeInTheDocument()
    const unassignedLane = screen.getByLabelText('Swimlane: Unassigned')
    expect(within(unassignedLane).getByText('Build API')).toBeInTheDocument()
  })

  it('groups tasks into swimlanes by priority', async () => {
    render(<KanbanBoard board={filterableBoard()} members={members} />)
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Group by' }), 'Priority')
    const highLane = screen.getByLabelText('Swimlane: High')
    expect(within(highLane).getByText('Design homepage')).toBeInTheDocument()
    expect(within(highLane).getByText('Write copy')).toBeInTheDocument()
    const lowLane = screen.getByLabelText('Swimlane: Low')
    expect(within(lowLane).getByText('Build API')).toBeInTheDocument()
  })
})

const presets = [
  {
    id: 'preset-1',
    boardId: 'board-1',
    name: 'Low priority only',
    filters: { search: '', priority: 'low' as const, assigneeId: 'all' as const },
  },
]

describe('KanbanBoard saved filter presets', () => {
  it('applies a saved preset', async () => {
    render(<KanbanBoard board={filterableBoard()} members={members} presets={presets} />)
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Saved filters' }),
      'Low priority only'
    )
    expect(screen.getByText('Build API')).toBeInTheDocument()
    expect(screen.queryByText('Design homepage')).not.toBeInTheDocument()
  })

  it('saves the current filters as a new preset', async () => {
    render(<KanbanBoard board={filterableBoard()} members={members} presets={presets} />)
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Filter by priority' }),
      'high'
    )
    await userEvent.click(screen.getByRole('button', { name: 'Save as preset' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Preset name' }), 'Highs')
    await userEvent.click(screen.getByRole('button', { name: 'Save preset' }))
    expect(saveFilterPresetAction).toHaveBeenCalledWith('project-1', 'board-1', 'Highs', {
      search: '',
      priority: 'high',
      assigneeId: 'all',
    })
  })

  it('deletes the selected preset', async () => {
    render(<KanbanBoard board={filterableBoard()} members={members} presets={presets} />)
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Saved filters' }),
      'Low priority only'
    )
    await userEvent.click(screen.getByRole('button', { name: 'Delete preset' }))
    expect(deleteFilterPresetAction).toHaveBeenCalledWith('project-1', 'preset-1')
  })
})
