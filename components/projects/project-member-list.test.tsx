import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectMemberList } from './project-member-list'
import {
  addProjectMemberAction,
  removeProjectMemberAction,
  updateProjectMemberRoleAction,
} from '@/app/dashboard/projects/[projectId]/settings/actions'

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))
vi.mock('@/app/dashboard/projects/[projectId]/settings/actions', () => ({
  addProjectMemberAction: vi.fn(),
  removeProjectMemberAction: vi.fn(),
  updateProjectMemberRoleAction: vi.fn(),
}))

const members = [
  {
    id: 'pm1',
    projectId: 'p1',
    userId: 'u1',
    role: 'project_owner' as const,
    displayName: 'Owner User',
    avatarUrl: null,
  },
]
const availableMembers = [
  { userId: 'u2', displayName: 'Thelma Mothiba', email: 'thelmadesy@gmail.com' },
]

describe('ProjectMemberList', () => {
  it('shows existing members', () => {
    render(
      <ProjectMemberList projectId="p1" members={members} availableMembers={availableMembers} />
    )
    expect(screen.getByText('Owner User')).toBeInTheDocument()
  })
  it('lets an admin add a workspace teammate to the project', async () => {
    vi.mocked(addProjectMemberAction).mockResolvedValue({ error: null })
    render(
      <ProjectMemberList projectId="p1" members={members} availableMembers={availableMembers} />
    )
    await userEvent.selectOptions(screen.getByLabelText('Workspace member'), 'u2')
    await userEvent.click(screen.getByRole('button', { name: 'Add to project' }))
    expect(addProjectMemberAction).toHaveBeenCalledWith('p1', 'u2', 'contributor')
  })
  it('shows a message instead of the form when everyone is already a member', () => {
    render(<ProjectMemberList projectId="p1" members={members} availableMembers={[]} />)
    expect(screen.queryByLabelText('Workspace member')).not.toBeInTheDocument()
    expect(
      screen.getByText('Everyone on the workspace team is already on this project.')
    ).toBeInTheDocument()
  })
  it('lets an admin remove a non-owner member', async () => {
    vi.mocked(removeProjectMemberAction).mockResolvedValue({ error: null })
    const withContributor = [
      ...members,
      {
        id: 'pm2',
        projectId: 'p1',
        userId: 'u2',
        role: 'contributor' as const,
        displayName: 'Thelma Mothiba',
        avatarUrl: null,
      },
    ]
    render(
      <ProjectMemberList
        projectId="p1"
        members={withContributor}
        availableMembers={availableMembers}
      />
    )
    await userEvent.click(screen.getByLabelText('Remove Thelma Mothiba'))
    expect(removeProjectMemberAction).toHaveBeenCalledWith('p1', 'u2')
  })
  it('lets an admin change a member role', async () => {
    vi.mocked(updateProjectMemberRoleAction).mockResolvedValue({ error: null })
    const withContributor = [
      ...members,
      {
        id: 'pm2',
        projectId: 'p1',
        userId: 'u2',
        role: 'contributor' as const,
        displayName: 'Thelma Mothiba',
        avatarUrl: null,
      },
    ]
    render(
      <ProjectMemberList
        projectId="p1"
        members={withContributor}
        availableMembers={availableMembers}
      />
    )
    await userEvent.selectOptions(screen.getByLabelText('Role for Thelma Mothiba'), 'viewer')
    expect(updateProjectMemberRoleAction).toHaveBeenCalledWith('p1', 'u2', 'viewer')
  })
})
