import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommentComposer } from './comment-composer'

describe('CommentComposer', () => {
  it('wraps selected text in ** when Bold is clicked', async () => {
    render(<CommentComposer />)
    const textarea = screen.getByRole('textbox', { name: 'Add comment' }) as HTMLTextAreaElement
    await userEvent.type(textarea, 'hello world')
    textarea.setSelectionRange(0, 5)
    await userEvent.click(screen.getByRole('button', { name: 'Bold' }))
    expect(textarea.value).toBe('**hello** world')
  })

  it('wraps selected text in * when Italic is clicked', async () => {
    render(<CommentComposer />)
    const textarea = screen.getByRole('textbox', { name: 'Add comment' }) as HTMLTextAreaElement
    await userEvent.type(textarea, 'hello world')
    textarea.setSelectionRange(6, 11)
    await userEvent.click(screen.getByRole('button', { name: 'Italic' }))
    expect(textarea.value).toBe('hello *world*')
  })

  it('prefixes the current line with "- " when Bulleted list is clicked', async () => {
    render(<CommentComposer />)
    const textarea = screen.getByRole('textbox', { name: 'Add comment' }) as HTMLTextAreaElement
    await userEvent.type(textarea, 'first item')
    textarea.setSelectionRange(0, 0)
    await userEvent.click(screen.getByRole('button', { name: 'Bulleted list' }))
    expect(textarea.value).toBe('- first item')
  })

  it('has name="comment" so the surrounding form still submits it', () => {
    render(<CommentComposer />)
    expect(screen.getByRole('textbox', { name: 'Add comment' })).toHaveAttribute('name', 'comment')
  })
})
