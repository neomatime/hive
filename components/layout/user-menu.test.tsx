import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserMenu } from './user-menu'

vi.mock('@/app/dashboard/actions', () => ({
  signOutAction: vi.fn(),
}))

import { signOutAction } from '@/app/dashboard/actions'

describe('UserMenu', () => {
  it('opens to reveal a sign out option', async () => {
    render(<UserMenu displayName="Jane Doe" email="jane@himark.com" avatarUrl={null} />)
    await userEvent.click(screen.getByRole('button', { name: /jane doe/i }))
    // The menu popup mounts asynchronously (Base UI defers the open on a
    // requestAnimationFrame tick after a pointer click), so this must be a
    // `findBy` query rather than a synchronous `getBy`.
    expect(await screen.findByRole('menuitem', { name: /sign out/i })).toBeInTheDocument()
  })

  it('calls signOutAction when "Sign out" is clicked', async () => {
    render(<UserMenu displayName="Jane Doe" email="jane@himark.com" avatarUrl={null} />)
    await userEvent.click(screen.getByRole('button', { name: /jane doe/i }))
    await userEvent.click(await screen.findByRole('menuitem', { name: /sign out/i }))
    expect(signOutAction).toHaveBeenCalled()
  })
})
