import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NotificationInbox } from './notification-inbox'
vi.mock('@/app/dashboard/inbox/actions', () => ({
  markNotificationReadAction: vi.fn(),
  markAllNotificationsReadAction: vi.fn(),
}))
const item = {
  id: 'n1',
  user_id: 'u1',
  workspace_id: 'w1',
  type: 'assigned_task',
  title: 'Task assigned',
  message: 'Prepare brief',
  entity_type: 'task',
  entity_id: 't1',
  is_read: false,
  read_at: null,
  created_at: '2026-08-02T10:00:00Z',
  projectId: 'p1',
}
describe('NotificationInbox', () => {
  it('shows unread activity and a direct project link', () => {
    render(<NotificationInbox notifications={[item]} />)
    expect(screen.getByText('Prepare brief')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /prepare brief/i })).toHaveAttribute(
      'href',
      '/dashboard/projects/p1/board'
    )
    expect(screen.getByRole('button', { name: /mark all read/i })).toBeEnabled()
  })
})
