'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { createCalendarEventAction } from '@/app/dashboard/calendar/actions'
export function CreateCalendarEvent({
  workspaceId,
  userId,
  projects,
  defaultProjectId,
}: {
  workspaceId: string
  userId: string
  projects: Array<{ id: string; name: string }>
  defaultProjectId?: string
}) {
  const [open, setOpen] = useState(false),
    [error, setError] = useState<string | null>(null),
    [saving, setSaving] = useState(false)
  if (!projects.length) return null
  return (
    <>
      {<Button onClick={() => setOpen(true)}>New event</Button>}
      {open && (
        <Dialog labelledBy="new-event-title" onClose={() => setOpen(false)}>
          <div className="mb-5 flex justify-between">
            <h2 id="new-event-title">New calendar event</h2>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault()
              setSaving(true)
              const d = new FormData(event.currentTarget)
              const result = await createCalendarEventAction({
                workspaceId,
                userId,
                projectId: String(d.get('projectId')),
                type: String(d.get('type')) as 'meeting' | 'milestone',
                title: String(d.get('title')),
                startsAt: String(d.get('startsAt')),
                endsAt: String(d.get('endsAt')),
              })
              setSaving(false)
              setError(result.error)
              if (!result.error) setOpen(false)
            }}
          >
            <label className="grid gap-1 text-sm">
              Type
              <select name="type" className="h-10 rounded-lg border bg-background px-3">
                <option value="meeting">Meeting</option>
                <option value="milestone">Milestone</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Project
              <select
                name="projectId"
                defaultValue={defaultProjectId ?? projects[0]!.id}
                className="h-10 rounded-lg border bg-background px-3"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Title
              <Input name="title" required />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                Starts
                <Input name="startsAt" type="datetime-local" required />
              </label>
              <label className="grid gap-1 text-sm">
                Ends
                <Input name="endsAt" type="datetime-local" />
              </label>
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? 'Creating�' : 'Create event'}
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </>
  )
}
