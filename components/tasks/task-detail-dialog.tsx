'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  addTaskCommentAction,
  createTaskLabelAction,
  setTaskLabelAction,
  updateTaskAction,
} from '@/app/dashboard/projects/[projectId]/board/detail-actions'
import {
  listProjectLabels,
  listTaskComments,
  type TaskComment,
} from '@/services/tasks/task-detail-service'
import type { Task, TaskLabel } from '@/types/task'

export function TaskDetailDialog({ task, onClose }: { task: Task; onClose: () => void }) {
  const [comments, setComments] = useState<TaskComment[]>([])
  const [labels, setLabels] = useState<TaskLabel[]>([])
  const [selectedLabelIds, setSelectedLabelIds] = useState(
    () => new Set(task.labels.map((l) => l.id))
  )
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const client = createClient()
    Promise.all([
      listTaskComments(client, task.id),
      listProjectLabels(client, task.projectId),
    ]).then(([nextComments, nextLabels]) => {
      setComments(nextComments)
      setLabels(nextLabels)
    })
  }, [task.id, task.projectId])

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

  async function toggleLabel(labelId: string, selected: boolean) {
    setSelectedLabelIds((current) => {
      const next = new Set(current)
      if (selected) next.add(labelId)
      else next.delete(labelId)
      return next
    })
    const result = await setTaskLabelAction(task.projectId, task.id, labelId, selected)
    if (result.error) {
      setError(result.error)
      setSelectedLabelIds((current) => {
        const next = new Set(current)
        if (selected) next.delete(labelId)
        else next.add(labelId)
        return next
      })
      return
    }
    router.refresh()
  }

  async function addLabel(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const name = String(data.get('labelName')).trim()
    if (!name) return
    const result = await createTaskLabelAction(task.projectId, name, String(data.get('labelColor')))
    if (result.error || !result.label) return setError(result.error)
    setLabels((current) => [...current, result.label!].sort((a, b) => a.name.localeCompare(b.name)))
    form.reset()
  }

  async function comment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const content = String(data.get('comment')).trim()
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

        <section className="mt-8 space-y-3" aria-labelledby="task-labels-title">
          <h3 id="task-labels-title">Labels</h3>
          {labels.length === 0 ? (
            <p className="text-sm text-muted-foreground">No workspace labels yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <label
                  key={label.id}
                  className="flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedLabelIds.has(label.id)}
                    onChange={(e) => toggleLabel(label.id, e.target.checked)}
                  />
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: label.colorToken }}
                  />
                  {label.name}
                </label>
              ))}
            </div>
          )}
          <form onSubmit={addLabel} className="flex items-end gap-2">
            <label className="grid flex-1 gap-1 text-sm">
              New label
              <Input name="labelName" placeholder="e.g. Client review" />
            </label>
            <label className="grid gap-1 text-sm">
              Colour
              <input
                name="labelColor"
                aria-label="Label colour"
                type="color"
                defaultValue="#2563eb"
                className="h-8 w-12 rounded border"
              />
            </label>
            <Button type="submit" variant="outline">
              Create label
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">
            Workspace admins can create reusable labels.
          </p>
        </section>

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
