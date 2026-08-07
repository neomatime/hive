import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BoardProjectSwitcher } from './board-project-switcher'
import type { Project } from '@/types/project'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    workspaceId: 'w1',
    name: 'Alpha',
    projectCode: 'PRJ-0001',
    description: null,
    status: 'active',
    priority: 'medium',
    ownerId: 'u1',
    startDate: null,
    dueDate: null,
    completedAt: null,
    progressPercentage: 0,
    isFavourite: false,
    archivedAt: null,
    ...overrides,
  }
}

describe('BoardProjectSwitcher', () => {
  it('lists every project and marks the open one as selected', () => {
    render(
      <BoardProjectSwitcher
        projects={[project({ id: 'a' }), project({ id: 'b', name: 'Beta' })]}
        selectedId="b"
      />
    )
    expect(screen.getByRole('option', { name: 'Alpha' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Beta' })).toBeInTheDocument()
    expect(screen.getByLabelText('Project')).toHaveValue('b')
  })

  it('opens the chosen project board', async () => {
    push.mockClear()
    render(
      <BoardProjectSwitcher
        projects={[project({ id: 'a' }), project({ id: 'b', name: 'Beta' })]}
        selectedId="a"
      />
    )
    await userEvent.selectOptions(screen.getByLabelText('Project'), 'b')
    expect(push).toHaveBeenCalledWith('/dashboard/board?project=b')
  })
})
