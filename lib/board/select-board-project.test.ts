import { describe, expect, it } from 'vitest'
import { selectBoardProject } from './select-board-project'
import type { Project } from '@/types/project'

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

describe('selectBoardProject', () => {
  it('returns null when there are no projects', () => {
    expect(selectBoardProject([], undefined)).toBeNull()
  })

  it('returns null when every project is archived', () => {
    expect(selectBoardProject([project({ archivedAt: '2026-01-01' })], undefined)).toBeNull()
  })

  it('opens the requested project when its id is valid', () => {
    const projects = [project({ id: 'a' }), project({ id: 'b', name: 'Beta' })]
    expect(selectBoardProject(projects, 'b')?.id).toBe('b')
  })

  it('falls back to the default when the requested id is unknown', () => {
    const projects = [project({ id: 'a' })]
    expect(selectBoardProject(projects, 'does-not-exist')?.id).toBe('a')
  })

  it('never opens an archived project, even when explicitly requested', () => {
    const projects = [project({ id: 'a' }), project({ id: 'archived', archivedAt: '2026-01-01' })]
    expect(selectBoardProject(projects, 'archived')?.id).toBe('a')
  })

  it('prefers a favourited project over the first one', () => {
    const projects = [project({ id: 'a' }), project({ id: 'b', isFavourite: true })]
    expect(selectBoardProject(projects, undefined)?.id).toBe('b')
  })

  it('falls back to the first project when none are favourited', () => {
    const projects = [project({ id: 'a' }), project({ id: 'b' })]
    expect(selectBoardProject(projects, undefined)?.id).toBe('a')
  })
})
