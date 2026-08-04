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
  it('omits the selection checkbox when onToggleSelect is not provided', () => {
    render(<ProjectCard project={project} onToggleFavourite={vi.fn()} />)
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })
  it('toggles selection without following the card', async () => {
    const onToggleSelect = vi.fn()
    render(
      <ProjectCard
        project={project}
        onToggleFavourite={vi.fn()}
        isSelected={false}
        onToggleSelect={onToggleSelect}
      />
    )
    await userEvent.click(screen.getByRole('checkbox', { name: `Select ${project.name}` }))
    expect(onToggleSelect).toHaveBeenCalledWith('project-1', true)
  })
  it('omits the actions menu when onDuplicate is not provided', () => {
    render(<ProjectCard project={project} onToggleFavourite={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Project actions' })).not.toBeInTheDocument()
  })
  it('duplicates a project from the actions menu without following the card', async () => {
    const onDuplicate = vi.fn()
    render(<ProjectCard project={project} onToggleFavourite={vi.fn()} onDuplicate={onDuplicate} />)
    await userEvent.click(screen.getByRole('button', { name: 'Project actions' }))
    // The menu popup mounts asynchronously (Base UI defers the open on a
    // requestAnimationFrame tick after a pointer click), so this must be a
    // `findBy` query rather than a synchronous `getBy` (see user-menu.test.tsx).
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Duplicate' }))
    expect(onDuplicate).toHaveBeenCalledWith('project-1')
  })
})
