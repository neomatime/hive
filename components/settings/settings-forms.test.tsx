import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileForm, TeamTable, resolveDisplayName } from './settings-forms'
import {
  addWorkspaceMemberAction,
  removeWorkspaceMemberAction,
  updateMemberRoleAction,
  updateProfileAction,
} from '@/app/dashboard/settings/actions'
import { getProfile } from '@/services/settings/settings-service'

vi.mock('@/app/dashboard/settings/actions', () => ({
  addWorkspaceMemberAction: vi.fn(),
  removeWorkspaceMemberAction: vi.fn(),
  updateMemberRoleAction: vi.fn(),
  updatePasswordAction: vi.fn(),
  updateProfileAction: vi.fn(),
  updateWorkspaceAction: vi.fn(),
}))
vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }))
vi.mock('@/services/settings/settings-service', () => ({ getProfile: vi.fn() }))
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
  it('is not clickable for non-admins', () => {
    render(<TeamTable members={members} canEdit={false} workspaceId="w1" />)
    expect(screen.queryByRole('button', { name: /Member User/ })).not.toBeInTheDocument()
  })
  it('opens a teammate profile editor on click and saves through updateProfileAction', async () => {
    vi.mocked(getProfile).mockResolvedValue({
      id: 'u2',
      display_name: 'Member User',
      first_name: 'Member',
      last_name: 'User',
      job_title: null,
      department: null,
      phone_number: null,
      timezone: 'UTC',
      email: 'member@example.com',
    })
    vi.mocked(updateProfileAction).mockResolvedValue({ error: null })
    render(<TeamTable members={members} canEdit workspaceId="w1" />)
    await userEvent.click(screen.getByRole('button', { name: /Member User/ }))
    expect(getProfile).toHaveBeenCalledWith(undefined, 'u2')
    await waitFor(() => screen.getByLabelText('Job title'))
    await userEvent.type(screen.getByLabelText('Job title'), 'Engineer')
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }))
    expect(updateProfileAction).toHaveBeenCalledWith(
      'u2',
      expect.objectContaining({ displayName: 'Member User', jobTitle: 'Engineer' })
    )
    // the dialog closes and the row reflects the new job title
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByText(/Engineer/)).toBeInTheDocument()
  })
})
describe('resolveDisplayName', () => {
  it('keeps a real custom display name untouched', () => {
    expect(resolveDisplayName('Thelma M.', 'thelma@example.com', 'Thelma', 'Mothiba')).toBe(
      'Thelma M.'
    )
  })
  it('substitutes first + last name when the field is still the email default', () => {
    expect(
      resolveDisplayName('thelma@example.com', 'thelma@example.com', 'Thelma', 'Mothiba')
    ).toBe('Thelma Mothiba')
  })
  it('falls back to the email default if first/last are both blank', () => {
    expect(resolveDisplayName('thelma@example.com', 'thelma@example.com', '', '')).toBe(
      'thelma@example.com'
    )
  })
})
describe('ProfileForm', () => {
  const profile = {
    id: 'u2',
    display_name: 'member@example.com',
    first_name: '',
    last_name: '',
    job_title: null,
    department: null,
    phone_number: null,
    timezone: 'UTC',
    email: 'member@example.com',
  }
  it('saves the computed full name when only first/last are edited', async () => {
    vi.mocked(updateProfileAction).mockResolvedValue({ error: null })
    render(<ProfileForm profile={profile} />)
    await userEvent.type(screen.getByLabelText('First name'), 'Thelma')
    await userEvent.type(screen.getByLabelText('Last name'), 'Mothiba')
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }))
    expect(updateProfileAction).toHaveBeenCalledWith(
      'u2',
      expect.objectContaining({ displayName: 'Thelma Mothiba' })
    )
  })
})
