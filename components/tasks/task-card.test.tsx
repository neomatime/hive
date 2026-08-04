import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskCard } from './task-card'
import type { Task } from '@/types/task'

const task: Task = {
  id: 'task-1',
  projectId: 'project-1',
  boardId: 'board-1',
  columnId: 'col-1',
  title: 'Design homepage',
  description: null,
  priority: 'high',
  assigneeId: null,
  dueDate: '2026-09-01',
  position: 1024,
  progressPercentage: 0,
  isBlocked: false,
  labels: [],
}

describe('TaskCard', () => {
  it('shows the task title, priority, and due date', () => {
    render(<TaskCard task={task} onDragStart={vi.fn()} onOpen={vi.fn()} />)
    expect(screen.getByText('Design homepage')).toBeInTheDocument()
    expect(screen.getByText('high')).toBeInTheDocument()
    expect(screen.getByText('2026-09-01')).toBeInTheDocument()
  })
  it('opens the task when clicked', async () => {
    const onOpen = vi.fn()
    render(<TaskCard task={task} onDragStart={vi.fn()} onOpen={onOpen} />)
    await userEvent.click(screen.getByText('Design homepage'))
    expect(onOpen).toHaveBeenCalledWith(task)
  })
  it('omits the selection checkbox when onToggleSelect is not provided', () => {
    render(<TaskCard task={task} onDragStart={vi.fn()} onOpen={vi.fn()} />)
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })
  it('toggles selection without opening the task', async () => {
    const onToggleSelect = vi.fn()
    const onOpen = vi.fn()
    render(
      <TaskCard
        task={task}
        onDragStart={vi.fn()}
        onOpen={onOpen}
        isSelected={false}
        onToggleSelect={onToggleSelect}
      />
    )
    await userEvent.click(screen.getByRole('checkbox', { name: `Select ${task.title}` }))
    expect(onToggleSelect).toHaveBeenCalledWith('task-1', true)
    expect(onOpen).not.toHaveBeenCalled()
  })
})
