import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalendarView } from './calendar-view'
import type { CalendarEvent } from '@/types/calendar'

const events: CalendarEvent[] = [
  {
    id: 'task-1',
    type: 'task',
    title: 'Submit proposal',
    date: '2026-08-03',
    projectId: 'p1',
    projectName: 'Website',
    projectCode: 'PRJ-1',
    completed: false,
  },
  {
    id: 'project-p1',
    type: 'project',
    title: 'Website deadline',
    date: '2026-08-12',
    projectId: 'p1',
    projectName: 'Website',
    projectCode: 'PRJ-1',
    completed: false,
  },
]

describe('CalendarView', () => {
  it('renders task and project deadlines in the month', () => {
    render(<CalendarView events={events} initialDate="2026-08-03" />)
    expect(screen.getByText('August 2026')).toBeInTheDocument()
    expect(screen.getByText('Submit proposal')).toBeInTheDocument()
    expect(screen.getByText('Website deadline')).toBeInTheDocument()
  })

  it('switches between week and day views', async () => {
    const user = userEvent.setup()
    render(<CalendarView events={events} initialDate="2026-08-03" />)
    await user.click(screen.getByRole('button', { name: /^week$/i }))
    expect(screen.getByLabelText('week calendar')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^day$/i }))
    expect(screen.getByLabelText('day calendar')).toBeInTheDocument()
    expect(screen.getByText('Submit proposal')).toBeInTheDocument()
  })
})
