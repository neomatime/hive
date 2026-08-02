import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CreateProjectDialog } from './create-project-dialog'

vi.mock('@/app/dashboard/projects/actions', () => ({ createProjectAction: vi.fn() }))
import { createProjectAction } from '@/app/dashboard/projects/actions'

function renderDialog() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <CreateProjectDialog workspaceId="workspace-1" currentUserId="user-1" />
    </QueryClientProvider>
  )
}

describe('CreateProjectDialog', () => {
  it('validates a missing name', async () => {
    renderDialog()
    await userEvent.click(screen.getByRole('button', { name: 'New project' }))
    await userEvent.click(screen.getByRole('button', { name: 'Create project' }))
    expect(await screen.findByText('Name is required')).toBeInTheDocument()
  })
  it('validates date order', async () => {
    renderDialog()
    await userEvent.click(screen.getByRole('button', { name: 'New project' }))
    await userEvent.type(screen.getByLabelText('Project name'), 'New project')
    await userEvent.type(screen.getByLabelText('Start date'), '2026-09-01')
    await userEvent.type(screen.getByLabelText('Due date'), '2026-08-01')
    await userEvent.click(screen.getByRole('button', { name: 'Create project' }))
    expect(await screen.findByText(/Due date cannot/)).toBeInTheDocument()
  })
  it('submits valid project data', async () => {
    vi.mocked(createProjectAction).mockResolvedValue({ error: null })
    renderDialog()
    await userEvent.click(screen.getByRole('button', { name: 'New project' }))
    await userEvent.type(screen.getByLabelText('Project name'), 'New project')
    await userEvent.click(screen.getByRole('button', { name: 'Create project' }))
    expect(createProjectAction).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'workspace-1',
        name: 'New project',
        ownerId: 'user-1',
      })
    )
  })
})
