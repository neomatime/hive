import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sidebar } from './sidebar'

describe('Sidebar', () => {
  it('renders all seven nav items', () => {
    render(<Sidebar activePath="/dashboard/overview" userDisplayName="Jane Doe" userRole="admin" />)
    for (const label of [
      'Overview',
      'Projects',
      'Board',
      'My Tasks',
      'Calendar',
      'Files',
      'Settings',
    ]) {
      expect(screen.getByRole('link', { name: new RegExp(label, 'i') })).toBeInTheDocument()
    }
  })

  it('marks the active route with aria-current', () => {
    render(<Sidebar activePath="/dashboard/board" userDisplayName="Jane Doe" userRole="admin" />)
    expect(screen.getByRole('link', { name: /board/i })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /overview/i })).not.toHaveAttribute('aria-current')
  })

  it("shows the user's name and role at the bottom", () => {
    render(<Sidebar activePath="/dashboard/overview" userDisplayName="Jane Doe" userRole="admin" />)
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('shows the Hive logo', () => {
    render(<Sidebar activePath="/dashboard/overview" userDisplayName="Jane Doe" userRole="admin" />)
    expect(screen.getByRole('img', { name: /hive/i })).toBeInTheDocument()
  })
})
