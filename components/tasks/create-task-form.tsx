'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createTaskAction } from '@/app/dashboard/projects/[projectId]/board/actions'
export function CreateTaskForm({
  projectId,
  boardId,
  columnId,
}: {
  projectId: string
  boardId: string
  columnId: string
}) {
  const [open, setOpen] = useState(false),
    [error, setError] = useState<string | null>(null)
  const router = useRouter()
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget),
      title = String(data.get('title') ?? '').trim()
    if (!title) return setError('Title is required')
    const result = await createTaskAction({
      projectId,
      boardId,
      columnId,
      title,
      priority: 'medium',
    })
    if (result.error) setError(result.error)
    else {
      setOpen(false)
      router.refresh()
    }
  }
  return open ? (
    <form onSubmit={submit} className="space-y-2 rounded-lg border bg-background p-3">
      <Input name="title" aria-label="Task title" autoFocus />
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button size="sm" type="submit">
          Add task
        </Button>
        <Button size="sm" variant="ghost" type="button" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  ) : (
    <Button variant="ghost" className="w-full" onClick={() => setOpen(true)}>
      + Add task
    </Button>
  )
}
