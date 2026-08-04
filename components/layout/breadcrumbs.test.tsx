import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Breadcrumbs, buildBreadcrumbTrail } from './breadcrumbs'

describe('buildBreadcrumbTrail', () => {
  it('builds a single-item trail for a top-level page', () => {
    expect(buildBreadcrumbTrail('/dashboard/overview', {})).toEqual([
      { label: 'Overview', href: '/dashboard/overview' },
    ])
  })

  it('builds a multi-item trail for a nested settings page', () => {
    expect(buildBreadcrumbTrail('/dashboard/settings/team', {})).toEqual([
      { label: 'Settings', href: '/dashboard/settings' },
      { label: 'Team', href: '/dashboard/settings/team' },
    ])
  })

  it('resolves the project name from overrides for project-scoped pages', () => {
    const trail = buildBreadcrumbTrail('/dashboard/projects/proj-1/board', {
      'proj-1': 'Giantfuse Capital',
    })
    expect(trail).toEqual([
      { label: 'Projects', href: '/dashboard/projects' },
      { label: 'Giantfuse Capital', href: '/dashboard/projects/proj-1' },
      { label: 'Board', href: '/dashboard/projects/proj-1/board' },
    ])
  })

  it('falls back to a generic label when the project name is not yet resolved', () => {
    const trail = buildBreadcrumbTrail('/dashboard/projects/proj-1/board', {})
    expect(trail[1]).toEqual({ label: 'Project', href: '/dashboard/projects/proj-1' })
  })

  it('title-cases unknown segments as a fallback', () => {
    const trail = buildBreadcrumbTrail('/dashboard/some-new-page', {})
    expect(trail).toEqual([{ label: 'Some New Page', href: '/dashboard/some-new-page' }])
  })
})

describe('Breadcrumbs', () => {
  it('renders each crumb as a link except the current page', () => {
    render(<Breadcrumbs pathname="/dashboard/settings/team" overrides={{}} />)
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/dashboard/settings'
    )
    expect(screen.getByText('Team')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Team' })).not.toBeInTheDocument()
  })

  it('marks the current page for assistive tech', () => {
    render(<Breadcrumbs pathname="/dashboard/overview" overrides={{}} />)
    expect(screen.getByText('Overview')).toHaveAttribute('aria-current', 'page')
  })
})
