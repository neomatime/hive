import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectCard } from './project-card'
import type { Project } from '@/types/project'

const project: Project = {
  id: 'project-1',
  workspaceId: 'workspace-1',
  name: 'Website Redesign',
  projectCode: 'PRJ-0001',
  description: null,
  status: 'active',
  priority: 'high',
  ownerId: 'user-1',
  startDate: null,
  dueDate: '2026-09-01',
  completedAt: null,
  progressPercentage: 40,
  isFavourite: false,
  archivedAt: null,
}
describe('ProjectCard', () => {
  it('shows project state and progress', () => {
    render(<ProjectCard project={project} onToggleFavourite={vi.fn()} />)
    expect(screen.getByText('Website Redesign')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('40% complete')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Website Redesign board' })).toHaveAttribute(
      'href',
      '/dashboard/projects/project-1/board'
    )
    expect(screen.getByText('Open board')).toBeInTheDocument()
  })
  it('marks archived cards', () => {
    render(<ProjectCard project={{ ...project, status: 'archived' }} onToggleFavourite={vi.fn()} />)
    expect(screen.getByTestId('project-card')).toHaveAttribute('data-archived', 'true')
  })
  it('toggles favourite without following the card', async () => {
    const toggle = vi.fn()
    render(<ProjectCard project={project} onToggleFavourite={toggle} />)
    await userEvent.click(screen.getByRole('button', { name: 'Add favourite' }))
    expect(toggle).toHaveBeenCalledWith('project-1', true)
  })
})

