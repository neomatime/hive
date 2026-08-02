import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TaskPreferencesForm } from './task-preferences-form'
vi.mock('@/app/dashboard/settings/actions', () => ({ updateTaskPreferencesAction: vi.fn() }))
describe('TaskPreferencesForm', () => {
  it('renders stored planning defaults', () => {
    render(
      <TaskPreferencesForm
        preferences={{
          user_id: 'u1',
          default_task_priority: 'high',
          default_task_status: 'todo',
          week_starts_on: 1,
          working_hours_start: '08:00:00',
          working_hours_end: '17:00:00',
          show_completed_tasks: false,
        }}
      />
    )
    expect(screen.getByLabelText(/default priority/i)).toHaveValue('high')
    expect(screen.getByLabelText(/week starts on/i)).toHaveValue('1')
    expect(screen.getByRole('button', { name: /save task preferences/i })).toBeEnabled()
  })
})
