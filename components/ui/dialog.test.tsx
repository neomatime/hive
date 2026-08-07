import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dialog } from './dialog'

describe('Dialog', () => {
  it('renders its children inside a labelled dialog role', () => {
    render(
      <Dialog labelledBy="my-title" onClose={vi.fn()}>
        <h2 id="my-title">My dialog</h2>
      </Dialog>
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'my-title')
    expect(screen.getByText('My dialog')).toBeInTheDocument()
  })

  it('closes on overlay click by default', async () => {
    const onClose = vi.fn()
    render(
      <Dialog labelledBy="my-title" onClose={onClose}>
        <h2 id="my-title">My dialog</h2>
      </Dialog>
    )
    // The overlay is the dialog role's parent -- click it directly, not the panel.
    await userEvent.click(screen.getByRole('dialog').parentElement!)
    expect(onClose).toHaveBeenCalled()
  })

  it('does not close on overlay click when closeOnOverlayClick is false', async () => {
    const onClose = vi.fn()
    render(
      <Dialog labelledBy="my-title" onClose={onClose} closeOnOverlayClick={false}>
        <h2 id="my-title">My dialog</h2>
      </Dialog>
    )
    await userEvent.click(screen.getByRole('dialog').parentElement!)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('does not close when clicking inside the panel', async () => {
    const onClose = vi.fn()
    render(
      <Dialog labelledBy="my-title" onClose={onClose}>
        <h2 id="my-title">My dialog</h2>
      </Dialog>
    )
    await userEvent.click(screen.getByText('My dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('applies a caller-supplied className to the panel, replacing the default', () => {
    render(
      <Dialog labelledBy="my-title" onClose={vi.fn()} className="max-w-2xl">
        <h2 id="my-title">My dialog</h2>
      </Dialog>
    )
    expect(screen.getByRole('dialog')).toHaveClass('max-w-2xl')
  })
})
