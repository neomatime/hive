'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createProjectAction } from '@/app/dashboard/projects/actions'

export function CreateProjectDialog({
  workspaceId,
  currentUserId,
  templates = [],
}: {
  workspaceId: string
  currentUserId: string
  templates?: Array<{
    id: string
    name: string
    description: string | null
    category: string | null
  }>
}) {
  const [open, setOpen] = useState(false),
    [error, setError] = useState<string | null>(null),
    [submitting, setSubmitting] = useState(false)
  const queryClient = useQueryClient()
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') ?? '').trim(),
      startDate = String(data.get('startDate') ?? ''),
      dueDate = String(data.get('dueDate') ?? '')
    if (!name) return setError('Name is required')
    if (startDate && dueDate && dueDate < startDate)
      return setError('Due date cannot be before the start date')
    setSubmitting(true)
    const result = await createProjectAction({
      workspaceId,
      name,
      description: String(data.get('description') ?? ''),
      status: 'not_started',
      priority: 'medium',
      ownerId: currentUserId,
      startDate,
      dueDate,
      memberIds: [],
      templateId: String(data.get('templateId') ?? '') || null,
    })
    setSubmitting(false)
    if (result.error) return setError(result.error)
    await queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] })
    setOpen(false)
  }
  return (
    <>
      <Button onClick={() => setOpen(true)}>New project</Button>
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-project-title"
            className="w-full max-w-lg space-y-5 rounded-xl bg-background p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 id="create-project-title">Create project</h2>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
            <form className="space-y-4" onSubmit={submit} noValidate>
              <label className="grid gap-1 text-sm">
                Start from a template
                <select name="templateId" className="h-10 rounded-lg border bg-background px-3">
                  <option value="">Blank project</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                      {template.category ? ` � ${template.category}` : ''}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-muted-foreground">
                  Template details are used when project fields are left blank.
                </span>
              </label>
              <label className="grid gap-1 text-sm">
                Project name
                <Input name="name" />
              </label>
              <label className="grid gap-1 text-sm">
                Description
                <textarea
                  name="description"
                  className="min-h-20 rounded-lg border bg-transparent p-2"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-sm">
                  Start date
                  <Input name="startDate" type="date" />
                </label>
                <label className="grid gap-1 text-sm">
                  Due date
                  <Input name="dueDate" type="date" />
                </label>
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <div className="flex justify-end">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create project'}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  )
}
