import { describe, expect, it, vi } from 'vitest'
import { listWorkspaceActivity } from './activity-service'

describe('listWorkspaceActivity', () => {
  it('lists recent workspace activity joined with user and project names', async () => {
    const activityRows = [
      {
        id: 'a-1',
        action: 'task_completed',
        entity_type: 'task',
        entity_id: 'task-1',
        user_id: 'user-1',
        project_id: 'project-1',
        metadata: { title: 'Ship the thing' },
        created_at: '2026-08-04T10:00:00Z',
      },
    ]
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'activity_logs') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue({ data: activityRows, error: null }),
                })),
              })),
            })),
          }
        }
        if (table === 'users') {
          return {
            select: vi.fn(() => ({
              in: vi
                .fn()
                .mockResolvedValue({ data: [{ id: 'user-1', display_name: 'Ada' }], error: null }),
            })),
          }
        }
        if (table === 'projects') {
          return {
            select: vi.fn(() => ({
              in: vi
                .fn()
                .mockResolvedValue({ data: [{ id: 'project-1', name: 'Atlas' }], error: null }),
            })),
          }
        }
        throw new Error(`unexpected table ${table}`)
      }),
    }
    const result = await listWorkspaceActivity(supabase as never, 'workspace-1', 15)
    expect(result).toEqual([
      {
        id: 'a-1',
        action: 'task_completed',
        entityType: 'task',
        entityId: 'task-1',
        userId: 'user-1',
        userName: 'Ada',
        projectId: 'project-1',
        projectName: 'Atlas',
        metadata: { title: 'Ship the thing' },
        createdAt: '2026-08-04T10:00:00Z',
      },
    ])
  })

  it('returns an empty array on error', async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'x' } }),
            })),
          })),
        })),
      })),
    }
    await expect(listWorkspaceActivity(supabase as never, 'workspace-1', 15)).resolves.toEqual([])
  })
})
