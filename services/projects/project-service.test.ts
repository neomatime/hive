import { describe, expect, it, vi } from 'vitest'
import {
  archiveProject,
  createProject,
  getProject,
  listProjects,
  restoreProject,
  toggleFavourite,
  updateProject,
} from './project-service'

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'project-1',
    workspace_id: 'workspace-1',
    name: 'Website Redesign',
    project_code: 'PRJ-0001',
    description: 'Refresh the site',
    status: 'active',
    priority: 'high',
    owner_id: 'user-1',
    start_date: '2026-08-01',
    due_date: '2026-09-01',
    completed_at: null,
    progress_percentage: 0,
    is_favourite: false,
    archived_at: null,
    ...overrides,
  }
}

describe('project reads', () => {
  it('maps and filters project rows', async () => {
    const order = vi.fn().mockResolvedValue({ data: [row()], error: null })
    const chain = { eq: vi.fn(), ilike: vi.fn(), order }
    chain.eq.mockReturnValue(chain)
    chain.ilike.mockReturnValue(chain)
    const supabase = { from: vi.fn(() => ({ select: vi.fn(() => chain) })) } as never
    const projects = await listProjects(supabase, 'workspace-1', {
      status: 'active',
      search: 'site',
    })
    expect(projects[0]).toMatchObject({
      id: 'project-1',
      projectCode: 'PRJ-0001',
      isFavourite: false,
    })
    expect(chain.ilike).toHaveBeenCalledWith('name', '%site%')
  })

  it('returns null for an inaccessible project', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'no rows' } })
    const supabase = {
      from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ single })) })) })),
    } as never
    await expect(getProject(supabase, 'missing')).resolves.toBeNull()
  })
})

describe('project writes', () => {
  it('creates a project through the atomic RPC', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: row({ name: 'New Project' }), error: null })
    const result = await createProject({ rpc } as never, {
      workspaceId: 'workspace-1',
      name: 'New Project',
      description: null,
      status: 'not_started',
      priority: 'medium',
      ownerId: 'user-1',
      startDate: null,
      dueDate: null,
      memberIds: [],
      templateId: 'template-1',
    })
    expect(rpc).toHaveBeenCalledWith(
      'create_project_with_owner',
      expect.objectContaining({ p_name: 'New Project', p_template_id: 'template-1' })
    )
    expect(result.project?.name).toBe('New Project')
  })

  it('sanitizes creation failures', async () => {
    const result = await createProject(
      {
        rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'SQL details' } }),
      } as never,
      {
        workspaceId: 'workspace-1',
        name: 'New',
        description: null,
        status: 'not_started',
        priority: 'medium',
        ownerId: 'user-1',
        startDate: null,
        dueDate: null,
        memberIds: [],
      }
    )
    expect(result.error).not.toContain('SQL details')
  })

  it.each([
    ['update', updateProject, { name: 'Renamed' }],
    ['archive', archiveProject, undefined],
    ['restore', restoreProject, undefined],
    ['favourite', toggleFavourite, true],
  ])('performs %s updates', async (_name, operation, argument) => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn(() => ({ eq }))
    const supabase = { from: vi.fn(() => ({ update })) } as never
    const result = await (operation as (...args: never[]) => Promise<{ error: string | null }>)(
      supabase,
      'project-1',
      argument as never
    )
    expect(result.error).toBeNull()
    expect(update).toHaveBeenCalled()
  })
})
