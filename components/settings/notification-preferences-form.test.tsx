import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NotificationPreferencesForm } from './notification-preferences-form'

vi.mock('@/app/dashboard/settings/actions', () => ({
  updateNotificationPreferencesAction: vi.fn(),
}))

const preferences = {
  user_id: 'user-1',
  in_app_enabled: true,
  email_enabled: true,
  browser_enabled: false,
  assigned_task: true,
  mention: true,
  due_today: true,
  overdue: true,
  review_requested: true,
  task_completed: false,
}

describe('NotificationPreferencesForm', () => {
  it('shows supported channels and activity events', () => {
    render(<NotificationPreferencesForm preferences={preferences} />)
    expect(screen.getByRole('checkbox', { name: /in-app/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /browser/i })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: /task completed/i })).not.toBeChecked()
    expect(screen.getByRole('button', { name: /save notifications/i })).toBeEnabled()
  })
})
