import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CommentBody } from './comment-body'

describe('CommentBody', () => {
  it('renders bold, italic, and inline code', () => {
    render(<CommentBody content="**bold** and *italic* and `code`" />)
    expect(screen.getByText('bold').tagName).toBe('STRONG')
    expect(screen.getByText('italic').tagName).toBe('EM')
    expect(screen.getByText('code').tagName).toBe('CODE')
  })

  it('renders links with a safe target and rel', () => {
    render(<CommentBody content="See [the doc](https://example.com/doc)" />)
    const link = screen.getByRole('link', { name: 'the doc' })
    expect(link).toHaveAttribute('href', 'https://example.com/doc')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders a bulleted list from consecutive "- " lines', () => {
    render(<CommentBody content={'Steps:\n- First\n- Second'} />)
    const list = screen.getByRole('list')
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('First')
    expect(items[1]).toHaveTextContent('Second')
    expect(list).toBeInTheDocument()
  })

  it('never injects raw HTML from content', () => {
    const { container } = render(<CommentBody content="<img src=x onerror=alert(1)>" />)
    expect(container.querySelector('img')).not.toBeInTheDocument()
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
  })
})
