import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './badge'

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge>Archived</Badge>)
    expect(screen.getByText('Archived')).toBeInTheDocument()
  })

  it('defaults to the neutral variant styling', () => {
    render(<Badge>Archived</Badge>)
    expect(screen.getByText('Archived')).toHaveClass('bg-muted', 'text-muted-foreground')
  })

  it('applies semantic variant colors via CSS custom properties, not hardcoded hex', () => {
    render(<Badge variant="danger">Urgent</Badge>)
    const el = screen.getByText('Urgent')
    expect(el.style.color).toBe('var(--danger)')
    expect(el.style.background).toBe('var(--danger-bg)')
  })

  it('merges a caller-supplied className with its own', () => {
    render(<Badge className="shrink-0">Low</Badge>)
    expect(screen.getByText('Low')).toHaveClass('shrink-0', 'rounded-full')
  })
})
