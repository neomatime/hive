import type { ReactNode } from 'react'

// Deliberately hand-rolled instead of a markdown library + dangerouslySetInnerHTML:
// every node below is created directly by React, so there is no HTML-injection
// surface to sanitize in the first place. Supports a small, fixed subset:
// **bold**, *italic*, `code`, [text](https://url), and "- " bullet lists.
const INLINE_PATTERN = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\((https?:\/\/[^\s)]+)\))/g

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let key = 0
  for (const match of text.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0
    if (index > lastIndex) nodes.push(text.slice(lastIndex, index))
    const token = match[0]
    if (token.startsWith('**')) {
      nodes.push(<strong key={`${keyPrefix}-${key++}`}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('`')) {
      nodes.push(
        <code key={`${keyPrefix}-${key++}`} className="rounded bg-muted px-1 py-0.5 text-xs">
          {token.slice(1, -1)}
        </code>
      )
    } else if (token.startsWith('[')) {
      const label = token.slice(1, token.indexOf(']'))
      const url = match[2]
      nodes.push(
        <a
          key={`${keyPrefix}-${key++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          {label}
        </a>
      )
    } else {
      nodes.push(<em key={`${keyPrefix}-${key++}`}>{token.slice(1, -1)}</em>)
    }
    lastIndex = index + token.length
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
}

export function CommentBody({ content }: { content: string }) {
  const lines = content.split('\n')
  const blocks: ReactNode[] = []
  let listBuffer: string[] = []

  function flushList(key: string) {
    if (listBuffer.length === 0) return
    const items = listBuffer
    blocks.push(
      <ul key={key} className="list-disc space-y-0.5 pl-5">
        {items.map((item, i) => (
          <li key={i}>{renderInline(item, `${key}-${i}`)}</li>
        ))}
      </ul>
    )
    listBuffer = []
  }

  lines.forEach((line, index) => {
    const bulletMatch = /^-\s+(.*)/.exec(line)
    if (bulletMatch) {
      listBuffer.push(bulletMatch[1] ?? '')
      return
    }
    flushList(`list-${index}`)
    if (line.trim() === '') return
    blocks.push(
      <p key={`p-${index}`} className="whitespace-pre-wrap">
        {renderInline(line, `p-${index}`)}
      </p>
    )
  })
  flushList('list-end')

  return <>{blocks}</>
}
