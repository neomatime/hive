import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TeamTable } from './settings-forms'

vi.mock('@/app/dashboard/settings/actions', () => ({
  updateMemberRoleAction: vi.fn(),
  updatePasswordAction: vi.fn(),
  updateProfileAction: vi.fn(),
  updateWorkspaceAction: vi.fn(),
}))
const members = [
  {
    id: 'm1',
    user_id: 'u1',
    role: 'owner' as const,
    is_active: true,
    joined_at: '2026-01-01',
    user: {
      id: 'u1',
      display_name: 'Owner User',
      email: 'owner@example.com',
      job_title: 'Director',
    },
  },
  {
    id: 'm2',
    user_id: 'u2',
    role: 'member' as const,
    is_active: true,
    joined_at: '2026-01-02',
    user: { id: 'u2', display_name: 'Member User', email: 'member@example.com', job_title: null },
  },
]
describe('TeamTable', () => {
  it('shows team identities and protects the owner role', () => {
    render(<TeamTable members={members} canEdit />)
    expect(screen.getByText('Owner User')).toBeInTheDocument()
    expect(screen.getByLabelText('Role for Owner User')).toBeDisabled()
    expect(screen.getByLabelText('Role for Member User')).toBeEnabled()
  })
  it('disables role management for non-admins', () => {
    render(<TeamTable members={members} canEdit={false} />)
    expect(screen.getByLabelText('Role for Member User')).toBeDisabled()
  })
})
