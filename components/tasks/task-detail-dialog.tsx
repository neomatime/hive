'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  addTaskCommentAction,
  updateTaskAction,
} from '@/app/dashboard/projects/[projectId]/board/detail-actions'
import { listTaskComments, type TaskComment } from '@/services/tasks/task-detail-service'
import type { Task } from '@/types/task'
export function TaskDetailDialog({ task, onClose }: { task: Task; onClose: () => void }) {
  const [comments, setComments] = useState<TaskComment[]>([]),
    [error, setError] = useState<string | null>(null)
  const router = useRouter()
  useEffect(() => {
    listTaskComments(createClient(), task.id).then(setComments)
  }, [task.id])
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const result = await updateTaskAction(task.projectId, task.id, {
      title: String(data.get('title')),
      description: String(data.get('description')),
      priority: String(data.get('priority')) as Task['priority'],
      assigneeId: String(data.get('assigneeId')),
      dueDate: String(data.get('dueDate')),
    })
    if (result.error) setError(result.error)
    else {
      router.refresh()
      onClose()
    }
  }
  async function comment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget,
      data = new FormData(form),
      content = String(data.get('comment')).trim()
    if (!content) return
    const result = await addTaskCommentAction(task.projectId, task.id, content)
    if (result.error) setError(result.error)
    else {
      form.reset()
      setComments(await listTaskComments(createClient(), task.id))
    }
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-background p-6 shadow-xl"
      >
        <div className="mb-5 flex justify-between">
          <h2 id="task-title">Task details</h2>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        <form onSubmit={save} className="space-y-4">
          <label className="grid gap-1 text-sm">
            Title
            <Input name="title" defaultValue={task.title} />
          </label>
          <label className="grid gap-1 text-sm">
            Description
            <textarea
              name="description"
              defaultValue={task.description ?? ''}
              className="min-h-24 rounded-lg border bg-transparent p-2"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              Priority
              <select
                name="priority"
                defaultValue={task.priority}
                className="h-8 rounded-lg border bg-background px-2"
              >
                <option>low</option>
                <option>medium</option>
                <option>high</option>
                <option>urgent</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Due date
              <Input name="dueDate" type="date" defaultValue={task.dueDate ?? ''} />
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            Assignee ID
            <Input name="assigneeId" defaultValue={task.assigneeId ?? ''} />
          </label>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit">Save task</Button>
        </form>
        <section className="mt-8 space-y-3">
          <h3>Comments</h3>
          {comments.map((item) => (
            <p key={item.id} className="rounded-lg bg-muted p-3 text-sm">
              {item.content}
            </p>
          ))}
          <form onSubmit={comment} className="flex gap-2">
            <Input name="comment" aria-label="Add comment" placeholder="Write a comment…" />
            <Button type="submit">Comment</Button>
          </form>
        </section>
      </section>
    </div>
  )
}
