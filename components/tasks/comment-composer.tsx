'use client'

import { useRef } from 'react'
import { Bold, Italic, List } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CommentComposer() {
  const ref = useRef<HTMLTextAreaElement>(null)

  function wrap(marker: string) {
    const el = ref.current
    if (!el) return
    const { selectionStart, selectionEnd, value } = el
    const selected = value.slice(selectionStart, selectionEnd) || 'text'
    el.value =
      value.slice(0, selectionStart) + marker + selected + marker + value.slice(selectionEnd)
    el.focus()
    el.setSelectionRange(
      selectionStart + marker.length,
      selectionStart + marker.length + selected.length
    )
  }

  function bulletList() {
    const el = ref.current
    if (!el) return
    const { value } = el
    let { selectionStart: start, selectionEnd: end } = el
    if (start === end) {
      // No selection: turn the current line into a bullet, not just the cursor position.
      start = value.lastIndexOf('\n', start - 1) + 1
      end = value.indexOf('\n', end)
      if (end === -1) end = value.length
    }
    const selected = value.slice(start, end)
    const prefixed = selected
      .split('\n')
      .map((line) => `- ${line}`)
      .join('\n')
    el.value = value.slice(0, start) + prefixed + value.slice(end)
    el.focus()
    el.setSelectionRange(start + prefixed.length, start + prefixed.length)
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Bold"
          onClick={() => wrap('**')}
        >
          <Bold className="size-3.5" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Italic"
          onClick={() => wrap('*')}
        >
          <Italic className="size-3.5" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Bulleted list"
          onClick={bulletList}
        >
          <List className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
      <textarea
        ref={ref}
        name="comment"
        aria-label="Add comment"
        placeholder="Write a comment… (supports **bold**, *italic*, and lists)"
        className="min-h-16 w-full rounded-md border bg-transparent p-2 text-sm outline-none focus:border-primary"
      />
    </div>
  )
}
