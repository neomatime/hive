import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  CardGridSkeleton,
  ListSkeleton,
  LoadingRegion,
  PageHeaderSkeleton,
  StatTilesSkeleton,
  TableSkeleton,
} from './skeletons'

function countPlaceholders(container: HTMLElement) {
  return container.querySelectorAll('[data-slot="skeleton"]').length
}

describe('LoadingRegion', () => {
  it('announces what is loading through a status role', () => {
    render(
      <LoadingRegion label="Loading overview">
        <PageHeaderSkeleton />
      </LoadingRegion>
    )
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Loading overview')).toBeInTheDocument()
  })

  it('hides the decorative placeholders from assistive tech', () => {
    const { container } = render(
      <LoadingRegion label="Loading overview">
        <PageHeaderSkeleton />
      </LoadingRegion>
    )
    const decorative = container.querySelector('[aria-hidden="true"]')
    expect(decorative).not.toBeNull()
    expect(countPlaceholders(decorative as HTMLElement)).toBeGreaterThan(0)
  })
})

describe('skeleton building blocks', () => {
  it('renders a title and subtitle bar for the page header', () => {
    const { container } = render(<PageHeaderSkeleton />)
    expect(countPlaceholders(container)).toBe(2)
  })

  it('adds a trailing action placeholder only when asked', () => {
    const { container: without } = render(<PageHeaderSkeleton />)
    expect(countPlaceholders(without)).toBe(2)
    const { container: with_ } = render(<PageHeaderSkeleton action />)
    expect(countPlaceholders(with_)).toBe(3)
  })

  it('renders three stat tiles by default, each with a label and value bar', () => {
    const { container } = render(<StatTilesSkeleton />)
    expect(countPlaceholders(container)).toBe(6)
  })

  it('honours an explicit stat tile count', () => {
    const { container } = render(<StatTilesSkeleton count={2} />)
    expect(countPlaceholders(container)).toBe(4)
  })

  it('renders five list rows by default, each with a label and trailing bar', () => {
    const { container } = render(<ListSkeleton />)
    expect(countPlaceholders(container)).toBe(10)
  })

  it('honours an explicit list row count', () => {
    const { container } = render(<ListSkeleton rows={3} />)
    expect(countPlaceholders(container)).toBe(6)
  })

  it('renders six cards by default', () => {
    const { container } = render(<CardGridSkeleton />)
    expect(countPlaceholders(container)).toBe(30)
  })

  it('honours an explicit card count', () => {
    const { container } = render(<CardGridSkeleton cards={2} />)
    expect(countPlaceholders(container)).toBe(10)
  })

  it('renders a header row plus six body rows by default', () => {
    const { container } = render(<TableSkeleton />)
    expect(countPlaceholders(container)).toBe(28)
  })

  it('honours an explicit table row count', () => {
    const { container } = render(<TableSkeleton rows={2} />)
    expect(countPlaceholders(container)).toBe(12)
  })
})
