import { describe, expect, it, vi } from 'vitest'
import {
  archiveProject,
  archiveProjects,
  createProject,
  duplicateProject,
  getProject,
  listProjects,
  restoreProject,
  restoreProjects,
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

describe('duplicateProject', () => {
  it('copies name/description/priority through create_project_with_owner, with the new owner excluded from the copied member list', async () => {
    const projectSingle = vi.fn().mockResolvedValue({
      data: {
        name: 'Website Redesign',
        description: 'Refresh the site',
        priority: 'high',
        workspace_id: 'workspace-1',
      },
      error: null,
    })
    const membersEq = vi
      .fn()
      .mockResolvedValue({ data: [{ user_id: 'user-1' }, { user_id: 'user-2' }], error: null })
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: row({ name: 'Website Redesign (copy)' }), error: null })
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'projects')
          return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: projectSingle })) })) }
        if (table === 'project_members') return { select: vi.fn(() => ({ eq: membersEq })) }
        throw new Error(`unexpected table ${table}`)
      }),
      rpc,
    } as never

    const result = await duplicateProject(supabase, 'project-1', 'user-2')

    expect(rpc).toHaveBeenCalledWith(
      'create_project_with_owner',
      expect.objectContaining({
        p_name: 'Website Redesign (copy)',
        p_description: 'Refresh the site',
        p_priority: 'high',
        p_workspace_id: 'workspace-1',
        p_owner_id: 'user-2',
        p_status: 'not_started',
        p_start_date: null,
        p_due_date: null,
        p_member_ids: ['user-1'],
      })
    )
    expect(result.project?.name).toBe('Website Redesign (copy)')
    expect(result.error).toBeNull()
  })

  it('returns a generic error when the source project cannot be read', async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'no rows' } }),
          })),
        })),
      })),
    } as never
    const result = await duplicateProject(supabase, 'missing', 'user-1')
    expect(result.project).toBeNull()
    expect(result.error).toBe('Could not duplicate project.')
  })
})

describe('bulk project actions', () => {
  it.each([
    ['archive', archiveProjects, 'archived'],
    ['restore', restoreProjects, 'active'],
  ])('%s applies to every id in one call', async (_name, operation, expectedStatus) => {
    const inMock = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn(() => ({ in: inMock }))
    const supabase = { from: vi.fn(() => ({ update })) } as never

    const result = await operation(supabase, ['project-1', 'project-2'])

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: expectedStatus }))
    expect(inMock).toHaveBeenCalledWith('id', ['project-1', 'project-2'])
    expect(result.error).toBeNull()
  })

  it('does nothing and reports no error for an empty selection', async () => {
    const update = vi.fn()
    const supabase = { from: vi.fn(() => ({ update })) } as never
    const result = await archiveProjects(supabase, [])
    expect(update).not.toHaveBeenCalled()
    expect(result.error).toBeNull()
  })
})
