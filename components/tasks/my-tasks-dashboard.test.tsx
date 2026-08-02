import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyTasksDashboard } from './my-tasks-dashboard'
import type { MyTask } from '@/types/my-task'

const now = new Date()
const part = (value: number) => String(value).padStart(2, '0')
const today = `${now.getFullYear()}-${part(now.getMonth() + 1)}-${part(now.getDate())}`
const tasks: MyTask[] = [
  {
    id: '1',
    projectId: 'p1',
    projectName: 'Website',
    projectCode: 'PRJ-1',
    title: 'Due task',
    description: null,
    priority: 'high',
    dueDate: today,
    completedAt: null,
    status: 'todo',
    statusName: 'To do',
    labels: [],
  },
  {
    id: '2',
    projectId: 'p2',
    projectName: 'Campaign',
    projectCode: 'PRJ-2',
    title: 'Finished task',
    description: null,
    priority: 'low',
    dueDate: null,
    completedAt: '2026-08-01T00:00:00Z',
    status: 'done',
    statusName: 'Done',
    labels: [],
  },
]

describe('MyTasksDashboard', () => {
  it('shows active assignments and due-today count', () => {
    render(<MyTasksDashboard tasks={tasks} />)
    expect(screen.getByText('Due task')).toBeInTheDocument()
    expect(screen.getByText('Due today').parentElement).toHaveTextContent('1')
    expect(screen.queryByText('Finished task')).not.toBeInTheDocument()
  })

  it('switches to completed tasks and searches by project', async () => {
    const user = userEvent.setup()
    render(<MyTasksDashboard tasks={tasks} />)
    await user.click(screen.getByRole('button', { name: /completed 1/i }))
    expect(screen.getByText('Finished task')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Search my tasks'), 'Website')
    expect(screen.getByText('No tasks here')).toBeInTheDocument()
  })
})
