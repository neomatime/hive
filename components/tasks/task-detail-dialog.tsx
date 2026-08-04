'use client'
import { useEffect, useRef, useState } from 'react'
import { Download, Paperclip, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  addDependencyAction,
  addTaskCommentAction,
  createSubtaskAction,
  createTaskLabelAction,
  removeDependencyAction,
  setTaskLabelAction,
  toggleSubtaskCompleteAction,
  unwatchTaskAction,
  updateTaskAction,
  watchTaskAction,
} from '@/app/dashboard/projects/[projectId]/board/detail-actions'
import {
  listProjectLabels,
  listTaskComments,
  type TaskComment,
} from '@/services/tasks/task-detail-service'
import { listSubtasks } from '@/services/tasks/subtask-service'
import { listTaskWatcherIds } from '@/services/tasks/watcher-service'
import {
  listBlockingTasks,
  listCandidateTasks,
  type BlockingTask,
} from '@/services/tasks/dependency-service'
import { CommentBody } from './comment-body'
import { CommentComposer } from './comment-composer'
import type { Subtask, Task, TaskLabel } from '@/types/task'
import type { ProjectMember } from '@/types/project'

export function TaskDetailDialog({
  task,
  onClose,
  members = [],
}: {
  task: Task
  onClose: () => void
  members?: ProjectMember[]
}) {
  const [comments, setComments] = useState<TaskComment[]>([])
  const [labels, setLabels] = useState<TaskLabel[]>([])
  const [selectedLabelIds, setSelectedLabelIds] = useState(
    () => new Set(task.labels.map((l) => l.id))
  )
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [isWatching, setIsWatching] = useState(false)
  const [blockingTasks, setBlockingTasks] = useState<BlockingTask[]>([])
  const [candidateTasks, setCandidateTasks] = useState<{ id: string; title: string }[]>([])
  const [selectedBlockerId, setSelectedBlockerId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<
    Array<{ id: string; name: string; storage_key: string; size_bytes: number }>
  >([])
  const [uploading, setUploading] = useState(false)
  const attachmentPicker = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const client = createClient()
    Promise.all([
      listTaskComments(client, task.id),
      listProjectLabels(client, task.projectId),
      listSubtasks(client, task.id),
      listTaskWatcherIds(client, task.id),
      listBlockingTasks(client, task.id),
      listCandidateTasks(client, task.projectId, task.id),
      client.auth.getUser(),
    ]).then(
      async ([nextComments, nextLabels, nextSubtasks, watcherIds, blockers, candidates, auth]) => {
        setComments(nextComments)
        setLabels(nextLabels)
        setSubtasks(nextSubtasks)
        setBlockingTasks(blockers)
        setCandidateTasks(candidates)
        if (auth.data.user) {
          const user = await client
            .from('users')
            .select('id')
            .eq('auth_user_id', auth.data.user.id)
            .single()
          if (user.data) setIsWatching(watcherIds.includes(user.data.id))
        }
      }
    )
  }, [task.id, task.projectId])

  async function addBlocker() {
    if (!selectedBlockerId) return
    const result = await addDependencyAction(task.projectId, selectedBlockerId, task.id)
    if (result.error || !result.dependencyId) return setError(result.error)
    const candidate = candidateTasks.find((item) => item.id === selectedBlockerId)
    if (candidate) {
      setBlockingTasks((current) => [
        ...current,
        {
          dependencyId: result.dependencyId!,
          taskId: candidate.id,
          title: candidate.title,
          isComplete: false,
        },
      ])
    }
    setSelectedBlockerId('')
    router.refresh()
  }

  async function removeBlocker(dependencyId: string) {
    setBlockingTasks((current) => current.filter((item) => item.dependencyId !== dependencyId))
    const result = await removeDependencyAction(task.projectId, dependencyId)
    if (result.error) setError(result.error)
    router.refresh()
  }

  async function toggleWatch() {
    const next = !isWatching
    setIsWatching(next)
    const result = next
      ? await watchTaskAction(task.projectId, task.id)
      : await unwatchTaskAction(task.projectId, task.id)
    if (result.error) {
      setError(result.error)
      setIsWatching(!next)
    }
  }

  async function addSubtask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const title = String(data.get('subtaskTitle')).trim()
    if (!title) return
    const result = await createSubtaskAction(task.projectId, {
      parentTaskId: task.id,
      boardId: task.boardId,
      columnId: task.columnId,
      title,
    })
    if (result.error || !result.subtask) return setError(result.error)
    setSubtasks((current) => [...current, result.subtask!])
    form.reset()
  }

  async function toggleSubtask(subtaskId: string, isComplete: boolean) {
    setSubtasks((current) =>
      current.map((item) => (item.id === subtaskId ? { ...item, isComplete } : item))
    )
    const result = await toggleSubtaskCompleteAction(task.projectId, subtaskId, isComplete)
    if (result.error) {
      setError(result.error)
      setSubtasks((current) =>
        current.map((item) => (item.id === subtaskId ? { ...item, isComplete: !isComplete } : item))
      )
    }
  }

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

  async function uploadAttachment(file: File) {
    if (file.size > 52428800) return setError('Attachments must be 50 MB or smaller.')
    setUploading(true)
    const client = createClient()
    const [{ data: auth }, project] = await Promise.all([
      client.auth.getUser(),
      client.from('projects').select('workspace_id').eq('id', task.projectId).single(),
    ])
    if (!auth.user || !project.data) {
      setUploading(false)
      return setError('Could not identify the current workspace.')
    }
    const user = await client.from('users').select('id').eq('auth_user_id', auth.user.id).single()
    if (!user.data) {
      setUploading(false)
      return setError('Could not identify the current user.')
    }
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
    const storageKey = `${project.data.workspace_id}/${task.projectId}/${crypto.randomUUID()}-${safe}`
    const stored = await client.storage
      .from('project-files')
      .upload(storageKey, file, { contentType: file.type })
    if (stored.error) {
      setUploading(false)
      return setError('Could not upload attachment.')
    }
    const metadata = await client
      .from('files')
      .insert({
        workspace_id: project.data.workspace_id,
        project_id: task.projectId,
        task_id: task.id,
        uploaded_by: user.data.id,
        name: file.name,
        storage_key: storageKey,
        mime_type: file.type || 'application/octet-stream',
        file_type: file.type.startsWith('image/')
          ? 'image'
          : file.type === 'application/pdf'
            ? 'pdf'
            : 'other',
        size_bytes: file.size,
      })
      .select('id,name,storage_key,size_bytes')
      .single()
    if (metadata.error || !metadata.data) {
      await client.storage.from('project-files').remove([storageKey])
      setUploading(false)
      return setError('Could not save attachment details.')
    }
    setAttachments((current) => [metadata.data, ...current])
    setUploading(false)
  }

  async function downloadAttachment(attachment: { name: string; storage_key: string }) {
    const result = await createClient()
      .storage.from('project-files')
      .createSignedUrl(attachment.storage_key, 60, { download: attachment.name })
    if (result.data) window.open(result.data.signedUrl, '_blank', 'noopener,noreferrer')
    else setError('Could not download attachment.')
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
          <div className="flex gap-2">
            <Button variant={isWatching ? 'default' : 'outline'} size="sm" onClick={toggleWatch}>
              {isWatching ? 'Watching' : 'Watch'}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
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
            Assignee
            <select
              name="assigneeId"
              aria-label="Assignee"
              defaultValue={task.assigneeId ?? ''}
              className="h-8 rounded-lg border bg-background px-2"
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.displayName}
                </option>
              ))}
            </select>
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

        <section className="mt-8 space-y-3" aria-labelledby="attachments-title">
          <div className="flex items-center justify-between gap-3">
            <h3 id="attachments-title">Attachments</h3>
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => attachmentPicker.current?.click()}
            >
              <Upload />
              {uploading ? 'Uploading�' : 'Add file'}
            </Button>
            <input
              ref={attachmentPicker}
              type="file"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) uploadAttachment(file)
                event.target.value = ''
              }}
            />
          </div>
          {attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No files attached to this task.</p>
          ) : (
            attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between rounded-lg border p-3 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Paperclip className="size-4 shrink-0" />
                  <span className="truncate">{attachment.name}</span>
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Download ${attachment.name}`}
                  onClick={() => downloadAttachment(attachment)}
                >
                  <Download />
                </Button>
              </div>
            ))
          )}
        </section>

        <section className="mt-8 space-y-3" aria-labelledby="subtasks-title">
          <h3 id="subtasks-title">
            Subtasks
            {subtasks.length > 0 && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {subtasks.filter((s) => s.isComplete).length}/{subtasks.length} complete
              </span>
            )}
          </h3>
          {subtasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subtasks yet.</p>
          ) : (
            <ul className="space-y-1">
              {subtasks.map((subtask) => (
                <li key={subtask.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    aria-label={`Mark ${subtask.title} complete`}
                    checked={subtask.isComplete}
                    onChange={(e) => toggleSubtask(subtask.id, e.target.checked)}
                  />
                  <span className={cn(subtask.isComplete && 'text-muted-foreground line-through')}>
                    {subtask.title}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={addSubtask} className="flex gap-2">
            <Input name="subtaskTitle" aria-label="Add subtask" placeholder="Add a subtask…" />
            <Button type="submit" variant="outline">
              Add
            </Button>
          </form>
        </section>

        <section className="mt-8 space-y-3" aria-labelledby="dependencies-title">
          <h3 id="dependencies-title">Blocked by</h3>
          {blockingTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Not blocked by any other task.</p>
          ) : (
            <ul className="space-y-1">
              {blockingTasks.map((blocker) => (
                <li key={blocker.dependencyId} className="flex items-center gap-2 text-sm">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{
                      background: blocker.isComplete ? 'var(--success)' : 'var(--danger)',
                    }}
                    aria-hidden="true"
                  />
                  <span className={cn('flex-1', blocker.isComplete && 'text-muted-foreground')}>
                    {blocker.title}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove ${blocker.title} as a blocker`}
                    onClick={() => removeBlocker(blocker.dependencyId)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {candidateTasks.length > 0 && (
            <div className="flex gap-2">
              <select
                aria-label="Add blocking task"
                className="h-8 flex-1 rounded-md border bg-background px-2 text-sm"
                value={selectedBlockerId}
                onChange={(e) => setSelectedBlockerId(e.target.value)}
              >
                <option value="">Select a task…</option>
                {candidateTasks
                  .filter((t) => !blockingTasks.some((b) => b.taskId === t.id))
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </select>
              <Button type="button" variant="outline" onClick={addBlocker}>
                Add blocker
              </Button>
            </div>
          )}
        </section>

        <section className="mt-8 space-y-3">
          <h3>Comments</h3>
          {comments.map((item) => (
            <div key={item.id} className="space-y-1 rounded-lg bg-muted p-3 text-sm">
              <CommentBody content={item.content} />
            </div>
          ))}
          <form onSubmit={comment} className="space-y-2">
            <CommentComposer />
            <Button type="submit">Comment</Button>
          </form>
        </section>
      </section>
    </div>
  )
}
