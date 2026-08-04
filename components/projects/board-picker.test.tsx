import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BoardPicker } from './board-picker'
import type { Project } from '@/types/project'

vi.mock('@/lib/supabase/client', () => ({ createClient: () => ({}) }))
vi.mock('@/services/projects/project-service', () => ({
  toggleFavourite: vi.fn().mockResolvedValue(undefined),
}))

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: 'project-1',
    workspaceId: 'workspace-1',
    name: 'Website Redesign',
    projectCode: 'PRJ-0001',
    description: null,
    status: 'active',
    priority: 'high',
    ownerId: 'user-1',
    startDate: null,
    dueDate: null,
    completedAt: null,
    progressPercentage: 40,
    isFavourite: false,
    archivedAt: null,
    ...overrides,
  }
}

describe('BoardPicker', () => {
  it('links each project card to its board', () => {
    render(<BoardPicker initialProjects={[project()]} />)
    expect(screen.getByRole('link', { name: 'Open Website Redesign board' })).toHaveAttribute(
      'href',
      '/dashboard/projects/project-1/board'
    )
  })

  it('shows an empty state with no projects', () => {
    render(<BoardPicker initialProjects={[]} />)
    expect(screen.getByText('No projects yet')).toBeInTheDocument()
  })
})
