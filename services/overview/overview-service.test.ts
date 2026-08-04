import { describe, expect, it, vi } from 'vitest'
import { getMyTaskSummary, listUpcomingDeadlines } from './overview-service'
import { listMyTasks } from '../tasks/my-tasks-service'
import { listProjects } from '../projects/project-service'

vi.mock('../tasks/my-tasks-service', () => ({ listMyTasks: vi.fn() }))
vi.mock('../projects/project-service', () => ({ listProjects: vi.fn() }))

const referenceDate = new Date('2026-08-04T09:00:00Z')

function task(overrides: Partial<Record<string, unknown>>) {
  return {
    id: 'task-1',
    projectId: 'project-1',
    projectName: 'Atlas',
    projectCode: 'ATL',
    title: 'Ship the thing',
    description: null,
    priority: 'high',
    dueDate: null,
    completedAt: null,
    status: 'todo',
    statusName: 'To do',
    labels: [],
    ...overrides,
  }
}

describe('getMyTaskSummary', () => {
  it('buckets open tasks into overdue, due today, and due this week', async () => {
    vi.mocked(listMyTasks).mockResolvedValue([
      task({ id: 't-1', dueDate: '2026-08-01' }), // overdue
      task({ id: 't-2', dueDate: '2026-08-04' }), // today
      task({ id: 't-3', dueDate: '2026-08-08' }), // this week
      task({ id: 't-4', dueDate: '2026-09-01' }), // beyond the week, still open
      task({ id: 't-5', dueDate: '2026-08-01', completedAt: '2026-08-01T00:00:00Z' }), // done, excluded
      task({ id: 't-6', dueDate: null }), // no due date, still open
    ] as never)
    const summary = await getMyTaskSummary({} as never, 'user-1', referenceDate)
    expect(summary).toEqual({ overdue: 1, dueToday: 1, dueThisWeek: 1, openTotal: 5 })
  })
})

describe('listUpcomingDeadlines', () => {
  it('merges my task due dates and project due dates within the window, sorted ascending', async () => {
    vi.mocked(listMyTasks).mockResolvedValue([
      task({ id: 't-1', title: 'Overdue task', dueDate: '2026-08-01' }),
      task({ id: 't-2', title: 'Due soon task', dueDate: '2026-08-10' }),
      task({ id: 't-3', title: 'Too far out', dueDate: '2026-09-01' }),
      task({
        id: 't-4',
        title: 'Done already',
        dueDate: '2026-08-05',
        completedAt: '2026-08-01T00:00:00Z',
      }),
    ] as never)
    vi.mocked(listProjects).mockResolvedValue([
      {
        id: 'project-2',
        workspaceId: 'workspace-1',
        name: 'Launch',
        projectCode: 'LNC',
        description: null,
        status: 'active',
        priority: 'high',
        ownerId: 'user-1',
        startDate: null,
        dueDate: '2026-08-06',
        completedAt: null,
        progressPercentage: 0,
        isFavourite: false,
        archivedAt: null,
      },
    ] as never)
    const result = await listUpcomingDeadlines({} as never, 'user-1', 'workspace-1', referenceDate)
    expect(result.map((item) => item.title)).toEqual(['Overdue task', 'Launch', 'Due soon task'])
    expect(result[0]).toMatchObject({ kind: 'task', dueDate: '2026-08-01' })
    expect(result[1]).toMatchObject({
      kind: 'project',
      dueDate: '2026-08-06',
      projectName: 'Launch',
    })
  })

  it('caps results to 8 items', async () => {
    vi.mocked(listMyTasks).mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => task({ id: `t-${i}`, dueDate: '2026-08-05' })) as never
    )
    vi.mocked(listProjects).mockResolvedValue([] as never)
    const result = await listUpcomingDeadlines({} as never, 'user-1', 'workspace-1', referenceDate)
    expect(result).toHaveLength(8)
  })
})
