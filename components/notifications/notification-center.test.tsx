import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NotificationCenter } from './notification-center'
const then = vi.fn((callback) => callback({ data: [] }))
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({ select: () => ({ order: () => ({ limit: () => ({ then }) }) }) }),
  }),
}))
describe('NotificationCenter', () => {
  it('shows an empty notification state', async () => {
    render(<NotificationCenter />)
    screen.getByRole('button', { name: 'Notifications' }).click()
    await waitFor(() => expect(screen.getByText(/all caught up/i)).toBeInTheDocument())
  })
})
