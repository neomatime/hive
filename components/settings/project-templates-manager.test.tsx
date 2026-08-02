import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProjectTemplatesManager } from './project-templates-manager'
vi.mock('@/app/dashboard/settings/project-templates/actions', () => ({
  createTemplateAction: vi.fn(),
  updateTemplateAction: vi.fn(),
  duplicateTemplateAction: vi.fn(),
  archiveTemplateAction: vi.fn(),
}))
const templates = [
  {
    id: 't1',
    workspace_id: 'w1',
    name: 'Campaign launch',
    description: 'A repeatable launch plan',
    category: 'Marketing',
    created_by: 'u1',
    is_active: true,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    archived_at: null,
  },
]
describe('ProjectTemplatesManager', () => {
  it('shows template management to admins', () => {
    render(<ProjectTemplatesManager templates={templates} canEdit />)
    expect(screen.getByText('Campaign launch')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Duplicate' })).toBeEnabled()
  })
  it('keeps viewer access read-only', () => {
    render(<ProjectTemplatesManager templates={templates} canEdit={false} />)
    expect(screen.queryByRole('button', { name: 'Archive' })).not.toBeInTheDocument()
    expect(screen.getByText(/only owners and admins/i)).toBeInTheDocument()
  })
})
