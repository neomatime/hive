import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import SettingsPage from './page'
describe('SettingsPage', () => {
  it('links to the live settings sections', () => {
    render(<SettingsPage />)
    expect(screen.getByRole('link', { name: /my profile/i })).toHaveAttribute(
      'href',
      '/dashboard/settings/profile'
    )
    expect(screen.getByRole('link', { name: /account/i })).toHaveAttribute(
      'href',
      '/dashboard/settings/account'
    )
    expect(screen.getByRole('link', { name: /^workspace\b/i })).toHaveAttribute(
      'href',
      '/dashboard/settings/workspace'
    )
    expect(screen.getByRole('link', { name: /^team\b/i })).toHaveAttribute(
      'href',
      '/dashboard/settings/team'
    )
  })
})
