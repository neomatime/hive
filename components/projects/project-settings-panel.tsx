'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  archiveProjectAction,
  restoreProjectAction,
  updateProjectAction,
} from '@/app/dashboard/projects/[projectId]/settings/actions'
import type { Project } from '@/types/project'

export function ProjectSettingsPanel({ project }: { project: Project }) {
  const router = useRouter(),
    [error, setError] = useState<string | null>(null),
    [saving, setSaving] = useState(false)
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const data = new FormData(event.currentTarget)
    const result = await updateProjectAction(project.id, {
      name: String(data.get('name')),
      description: String(data.get('description')) || null,
      priority: String(data.get('priority')) as Project['priority'],
      startDate: String(data.get('startDate')) || null,
      dueDate: String(data.get('dueDate')) || null,
    })
    setSaving(false)
    if (result.error) setError(result.error)
    else router.refresh()
  }
  async function archive() {
    const result =
      project.status === 'archived'
        ? await restoreProjectAction(project.id)
        : await archiveProjectAction(project.id)
    if (result.error) setError(result.error)
    else router.refresh()
  }
  return (
    <div className="space-y-8">
      <form onSubmit={save} className="max-w-2xl space-y-4">
        <label className="grid gap-1 text-sm">
          Name
          <Input name="name" defaultValue={project.name} required />
        </label>
        <label className="grid gap-1 text-sm">
          Description
          <textarea
            name="description"
            defaultValue={project.description ?? ''}
            className="min-h-24 rounded-lg border bg-transparent p-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Priority
          <select
            name="priority"
            defaultValue={project.priority}
            className="h-8 rounded-lg border bg-background px-3"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm">
            Start date
            <Input name="startDate" type="date" defaultValue={project.startDate ?? ''} />
          </label>
          <label className="grid gap-1 text-sm">
            Due date
            <Input name="dueDate" type="date" defaultValue={project.dueDate ?? ''} />
          </label>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
      <section className="space-y-3 rounded-xl border border-destructive/30 p-5">
        <h2>Danger zone</h2>
        <p className="text-sm text-muted-foreground">
          {project.status === 'archived'
            ? 'Restore this project to active work.'
            : 'Archive this project. It can be restored later.'}
        </p>
        <Button
          variant={project.status === 'archived' ? 'outline' : 'destructive'}
          onClick={archive}
        >
          {project.status === 'archived' ? 'Restore project' : 'Archive project'}
        </Button>
      </section>
    </div>
  )
}
