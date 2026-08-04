import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TeamTable } from './settings-forms'
import {
  addWorkspaceMemberAction,
  removeWorkspaceMemberAction,
  updateMemberRoleAction,
} from '@/app/dashboard/settings/actions'

vi.mock('@/app/dashboard/settings/actions', () => ({
  addWorkspaceMemberAction: vi.fn(),
  removeWorkspaceMemberAction: vi.fn(),
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
    render(<TeamTable members={members} canEdit workspaceId="w1" />)
    expect(screen.getByText('Owner User')).toBeInTheDocument()
    expect(screen.getByLabelText('Role for Owner User')).toBeDisabled()
    expect(screen.getByLabelText('Role for Member User')).toBeEnabled()
  })
  it('disables role management for non-admins', () => {
    render(<TeamTable members={members} canEdit={false} workspaceId="w1" />)
    expect(screen.getByLabelText('Role for Member User')).toBeDisabled()
  })
  it('hides add/remove controls for non-admins', () => {
    render(<TeamTable members={members} canEdit={false} workspaceId="w1" />)
    expect(screen.queryByLabelText('Member email')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()
  })
  it('lets an admin invite a new member', async () => {
    vi.mocked(addWorkspaceMemberAction).mockResolvedValue({ error: null })
    render(<TeamTable members={members} canEdit workspaceId="w1" />)
    await userEvent.type(screen.getByLabelText('Member email'), 'new@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Add member' }))
    expect(addWorkspaceMemberAction).toHaveBeenCalledWith('w1', 'new@example.com', 'member')
  })
  it('lets an admin change a member role', async () => {
    vi.mocked(updateMemberRoleAction).mockResolvedValue({ error: null })
    render(<TeamTable members={members} canEdit workspaceId="w1" />)
    await userEvent.selectOptions(screen.getByLabelText('Role for Member User'), 'admin')
    expect(updateMemberRoleAction).toHaveBeenCalledWith('m2', 'admin')
  })
  it('lets an admin remove a non-owner member, never the owner', async () => {
    vi.mocked(removeWorkspaceMemberAction).mockResolvedValue({ error: null })
    render(<TeamTable members={members} canEdit workspaceId="w1" />)
    expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(1)
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(removeWorkspaceMemberAction).toHaveBeenCalledWith('m2')
  })
})
